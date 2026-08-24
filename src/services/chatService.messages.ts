import { supabase } from "../lib/supabase";
import {
  ChatMessage,
  MessageDeliveryStatus,
  MessageInfo,
  ReactionCategory,
  StarCollection,
  ReportReason,
  MessageEditHistory,
  StarredMessage,
  MessageReaction,
} from "../types";
import {
  isValidUuid,
  quoteValue,
  generateUuid,
  deriveRoomId,
  filterVanishingMessages,
} from "./chatService.utils";
import { HYMLI_AI_BOT_ID, hymliAiService } from "./hymliAiService";

/**
 * Message persistence + realtime operations against the Supabase `messages`
 * table. Handles send, fetch, subscribe, read-receipts, and deletes while
 * guarding against non-UUID client-generated temp IDs.
 */

/**
 * Insert new message directly to Supabase `messages` table
 */
export async function sendMessage(
  msg: Partial<ChatMessage> & { sender_id: string; receiver_id: string },
): Promise<ChatMessage> {
  // Resolve the current authenticated user directly from Supabase auth state
  // (not local state / hardcoded IDs) so we compute `is_me` correctly and can
  // guard against a null/missing sender_id (which would otherwise cause a
  // foreign-key violation on `messages.sender_id`).
  let currentUserId = "";
  try {
    const { data } = await supabase.auth.getUser();
    currentUserId = data?.user?.id || "";
  } catch (err) {
    console.warn("[ChatService] Could not resolve auth user for is_me:", err);
  }

  const is_me = Boolean(currentUserId) && msg.sender_id === currentUserId;

  // FRIENDLY ERROR GUARD: `sender_id` must be a real, non-empty value that
  // (ideally) matches the authenticated user. If it's null/missing we throw a
  // clear message BEFORE hitting the DB, instead of letting Supabase return a
  // foreign-key violation on `messages.sender_id`.
  if (!msg.sender_id || !String(msg.sender_id).trim()) {
    throw new Error(
      "Cannot send message: sender is not authenticated. Please sign in and try again.",
    );
  }

  // Resolve the room (conversation) ID. The `messages` table has a NOT NULL
  // `room_id` column, so we must always include it. Prefer the explicit
  // `room_id` passed by the caller (activeConv.id), fall back to the legacy
  // `conversation_id`, then derive a stable room id from both user UUIDs.
  //
  // IMPORTANT: `activeConv.id` is frequently a display id like
  // `conv_<partnerUuid>` (e.g. "conv_c72c4cdf-..."). The `messages.room_id`
  // column is a UUID type, so we strip any non-UUID prefix and validate the
  // result. If it's still not a valid UUID, we omit `room_id` from the insert
  // payload so PostgREST does not throw an "invalid input syntax for type
  // uuid" error.
  const rawRoomId =
    msg.room_id ||
    (msg as any).conversation_id ||
    deriveRoomId(msg.sender_id, msg.receiver_id);

  // Strip any leading non-UUID prefix like "conv_".
  const sanitizedRoomId = String(rawRoomId)
    .replace(/^conv_/i, "")
    .trim();

  // Only include room_id if it passes UUID validation; otherwise omit it.
  const roomId = isValidUuid(sanitizedRoomId) ? sanitizedRoomId : undefined;

  // Resolve the message text from the explicit `text` field or the `content`
  // alias passable by callers/Hymli AI. Guarantee it is ALWAYS a non-null,
  // non-undefined, non-empty string before building the DB payload.
  const messageText = String(msg.text || (msg as any).content || "").trim();

  const newMessage: ChatMessage = {
    id: msg.id && isValidUuid(msg.id) ? msg.id : generateUuid(),
    room_id: roomId,
    sender_id: msg.sender_id,
    receiver_id: msg.receiver_id,
    text: messageText,
    created_at: msg.created_at || new Date().toISOString(),
    is_me,
    status: (msg.status ?? 1) as MessageDeliveryStatus, // 1 = Launched
    type: msg.type || "text",
    image_url: msg.image_url,
    video_url: msg.video_url,
    audio_url: msg.audio_url,
    audio_duration: msg.audio_duration,
    is_encrypted: msg.is_encrypted ?? true,
    burn_at: msg.burn_at,
    reply_to_id: msg.reply_to_id,
    reply_preview: msg.reply_preview,
    call_info: msg.call_info,
  };

  try {
    const insertPayload: Record<string, any> = {
      id: newMessage.id,
      sender_id: newMessage.sender_id,
      receiver_id: newMessage.receiver_id,
      // `text` is the canonical `messages.text` column; `content` is included
      // as a robust alias so the row is readable regardless of which column
      // the DB/realtime layer surfaces. Both derive from the same guaranteed
      // non-empty `messageText` string.
      text: messageText,
      content: messageText,
      type: newMessage.type,
      delivery_state: newMessage.status as number | null,
      image_url: newMessage.image_url,
      video_url: newMessage.video_url,
      audio_url: newMessage.audio_url,
      audio_duration: newMessage.audio_duration,
      is_encrypted: newMessage.is_encrypted,
      burn_at: newMessage.burn_at,
      call_info: newMessage.call_info,
      created_at: newMessage.created_at,
    };
    if (newMessage.reply_to_id) insertPayload.reply_to_id = newMessage.reply_to_id;
    if (newMessage.reply_preview) insertPayload.reply_preview = newMessage.reply_preview;
    // Only attach room_id when it is a valid UUID; otherwise omit it so the
    // insert does not fail (or violate the NOT NULL constraint) with an
    // invalid/non-UUID or stripped-to-empty value.
    if (newMessage.room_id) {
      insertPayload.room_id = newMessage.room_id;
    }

    const { error } = await supabase.from("messages").insert(insertPayload);

    if (error) {
      console.warn("[ChatService] Could not persist to DB:", error.message);
    }
  } catch (err) {
    console.warn("[ChatService] Network exception inserting message:", err);
  }

  // ---- INSTANT BROADCAST DELIVERY ----
  // Push the message out on the receiver's broadcast channel
  // (`chat:${receiverId}:${senderId}`). The receiving client subscribes to
  // exactly this channel in subscribeToMessages, so the message arrives
  // immediately without waiting for DB replication.
  //
  // STACK-OVERFLOW GUARD: previously the subscribe callback called
  // `supabase.removeChannel(bc)` directly inside the callback. Removing a
  // channel fires status/close events that re-invoked the same callback,
  // which recursed forever and threw
  // `RangeError: Maximum call stack size exceeded`. We now (1) fire the
  // send exactly once via a `sentOnce` flag, and (2) schedule the cleanup
  // asynchronously with `setTimeout` so it can never re-enter this callback
  // synchronously.
  try {
    const receiverRoom = `chat:${newMessage.receiver_id}:${newMessage.sender_id}`;
    // Remove any stale broadcast channel on this exact topic to avoid sending
    // into an already-closed/subscribed duplicate.
    supabase.getChannels().forEach((ch) => {
      if (String(ch.topic || "").replace(/^realtime:/, "") === receiverRoom) {
        try {
          supabase.removeChannel(ch);
        } catch (e) {
          /* noop */
        }
      }
    });

    const bc = supabase.channel(receiverRoom);
    let sentOnce = false;
    await bc.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        if (sentOnce) return;
        sentOnce = true;
        bc.send({
          type: "broadcast",
          event: "new-message",
          payload: { message: newMessage },
        }).catch((e) => {
          console.warn("[ChatService] Broadcast send failed:", e);
        });
      }
      // Defer the channel removal so the subscribe callback can finish cleanly
      // without being re-entered by the resulting status events (prevents the
      // "Maximum call stack size exceeded" RangeError).
      setTimeout(() => {
        try {
          supabase.removeChannel(bc);
        } catch (e) {
          /* noop — channel may already be removed */
        }
      }, 0);
    });
  } catch (err) {
    console.warn("[ChatService] Broadcast delivery failed:", err);
  }

  // ---- CLEAR UNREAD ON REPLY (DB) ----
  // Whenever the user sends a message to a contact, immediately mark that
  // contact's messages to me as read. This keeps the unread state consistent
  // across all send paths (ChatView, ChatInputBar, attachments, forwards) so
  // the incoming badge clears immediately and stays cleared after reload.
  // Fire-and-forget: never block or fail the send path on this update.
  if (currentUserId && isValidUuid(newMessage.receiver_id)) {
    (async () => {
      try {
        await supabase
          .from("messages")
          .update({ is_read: true, delivery_state: 3, status: 3 })
          .eq("sender_id", newMessage.receiver_id)
          .eq("receiver_id", currentUserId);
      } catch (err) {
        console.warn("[ChatService] mark-as-read on reply error:", err);
}
    })();
  }

  // ---- HYMLI AI AUTO-RESPONDER ----
  // If the user is messaging the Hymli AI bot, immediately trigger the AI
  // engine so the bot replies and the reply is persisted AND broadcast so it
  // appears instantly in the chat UI (not just whenever DB replication fires
  // the postgres_changes listener). The reply row is inserted with
  // sender_id = HYMLI_AI_BOT_ID and receiver_id = the current user, making it
  // appear as a normal incoming message in the chat.
  //
  // Detection is robust: it matches the canonical HYMLI_AI_BOT_ID, the legacy
  // `'hymli-ai'` string alias, and any receiver flagged as an AI partner.
  const isHymliTarget =
    String(newMessage.receiver_id) === String(HYMLI_AI_BOT_ID) ||
    String(newMessage.receiver_id).toLowerCase() === "hymli-ai" ||
    (newMessage as any).receiver_is_ai === true;

  if (isHymliTarget && currentUserId && messageText.trim().length > 0) {
    // Fire-and-forget: never block or crash the send path on the AI response.
    (async () => {
      try {
        // Generate the AI reply. Pass saveMessagesToDb=false because the user's
        // message is ALREADY persisted by sendMessage above, and we persist the
        // AI reply ourselves below via sendMessage (which broadcasts it).
        const replyText = await hymliAiService.askHymli(
          messageText,
          currentUserId,
          newMessage.room_id,
          false,
        );

        if (replyText && replyText.trim().length > 0) {
          // Persist + broadcast the AI reply through the same sendMessage path
          // so it appears in the UI immediately (sender = bot, receiver = user).
          await sendMessage({
            room_id: newMessage.room_id,
            sender_id: HYMLI_AI_BOT_ID,
            receiver_id: currentUserId,
            text: replyText,
            created_at: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.warn("[ChatService] Hymli AI auto-reply failed:", err);
      }
    })();
  }

  return newMessage;
}

/**
 * Fetch messages for a specific conversation from Supabase `messages` table
 */
export async function fetchMessages(
  currentUserId: string,
  targetUserId: string,
): Promise<ChatMessage[]> {
  if (
    !currentUserId ||
    !targetUserId ||
    !isValidUuid(currentUserId) ||
    !isValidUuid(targetUserId)
  ) {
    return [];
  }
  try {
    const currentUserIdQuoted = quoteValue(currentUserId);
    const targetUserIdQuoted = quoteValue(targetUserId);
    const filterStr = `and(sender_id.eq.${currentUserIdQuoted},receiver_id.eq.${targetUserIdQuoted}),and(sender_id.eq.${targetUserIdQuoted},receiver_id.eq.${currentUserIdQuoted})`;

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(filterStr)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[ChatService] Error fetching messages:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        filter: filterStr,
      });
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    const mapped: ChatMessage[] = data.map((item: any) => ({
      id: item.id || `msg-${Math.random()}`,
      sender_id: item.sender_id,
      receiver_id: item.receiver_id,
      text: item.text || item.content || "",
      created_at: item.created_at || new Date().toISOString(),
      is_me: item.sender_id === currentUserId,
      status: (typeof item.status === "number"
        ? item.status
        : 3) as MessageDeliveryStatus,
      type: item.type || "text",
      image_url: item.image_url,
      video_url: item.video_url,
      audio_url: item.audio_url,
      audio_duration: item.audio_duration,
      is_encrypted: item.is_encrypted ?? true,
      burn_at: item.burn_at,
      reply_to_id: item.reply_to_id,
      reply_preview: item.reply_preview,
      call_info: item.call_info,
    }));

    return filterVanishingMessages(mapped);
  } catch (err) {
    console.warn("[ChatService] Error on message fetch:", err);
    return [];
  }
}

type MessageUpdateCallback = (
  msg: Partial<ChatMessage> & { id: string },
) => void;

/**
 * Realtime Listener for messages table (INSERT and UPDATE for status updates).
 *
 * Reliability fixes:
 *  - Waits for the channel to reach "SUBSCRIBED" before trusting events.
 *  - Listens to BOTH supabase postgres_changes on the `messages` table AND a
 *    direct broadcast event on `chat:${roomId}`. This way a message updates
 *    instantly via the broadcast path even if DB replication lags, and the
 *    postgres_changes path still catches it for durability/other clients.
 */
export function subscribeToMessages(
  currentUserId: string,
  targetUserId: string,
  onNewMessage: (msg: ChatMessage) => void,
  onUpdateMessage?: MessageUpdateCallback,
) {
  const topicBase = `chat_${currentUserId}_${targetUserId}`;
  const existing = supabase.getChannels();
  existing.forEach((ch) => {
    if (
      ch.topic === `realtime:${topicBase}` ||
      ch.topic.startsWith(`realtime:${topicBase}_`)
    ) {
      supabase.removeChannel(ch);
    }
  });

  const channelName = `${topicBase}_${Math.random().toString(36).substring(2, 9)}`;
  const roomId = `chat:${currentUserId}:${targetUserId}`;

  // Broadcast channel for instant message delivery (bypasses DB replication lag).
  const broadcastChannel = supabase.channel(roomId);
  broadcastChannel
    .on("broadcast", { event: "new-message" }, ({ payload }) => {
      if (payload && payload.message) {
        onNewMessage(payload.message);
        // Mark message as delivered to this client
        markDelivered(payload.message.id, currentUserId);
      }
    })
    .on("broadcast", { event: "update-message" }, ({ payload }) => {
      if (payload && payload.message && onUpdateMessage) {
        onUpdateMessage(payload.message);
      }
    })
    .subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        // Broadcast channel live — new messages will arrive instantly.
      }
    });

  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
      },
      (payload) => {
        const item = payload.new;
        if (
          (item.sender_id === currentUserId &&
            item.receiver_id === targetUserId) ||
          (item.sender_id === targetUserId &&
            item.receiver_id === currentUserId)
        ) {
          const incoming: ChatMessage = {
            id: item.id,
            sender_id: item.sender_id,
            receiver_id: item.receiver_id,
            text: item.text || item.content || "",
            created_at: item.created_at,
            is_me: item.sender_id === currentUserId,
            status: (typeof item.status === "number"
              ? item.status
              : 1) as MessageDeliveryStatus,
            type: item.type || "text",
            image_url: item.image_url,
            video_url: item.video_url,
            audio_url: item.audio_url,
            audio_duration: item.audio_duration,
            is_encrypted: item.is_encrypted ?? true,
            burn_at: item.burn_at,
            reply_to_id: item.reply_to_id,
            reply_preview: item.reply_preview,
            call_info: item.call_info,
          };

          onNewMessage(incoming);
        }
      },
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "messages",
      },
      (payload) => {
        const item = payload.new;
        if (
          (item.sender_id === currentUserId &&
            item.receiver_id === targetUserId) ||
          (item.sender_id === targetUserId &&
            item.receiver_id === currentUserId)
        ) {
          if (onUpdateMessage) {
            onUpdateMessage({
              id: item.id,
              status: (typeof item.status === "number"
                ? item.status
                : item.delivery_state || 3) as MessageDeliveryStatus,
              text: item.text,
            });
          }
        }
      },
    );

  // Ensure the channel is subscribed before sending/relying on it.
  channel.subscribe(async (status) => {
    if (status === "SUBSCRIBED") {
      // postgres_changes listener is live.
    }
  });

  return () => {
    supabase.removeChannel(channel);
    supabase.removeChannel(broadcastChannel);
  };
}

/**
 * Advance message delivery status to 3 (Submerged) when read in viewport
 */
export async function markSubmerged(
  messageId: string,
  currentUserId: string,
): Promise<boolean> {
  // Only attempt to update rows that carry a valid database UUID. Client
  // messages not yet persisted may still hold generated IDs; guarding here
  // prevents PostgREST from returning HTTP 400 on `.eq("id", ...)` filters.
  if (!isValidUuid(messageId)) {
    return false;
  }

  try {
    const { error } = await supabase.rpc("mark_message_submerged", {
      p_message_id: messageId,
      p_user_id: currentUserId,
    });

    if (error) {
      // RPC may be missing (404) or restricted by RLS. Fall back to a
      // direct UPDATE against the correct `delivery_state` column.
      await supabase
        .from("messages")
        .update({ delivery_state: 3, is_read: true, status: 3 })
        .eq("id", messageId)
        .eq("receiver_id", currentUserId);
    }
    return true;
  } catch (err) {
    // Fail silently so the read-receipt path never breaks message sending.
    return false;
  }
}

/**
 * Advance message delivery status to 2 (Docked) when delivered to client
 */
export async function markDelivered(
  messageId: string,
  currentUserId: string,
): Promise<boolean> {
  if (!isValidUuid(messageId)) {
    return false;
  }

  try {
    const { error } = await supabase
      .from("messages")
      .update({ delivery_state: 2, status: 2 })
      .eq("id", messageId)
      .eq("receiver_id", currentUserId)
      .gte("delivery_state", 1) // Only update if status is Sent (1) or Failed (0)
      .lt("delivery_state", 2); // Only update if status is less than Delivered (2)

    if (error) {
      console.warn(
        "[ChatService] Error marking message delivered:",
        error.message,
      );
    }
    return !error;
  } catch (err) {
    console.warn("[ChatService] Exception marking message delivered:", err);
    return false;
  }
}

/**
 * Update a message's text content and set an edited_at timestamp.
 */
export async function editMessage(
  messageId: string,
  newText: string,
): Promise<boolean> {
  if (!isValidUuid(messageId)) {
    return false;
  }
  try {
    const { error } = await supabase
      .from("messages")
      .update({ text: newText, edited_at: new Date().toISOString() })
      .eq("id", messageId);

    if (error) {
      console.warn("[ChatService] Error editing message:", error.message);
    }
    return !error;
  } catch (err) {
    console.warn("[ChatService] Exception editing message:", err);
    return false;
  }
}

/**
 * Delete a message by ID from Supabase
 */
export async function deleteMessage(messageId: string): Promise<boolean> {
  if (!isValidUuid(messageId)) {
    return false;
  }
  try {
    const { error } = await supabase
      .from("messages")
      .update({ is_deleted: true, text: "" }) // Soft delete: set is_deleted to true and clear text
      .eq("id", messageId);
    if (error) {
      console.warn("[ChatService] Error soft-deleting message:", error.message);
    }
    return !error;
  } catch (err) {
    console.warn("[ChatService] Exception soft-deleting message:", err);
    return false;
  }
}

/**
 * Clear chat history between two users
 */
export async function clearHistory(
  currentUserId: string,
  targetUserId: string,
): Promise<boolean> {
  if (
    !currentUserId ||
    !targetUserId ||
    !isValidUuid(currentUserId) ||
    !isValidUuid(targetUserId)
  ) {
    return false;
  }
  try {
    const currentUserIdQuoted = quoteValue(currentUserId);
    const targetUserIdQuoted = quoteValue(targetUserId);
    const filterStr = `and(sender_id.eq.${currentUserIdQuoted},receiver_id.eq.${targetUserIdQuoted}),and(sender_id.eq.${targetUserIdQuoted},receiver_id.eq.${currentUserIdQuoted})`;

    const { error } = await supabase.from("messages").delete().or(filterStr);
    if (error) {
      console.warn("[ChatService] Error clearing history:", error.message);
    }
    return !error;
  } catch (err) {
    console.warn("[ChatService] Exception clearing history:", err);
    return false;
  }
}

// ============================================================================
// MESSAGE ACTION ENGINE — Advanced Supabase Operations
// ============================================================================

/**
 * Persist an emoji reaction to a message in Supabase.
 * Upserts (one reaction per user per message).
 */
export async function reactToMessage(
  messageId: string,
  userId: string,
  emoji: string,
  category: ReactionCategory = "Frequently Used",
): Promise<boolean> {
  if (!isValidUuid(messageId) || !isValidUuid(userId)) return false;
  try {
    const { error } = await supabase.from("message_reactions").upsert(
      {
        message_id: messageId,
        user_id: userId,
        emoji,
        category: category.toLowerCase().replace(/\s+/g, "_") as any,
      },
      { onConflict: "message_id,user_id" },
    );
    if (error)
      console.warn("[ChatService] reactToMessage error:", error.message);
    return !error;
  } catch (err) {
    console.warn("[ChatService] reactToMessage exception:", err);
    return false;
  }
}

/**
 * Forward messages to multiple target users by batch-inserting copies
 * with a "Forwarded:" prefix.
 */
export async function forwardMessages(
  messageIds: string[],
  targetUserIds: string[],
  senderId: string,
): Promise<boolean> {
  if (!isValidUuid(senderId)) return false;
  try {
    // Fetch the original messages
    const { data: originals, error: fetchErr } = await supabase
      .from("messages")
      .select("*")
      .in(
        "id",
        messageIds.filter((id) => isValidUuid(id)),
      );

    if (fetchErr || !originals || originals.length === 0) {
      console.warn("[ChatService] forwardMessages: no originals found");
      return false;
    }

    const inserts: any[] = [];
    for (const targetId of targetUserIds) {
      if (!isValidUuid(targetId)) continue;
      for (const orig of originals) {
        inserts.push({
          id: generateUuid(),
          sender_id: senderId,
          receiver_id: targetId,
          text: `📤 Forwarded: ${orig.text || ""}`,
          type: orig.type || "text",
          image_url: orig.image_url,
          delivery_state: 1,
          is_encrypted: true,
          created_at: new Date().toISOString(),
        });
      }
    }

    if (inserts.length === 0) return false;
    const { error } = await supabase.from("messages").insert(inserts);
    if (error)
      console.warn("[ChatService] forwardMessages error:", error.message);
    return !error;
  } catch (err) {
    console.warn("[ChatService] forwardMessages exception:", err);
    return false;
  }
}

/**
 * Star / bookmark a message into a named collection.
 */
export async function starMessage(
  messageId: string,
  userId: string,
  collection: StarCollection = "Read Later",
): Promise<StarredMessage | null> {
  if (!isValidUuid(messageId) || !isValidUuid(userId)) return null;
  try {
    const { data, error } = await supabase
      .from("starred_messages")
      .upsert(
        { message_id: messageId, user_id: userId, collection },
        { onConflict: "message_id,user_id" },
      )
      .select()
      .single();
    if (error) throw error;
    return data as StarredMessage;
  } catch (err) {
    console.warn("[ChatService] starMessage error:", err);
    return null;
  }
}

/**
 * Remove a star/bookmark from a message.
 */
export async function unstarMessage(
  messageId: string,
  userId: string,
): Promise<boolean> {
  if (!isValidUuid(messageId) || !isValidUuid(userId)) return false;
  try {
    const { error } = await supabase
      .from("starred_messages")
      .delete()
      .eq("message_id", messageId)
      .eq("user_id", userId);
    if (error)
      console.warn("[ChatService] unstarMessage error:", error.message);
    return !error;
  } catch (err) {
    console.warn("[ChatService] unstarMessage exception:", err);
    return false;
  }
}

/**
 * Report a message for moderation.
 */
export async function reportMessage(
  messageId: string,
  reporterId: string,
  reason: ReportReason = "Spam",
): Promise<boolean> {
  if (!isValidUuid(messageId) || !isValidUuid(reporterId)) return false;
  try {
    const { error } = await supabase.from("message_reports").insert({
      message_id: messageId,
      reporter_id: reporterId,
      reason,
    });
    if (error)
      console.warn("[ChatService] reportMessage error:", error.message);
    return !error;
  } catch (err) {
    console.warn("[ChatService] reportMessage exception:", err);
    return false;
  }
}

/**
 * Get rich delivery info for a message (sent/delivered/read timestamps,
 * encryption hash, etc.).
 */
export async function getMessageInfo(
  messageId: string,
  currentUserId: string,
): Promise<MessageInfo | null> {
  if (!isValidUuid(messageId)) return null;
  try {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("id", messageId)
      .single();

    if (error || !data) {
      console.warn("[ChatService] getMessageInfo error:", error?.message);
      return null;
    }

    // Build a simple encryption hash from the message id
    const encHash = data.id
      ? `sha256$${data.id.slice(0, 8)}${data.created_at ? new Date(data.created_at).getTime().toString(16).slice(0, 8) : "00000000"}`
      : "sha256$$unknown";

    return {
      id: data.id,
      sent_at: data.created_at,
      delivered_at: data.delivery_state >= 2 ? data.created_at : undefined,
      read_at: data.delivery_state >= 3 ? data.created_at : undefined,
      encryption_hash: encHash,
      sender_id: data.sender_id,
      receiver_id: data.receiver_id,
      delivery_state: (data.delivery_state ?? 1) as MessageDeliveryStatus,
    };
  } catch (err) {
    console.warn("[ChatService] getMessageInfo exception:", err);
    return null;
  }
}

/**
 * Toggle a message's pinned status with an optional expiry.
 */
export async function pinMessage(
  messageId: string,
  userId: string,
  duration: "24 Hours" | "7 Days" | "30 Days" = "24 Hours",
  isPinned: boolean = true,
): Promise<boolean> {
  if (!isValidUuid(messageId)) return false;
  try {
    const hours =
      duration === "24 Hours" ? 24 : duration === "7 Days" ? 168 : 720;
    const payload: Record<string, any> = { is_pinned: isPinned };
    if (isPinned) {
      payload.pin_expires_at = new Date(
        Date.now() + hours * 3600000,
      ).toISOString();
    } else {
      payload.pin_expires_at = null;
    }
    const { error } = await supabase
      .from("messages")
      .update(payload)
      .eq("id", messageId);
    if (error) console.warn("[ChatService] pinMessage error:", error.message);
    return !error;
  } catch (err) {
    console.warn("[ChatService] pinMessage exception:", err);
    return false;
  }
}

/**
 * Save the previous version of a message to the edit-history log.
 */
export async function saveEditHistory(
  messageId: string,
  previousText: string,
): Promise<boolean> {
  if (!isValidUuid(messageId)) return false;
  try {
    const { error } = await supabase.from("message_edit_history").insert({
      message_id: messageId,
      previous_text: previousText,
    });
    if (error)
      console.warn("[ChatService] saveEditHistory error:", error.message);
    return !error;
  } catch (err) {
    console.warn("[ChatService] saveEditHistory exception:", err);
    return false;
  }
}

/**
 * Fetch all prior edit versions for a message.
 */
export async function fetchEditHistory(
  messageId: string,
): Promise<MessageEditHistory[]> {
  if (!isValidUuid(messageId)) return [];
  try {
    const { data, error } = await supabase
      .from("message_edit_history")
      .select("*")
      .eq("message_id", messageId)
      .order("edited_at", { ascending: false });
    if (error) throw error;
    return (data as MessageEditHistory[]) || [];
  } catch (err) {
    console.warn("[ChatService] fetchEditHistory error:", err);
    return [];
  }
}
