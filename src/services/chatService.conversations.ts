import { supabase } from "../lib/supabase";
import { ChatMessage, Conversation, MessageDeliveryStatus } from "../types";
import {
  isValidUuid,
  quoteValue,
  filterVanishingMessages,
} from "./chatService.utils";

/**
 * Fetch conversations grouped by partner user from Supabase `messages` table
 */
export async function fetchConversations(
  currentUserId: string,
): Promise<Conversation[]> {
  if (!currentUserId || !isValidUuid(currentUserId)) {
    return [];
  }
  try {
    const currentUserIdQuoted = quoteValue(currentUserId);
    // Fetch all messages involving the current user
    const { data: rawMessages, error } = await supabase
      .from("messages")
      .select("*")
      .or(
        `sender_id.eq.${currentUserIdQuoted},receiver_id.eq.${currentUserIdQuoted}`,
      )
      .order("created_at", { ascending: true });

    if (error) {
      console.error(
        "[ChatService] Error fetching conversations (messages query):",
        {
          message: error.message,
          details: error.details,
          hint: error.hint,
          filter: `sender_id.eq.${currentUserIdQuoted},receiver_id.eq.${currentUserIdQuoted}`,
        },
      );
      return [];
    }

    if (!rawMessages || rawMessages.length === 0) {
      return [];
    }

    // Group messages by partner user ID
    const convMap: Record<string, ChatMessage[]> = {};
    rawMessages.forEach((item: any) => {
      const partnerId =
        item.sender_id === currentUserId ? item.receiver_id : item.sender_id;
      if (!partnerId) return;

      if (!convMap[partnerId]) {
        convMap[partnerId] = [];
      }

      convMap[partnerId].push({
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
        audio_duration: item.audio_duration,
        is_encrypted: item.is_encrypted ?? true,
        burn_at: item.burn_at,
        reply_to_id: item.reply_to_id,
        reply_preview: item.reply_preview,
        call_info: item.call_info,
      });
    });

    // Fetch profiles for all partner IDs
    const partnerIds = Object.keys(convMap);
    const { data: profileRows } = await supabase
      .from("profiles")
      .select("*")
      .in("id", partnerIds);

    const profileMap: Record<string, any> = {};
    if (profileRows) {
      profileRows.forEach((p: any) => {
        profileMap[p.id] = p;
      });
    }

    const conversations: Conversation[] = partnerIds.map((partnerId) => {
      const msgs = filterVanishingMessages(convMap[partnerId]);
      const lastMsgObj = msgs[msgs.length - 1];
      const prof = profileMap[partnerId] || {};

      return {
        id: `conv_${partnerId}`,
        user: {
          id: partnerId,
          name: prof.full_name || prof.username || "Nautical Contact",
          avatar:
            prof.avatar_url ||
            `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150`,
          is_online: Boolean(prof.is_online),
          last_seen: prof.last_seen || "Recently",
          nautical_presence:
            prof.nautical_presence ||
            (prof.is_online ? "in_focus" : "last_anchored"),
          last_anchored: prof.last_anchored,
        },
        lastMessage: lastMsgObj ? lastMsgObj.text : "",
        lastMessageTime: lastMsgObj
          ? new Date(lastMsgObj.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "",
        last_message_at: lastMsgObj ? lastMsgObj.created_at : undefined,
        unreadCount: msgs.filter((m) => !m.is_me && m.status !== 3).length,
        messages: msgs,
      };
    });

    return conversations;
  } catch (err) {
    console.warn("[ChatService] Exception building conversations:", err);
    return [];
  }
}
