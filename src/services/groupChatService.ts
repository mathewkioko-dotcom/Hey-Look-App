import { supabase } from "../lib/supabase";
import { ChatMessage, ChatRoom, Profile, RoomEvent, RoomJoinRequest, RoomMember } from "../types";
import { generateUuid, filterVanishingMessages } from "./chatService.utils";

/**
 * Real, persisted group chats & channels (WhatsApp/Telegram-style), backed
 * by the `chat_rooms` + `room_members` tables and reusing the `messages`
 * table (room_id set, receiver_id null) for the actual conversation.
 */

function mapRoomRow(r: any, memberCount: number, myRole: "admin" | "member"): ChatRoom {
  return {
    id: r.id,
    type: r.type,
    name: r.name,
    avatar_url: r.avatar_url || undefined,
    description: r.description || undefined,
    created_by: r.created_by,
    created_at: r.created_at,
    member_count: memberCount,
    my_role: myRole,
    rules: r.rules || undefined,
    enforce_rules: Boolean(r.enforce_rules),
    allow_edit_info: r.allow_edit_info ?? true,
    allow_send: r.allow_send ?? true,
    allow_add_members: r.allow_add_members ?? true,
    allow_pin: r.allow_pin ?? true,
    announcement_mode: Boolean(r.announcement_mode),
    max_upload_mb: r.max_upload_mb ?? 100,
    auto_delete_media: r.auto_delete_media || "Never",
    invite_code: r.invite_code || undefined,
    member_visibility: r.member_visibility || "everyone",
  };
}

/** Computes a `burn_at` timestamp for a media message based on the room's
 * "Auto-Delete Group Media" setting, or undefined for "Never". */
export function computeAutoDeleteBurnAt(autoDeleteMedia?: ChatRoom["auto_delete_media"]): string | undefined {
  const days = autoDeleteMedia === "After 30 days" ? 30 : autoDeleteMedia === "After 90 days" ? 90 : autoDeleteMedia === "After 1 year" ? 365 : 0;
  if (!days) return undefined;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

export async function createRoom(
  creatorId: string,
  type: "group" | "channel",
  name: string,
  memberIds: string[],
  avatarUrl?: string,
): Promise<ChatRoom | null> {
  try {
    const { data: room, error } = await supabase
      .from("chat_rooms")
      .insert({ type, name, avatar_url: avatarUrl || null, created_by: creatorId })
      .select()
      .single();

    if (error || !room) {
      console.warn("[GroupChatService] Room create note:", error?.message);
      return null;
    }

    const uniqueMemberIds = Array.from(new Set([creatorId, ...memberIds]));
    const memberRows = uniqueMemberIds.map((userId) => ({
      room_id: room.id,
      user_id: userId,
      role: userId === creatorId ? "admin" : "member",
    }));

    const { error: memberError } = await supabase.from("room_members").insert(memberRows);
    if (memberError) {
      console.warn("[GroupChatService] Room members insert note:", memberError.message);
      await supabase.from("chat_rooms").delete().eq("id", room.id);
      return null;
    }

    return mapRoomRow(room, uniqueMemberIds.length, "admin");
  } catch (err) {
    console.warn("[GroupChatService] Exception creating room:", err);
    return null;
  }
}

export async function fetchMyRooms(userId: string): Promise<ChatRoom[]> {
  try {
    const { data: memberships, error } = await supabase
      .from("room_members")
      .select("room_id, role, archived")
      .eq("user_id", userId);

    if (error || !memberships?.length) return [];

    const activeMemberships = memberships.filter((m: any) => !m.archived);
    if (!activeMemberships.length) return [];

    const roomIds = activeMemberships.map((m: any) => m.room_id);
    const { data: rooms } = await supabase.from("chat_rooms").select("*").in("id", roomIds);
    if (!rooms) return [];

    const { data: allMembers } = await supabase
      .from("room_members")
      .select("room_id")
      .in("room_id", roomIds);
    const countMap = new Map<string, number>();
    (allMembers || []).forEach((m: any) => countMap.set(m.room_id, (countMap.get(m.room_id) || 0) + 1));
    const roleMap = new Map<string, "admin" | "member">(activeMemberships.map((m: any) => [m.room_id, m.role]));

    return rooms.map((r: any) => mapRoomRow(r, countMap.get(r.id) || 1, roleMap.get(r.id) || "member"));
  } catch (err) {
    console.warn("[GroupChatService] Exception fetching rooms:", err);
    return [];
  }
}

export async function fetchRoomById(roomId: string, userId: string): Promise<ChatRoom | null> {
  try {
    const { data: room, error } = await supabase.from("chat_rooms").select("*").eq("id", roomId).maybeSingle();
    if (error || !room) return null;
    const { data: members } = await supabase.from("room_members").select("user_id, role").eq("room_id", roomId);
    const myRole = (members || []).find((m: any) => m.user_id === userId)?.role || "member";
    return mapRoomRow(room, (members || []).length || 1, myRole);
  } catch (err) {
    console.warn("[GroupChatService] Exception fetching room:", err);
    return null;
  }
}

export async function fetchRoomMembers(roomId: string): Promise<RoomMember[]> {
  try {
    const { data: members, error } = await supabase
      .from("room_members")
      .select("*")
      .eq("room_id", roomId);
    if (error || !members) return [];

    const userIds = members.map((m: any) => m.user_id);
    const { data: profiles } = await supabase.from("profiles").select("*").in("id", userIds);
    const profileMap = new Map<string, any>((profiles || []).map((p: any) => [p.id, p]));

    return members.map((m: any) => {
      const p = profileMap.get(m.user_id) || {};
      return {
        room_id: m.room_id,
        user_id: m.user_id,
        role: m.role,
        joined_at: m.joined_at,
        profile: {
          id: m.user_id,
          username: p.username || "nautical_user",
          full_name: p.full_name || p.username || "Nautical User",
          avatar_url: p.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(m.user_id)}`,
        } as Profile,
      };
    });
  } catch (err) {
    console.warn("[GroupChatService] Exception fetching members:", err);
    return [];
  }
}

export async function addMembers(roomId: string, userIds: string[]): Promise<boolean> {
  try {
    const rows = userIds.map((userId) => ({ room_id: roomId, user_id: userId, role: "member" }));
    const { error } = await supabase.from("room_members").upsert(rows, { onConflict: "room_id,user_id" });
    if (error) {
      console.warn("[GroupChatService] Add members note:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[GroupChatService] Exception adding members:", err);
    return false;
  }
}

export async function removeMember(roomId: string, userId: string): Promise<boolean> {
  const { error } = await supabase.from("room_members").delete().eq("room_id", roomId).eq("user_id", userId);
  if (error) console.warn("[GroupChatService] Remove member note:", error.message);
  return !error;
}

export async function setMemberRole(roomId: string, userId: string, role: "admin" | "member"): Promise<boolean> {
  const { error } = await supabase.from("room_members").update({ role }).eq("room_id", roomId).eq("user_id", userId);
  if (error) console.warn("[GroupChatService] Set role note:", error.message);
  return !error;
}

export async function leaveRoom(roomId: string, userId: string): Promise<boolean> {
  return removeMember(roomId, userId);
}

export async function deleteRoom(roomId: string): Promise<boolean> {
  const { error } = await supabase.from("chat_rooms").delete().eq("id", roomId);
  if (error) console.warn("[GroupChatService] Delete room note:", error.message);
  return !error;
}

export async function updateRoom(
  roomId: string,
  updates: { name?: string; description?: string; avatar_url?: string },
): Promise<boolean> {
  const { error } = await supabase.from("chat_rooms").update(updates).eq("id", roomId);
  if (error) console.warn("[GroupChatService] Update room note:", error.message);
  return !error;
}

export async function fetchRoomMessages(roomId: string): Promise<ChatMessage[]> {
  try {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true });
    if (error || !data) return [];

    const mapped: ChatMessage[] = data.map((item: any) => ({
      id: item.id,
      room_id: item.room_id,
      sender_id: item.sender_id,
      receiver_id: item.receiver_id || undefined,
      text: item.text || item.content || "",
      created_at: item.created_at,
      is_me: false,
      status: 3,
      type: item.type || "text",
      image_url: item.image_url,
      video_url: item.video_url,
      audio_url: item.audio_url,
      audio_duration: item.audio_duration,
      is_encrypted: item.is_encrypted ?? true,
      burn_at: item.burn_at || undefined,
    }));
    return filterVanishingMessages(mapped);
  } catch (err) {
    console.warn("[GroupChatService] Exception fetching room messages:", err);
    return [];
  }
}

export async function sendRoomMessage(
  roomId: string,
  senderId: string,
  text: string,
  extra?: { type?: "text" | "image" | "video"; image_url?: string; video_url?: string; burn_at?: string; mentioned_user_ids?: string[] },
): Promise<ChatMessage | null> {
  try {
    const id = generateUuid();
    const created_at = new Date().toISOString();
    const { error } = await supabase.from("messages").insert({
      id,
      room_id: roomId,
      sender_id: senderId,
      receiver_id: null,
      text,
      content: text,
      type: extra?.type || "text",
      image_url: extra?.image_url,
      video_url: extra?.video_url,
      burn_at: extra?.burn_at || null,
      mentioned_user_ids: extra?.mentioned_user_ids || [],
      created_at,
    });
    if (error) {
      console.warn("[GroupChatService] Send room message note:", error.message);
      return null;
    }
    return {
      id,
      room_id: roomId,
      sender_id: senderId,
      text,
      created_at,
      is_me: true,
      status: 1,
      type: extra?.type || "text",
      image_url: extra?.image_url,
      video_url: extra?.video_url,
      burn_at: extra?.burn_at,
    };
  } catch (err) {
    console.warn("[GroupChatService] Exception sending room message:", err);
    return null;
  }
}

/** Subscribe to new messages in a room via Postgres changes (live updates for all members). */
export function subscribeToRoomMessages(roomId: string, onInsert: (msg: ChatMessage) => void) {
  const channel = supabase
    .channel(`room_messages_${roomId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `room_id=eq.${roomId}` },
      (payload: any) => {
        const item = payload.new;
        onInsert({
          id: item.id,
          room_id: item.room_id,
          sender_id: item.sender_id,
          text: item.text || item.content || "",
          created_at: item.created_at,
          is_me: false,
          status: 3,
          type: item.type || "text",
          image_url: item.image_url,
          video_url: item.video_url,
        });
      },
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

/* ============================================================================
 * Room settings: permissions, announcement mode, rules, media policy.
 * All enforced server-side too (see the messages/room_members RLS policies).
 * ==========================================================================*/
export interface RoomSettingsUpdate {
  allow_edit_info?: boolean;
  allow_send?: boolean;
  allow_add_members?: boolean;
  allow_pin?: boolean;
  announcement_mode?: boolean;
  rules?: string;
  enforce_rules?: boolean;
  max_upload_mb?: number;
  auto_delete_media?: ChatRoom["auto_delete_media"];
  member_visibility?: ChatRoom["member_visibility"];
}

export async function updateRoomSettings(roomId: string, updates: RoomSettingsUpdate): Promise<boolean> {
  const { error } = await supabase.from("chat_rooms").update(updates).eq("id", roomId);
  if (error) console.warn("[GroupChatService] Update room settings note:", error.message);
  return !error;
}

export async function updateRoomNotificationPreferences(
  roomId: string,
  userId: string,
  mutedUntil: string | null,
  mentionsOnly: boolean,
): Promise<boolean> {
  const { error } = await supabase.from("conversation_preferences").upsert(
    { conversation_id: roomId, user_id: userId, muted_until: mutedUntil, mentions_only: mentionsOnly },
    { onConflict: "conversation_id,user_id" },
  );
  if (error) console.warn("[GroupChatService] Notification preference note:", error.message);
  return !error;
}

/* ============================================================================
 * Invite links + join requests (WhatsApp/Telegram-style "join via link").
 * ==========================================================================*/
export async function generateInviteCode(roomId: string): Promise<string | null> {
  const randomPart =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().slice(0, 8)
      : Date.now().toString(36);
  const code = `${roomId.slice(0, 8)}-${randomPart}`;
  const { error } = await supabase.from("chat_rooms").update({ invite_code: code }).eq("id", roomId);
  if (error) {
    console.warn("[GroupChatService] Generate invite code note:", error.message);
    return null;
  }
  return code;
}

/** Looks up a room by its invite code and files a join request for it (or
 * returns 'already-member' / 'not-found' so the UI can react accordingly). */
export async function requestToJoinByInviteCode(
  inviteCode: string,
  userId: string,
): Promise<"requested" | "already-member" | "not-found" | "error"> {
  try {
    const { data: room } = await supabase.from("chat_rooms").select("id").eq("invite_code", inviteCode).maybeSingle();
    if (!room) return "not-found";

    const { data: existingMember } = await supabase
      .from("room_members")
      .select("user_id")
      .eq("room_id", room.id)
      .eq("user_id", userId)
      .maybeSingle();
    if (existingMember) return "already-member";

    const { error } = await supabase
      .from("room_join_requests")
      .upsert({ room_id: room.id, user_id: userId, status: "pending" }, { onConflict: "room_id,user_id" });
    if (error) {
      console.warn("[GroupChatService] Join request note:", error.message);
      return "error";
    }
    return "requested";
  } catch (err) {
    console.warn("[GroupChatService] Exception requesting to join:", err);
    return "error";
  }
}

export async function fetchPendingJoinRequests(roomId: string): Promise<RoomJoinRequest[]> {
  try {
    const { data: requests, error } = await supabase
      .from("room_join_requests")
      .select("*")
      .eq("room_id", roomId)
      .eq("status", "pending");
    if (error || !requests?.length) return [];

    const userIds = requests.map((r: any) => r.user_id);
    const { data: profiles } = await supabase.from("profiles").select("*").in("id", userIds);
    const profileMap = new Map<string, any>((profiles || []).map((p: any) => [p.id, p]));

    return requests.map((r: any) => {
      const p = profileMap.get(r.user_id) || {};
      return {
        id: r.id,
        room_id: r.room_id,
        user_id: r.user_id,
        status: r.status,
        requested_at: r.requested_at,
        profile: {
          id: r.user_id,
          username: p.username || "nautical_user",
          full_name: p.full_name || p.username || "Nautical User",
          avatar_url: p.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(r.user_id)}`,
        } as Profile,
      };
    });
  } catch (err) {
    console.warn("[GroupChatService] Exception fetching join requests:", err);
    return [];
  }
}

export async function decideJoinRequest(
  requestId: string,
  roomId: string,
  userId: string,
  approve: boolean,
): Promise<boolean> {
  try {
    if (approve) {
      const { error: memberError } = await supabase
        .from("room_members")
        .upsert({ room_id: roomId, user_id: userId, role: "member" }, { onConflict: "room_id,user_id" });
      if (memberError) {
        console.warn("[GroupChatService] Approve join note:", memberError.message);
        return false;
      }
    }
    const { error } = await supabase
      .from("room_join_requests")
      .update({ status: approve ? "approved" : "rejected" })
      .eq("id", requestId);
    if (error) console.warn("[GroupChatService] Update join request note:", error.message);
    return !error;
  } catch (err) {
    console.warn("[GroupChatService] Exception deciding join request:", err);
    return false;
  }
}

/* ============================================================================
 * Group event planner.
 * ==========================================================================*/
export async function fetchRoomEvents(roomId: string, userId: string): Promise<RoomEvent[]> {
  try {
    const { data: events, error } = await supabase
      .from("room_events")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true });
    if (error || !events?.length) return [];

    const eventIds = events.map((e: any) => e.id);
    const { data: rsvps } = await supabase.from("room_event_rsvps").select("*").in("event_id", eventIds);
    const goingCount = new Map<string, number>();
    const myRsvp = new Map<string, "going" | "not_going">();
    (rsvps || []).forEach((r: any) => {
      if (r.status === "going") goingCount.set(r.event_id, (goingCount.get(r.event_id) || 0) + 1);
      if (r.user_id === userId) myRsvp.set(r.event_id, r.status);
    });

    return events.map((e: any) => ({
      id: e.id,
      room_id: e.room_id,
      created_by: e.created_by,
      title: e.title,
      event_date: e.event_date || undefined,
      created_at: e.created_at,
      going_count: goingCount.get(e.id) || 0,
      my_rsvp: myRsvp.get(e.id),
    }));
  } catch (err) {
    console.warn("[GroupChatService] Exception fetching room events:", err);
    return [];
  }
}

export async function createRoomEvent(
  roomId: string,
  createdBy: string,
  title: string,
  eventDate: string,
): Promise<boolean> {
  const { error } = await supabase.from("room_events").insert({ room_id: roomId, created_by: createdBy, title, event_date: eventDate });
  if (error) console.warn("[GroupChatService] Create event note:", error.message);
  return !error;
}

export async function updateRoomEvent(eventId: string, title: string, eventDate: string): Promise<boolean> {
  const { error } = await supabase.from("room_events").update({ title, event_date: eventDate }).eq("id", eventId);
  if (error) console.warn("[GroupChatService] Update event note:", error.message);
  return !error;
}

export async function rsvpToEvent(eventId: string, userId: string, status: "going" | "not_going"): Promise<boolean> {
  const { error } = await supabase
    .from("room_event_rsvps")
    .upsert({ event_id: eventId, user_id: userId, status }, { onConflict: "event_id,user_id" });
  if (error) console.warn("[GroupChatService] RSVP note:", error.message);
  return !error;
}

/* ============================================================================
 * Archive (hide a room from your own list without leaving it).
 * ==========================================================================*/
export async function setRoomArchived(roomId: string, userId: string, archived: boolean): Promise<boolean> {
  const { error } = await supabase.from("room_members").update({ archived }).eq("room_id", roomId).eq("user_id", userId);
  if (error) console.warn("[GroupChatService] Archive room note:", error.message);
  return !error;
}

/* ============================================================================
 * Transfer ownership \u2014 re-verifies the current user's password via Supabase
 * Auth before promoting the target member to admin and demoting the caller.
 * ==========================================================================*/
export async function verifyPasswordAndTransferOwnership(
  roomId: string,
  currentUserEmail: string,
  currentUserId: string,
  targetUserId: string,
  password: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error: authError } = await supabase.auth.signInWithPassword({ email: currentUserEmail, password });
    if (authError) {
      return { success: false, error: "Incorrect password." };
    }
    const promoted = await setMemberRole(roomId, targetUserId, "admin");
    if (!promoted) return { success: false, error: "Could not promote the new owner." };
    await setMemberRole(roomId, currentUserId, "member");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Transfer failed." };
  }
}

/* ============================================================================
 * Shared media stats \u2014 real counts by message type instead of fabricated
 * storage sizes (this app never tracked byte sizes for uploaded media).
 * ==========================================================================*/
export async function fetchRoomMediaStats(roomId: string): Promise<{ images: number; videos: number; voice: number; total: number }> {
  try {
    const { data, error } = await supabase.from("messages").select("type").eq("room_id", roomId);
    if (error || !data) return { images: 0, videos: 0, voice: 0, total: 0 };
    const images = data.filter((m: any) => m.type === "image").length;
    const videos = data.filter((m: any) => m.type === "video").length;
    const voice = data.filter((m: any) => m.type === "voice").length;
    return { images, videos, voice, total: data.length };
  } catch (err) {
    console.warn("[GroupChatService] Exception fetching media stats:", err);
    return { images: 0, videos: 0, voice: 0, total: 0 };
  }
}
