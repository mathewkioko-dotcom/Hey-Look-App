import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, Send, Settings, Megaphone, Users, Paperclip } from "lucide-react";
import { ChatMessage, ChatRoom, Profile, RoomMember } from "../types";
import { supabase } from "../lib/supabase";
import {
  fetchRoomMembers,
  fetchRoomMessages,
  fetchRoomById,
  sendRoomMessage,
  subscribeToRoomMessages,
  computeAutoDeleteBurnAt,
} from "../services/groupChatService";
import { GroupManagementModal } from "./chat/GroupManagementModal";

interface GroupChatViewProps {
  room: ChatRoom;
  currentUser: Profile;
  onBack: () => void;
}

export const GroupChatView: React.FC<GroupChatViewProps> = ({ room, currentUser, onBack }) => {
  const [liveRoom, setLiveRoom] = useState<ChatRoom>(room);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const myMembership = members.find((m) => m.user_id === currentUser.id);
  const isAdmin = (myMembership?.role || liveRoom.my_role) === "admin";
  const canPost = isAdmin || (liveRoom.type !== "channel" && !liveRoom.announcement_mode && liveRoom.allow_send !== false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [msgs, roster] = await Promise.all([fetchRoomMessages(room.id), fetchRoomMembers(room.id)]);
      if (cancelled) return;
      setMessages(msgs.map((m) => ({ ...m, is_me: m.sender_id === currentUser.id })));
      setMembers(roster);
    };
    void load();

    const unsubscribe = subscribeToRoomMessages(room.id, (msg) => {
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, { ...msg, is_me: msg.sender_id === currentUser.id }]));
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [room.id, currentUser.id]);

  const refreshLiveRoom = () => {
    void fetchRoomById(room.id, currentUser.id).then((r) => { if (r) setLiveRoom(r); });
    void fetchRoomMembers(room.id).then(setMembers);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const memberProfile = (userId: string) => members.find((m) => m.user_id === userId)?.profile;

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isSending || !canPost) return;
    setIsSending(true);
    setInputText("");
    const mentioned_user_ids = members
      .filter((member) => {
        const username = member.profile?.username;
        return username && new RegExp(`(^|\\s)@${username}(?=\\s|$)`, "i").test(text);
      })
      .map((member) => member.user_id);
    const sent = await sendRoomMessage(liveRoom.id, currentUser.id, text, { mentioned_user_ids });
    if (sent) {
      setMessages((prev) => [...prev, { ...sent, is_me: true }]);
    }
    setIsSending(false);
  };

  const handleAttachImage = async (file?: File) => {
    if (!file || !canPost) return;
    const maxBytes = (liveRoom.max_upload_mb || 100) * 1024 * 1024;
    if (file.size > maxBytes) {
      alert(`This file exceeds the group's ${liveRoom.max_upload_mb || 100} MB upload limit.`);
      return;
    }
    setIsSending(true);
    try {
      const extension = file.name.split(".").pop()?.toLowerCase() || "bin";
      const path = `${currentUser.id}/${crypto.randomUUID()}.${extension}`;
      const { data, error } = await supabase.storage.from("chat-media").upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      const { data: publicData } = supabase.storage.from("chat-media").getPublicUrl(data.path);
      const burnAt = computeAutoDeleteBurnAt(liveRoom.auto_delete_media);
      const sent = await sendRoomMessage(liveRoom.id, currentUser.id, "📷 Photo", { type: "image", image_url: publicData.publicUrl, burn_at: burnAt });
      if (sent) setMessages((prev) => [...prev, { ...sent, is_me: true }]);
    } catch (err) {
      console.warn("[GroupChatView] Image upload failed:", err);
    }
    setIsSending(false);
  };

  return (
    <div className="flex h-full flex-col bg-slate-950">
      <header className="flex items-center gap-3 border-b border-slate-800 px-4 py-3">
        <button onClick={onBack} className="rounded-full p-1.5 text-slate-400 hover:text-white">
          <ChevronLeft className="h-5 w-5" />
        </button>
        {room.avatar_url ? (
          <img src={room.avatar_url} alt={liveRoom.name} className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-500 to-purple-600 text-white">
            {liveRoom.type === "channel" ? <Megaphone className="h-5 w-5" /> : <Users className="h-5 w-5" />}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-slate-100">{liveRoom.name}</p>
          <p className="text-[10px] text-slate-500">
            {liveRoom.type === "channel" ? "Channel" : "Group"}{liveRoom.announcement_mode ? " • Announcements" : ""} • {members.length || liveRoom.member_count || 1} members
          </p>
        </div>
        <button onClick={() => setIsSettingsOpen(true)} className="rounded-full bg-slate-800 p-2 text-slate-300 hover:text-white">
          <Settings className="h-4 w-4" />
        </button>
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {messages.map((msg) => {
          const author = memberProfile(msg.sender_id);
          return (
            <div key={msg.id} className={`flex items-end gap-2 ${msg.is_me ? "justify-end" : "justify-start"}`}>
              {!msg.is_me && (
                <img
                  src={author?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${msg.sender_id}`}
                  alt={author?.full_name || "Member"}
                  className="h-6 w-6 shrink-0 rounded-full object-cover"
                />
              )}
              <div className={`max-w-[75%] rounded-2xl px-3 py-2 ${msg.is_me ? "bg-cyan-600 text-white" : "bg-slate-800 text-slate-100"}`}>
                {!msg.is_me && <p className="mb-0.5 text-[10px] font-bold text-cyan-300">{author?.full_name || "Member"}</p>}
                {msg.image_url && <img src={msg.image_url} alt="" className="mb-1 max-h-64 rounded-xl object-cover" />}
                <p className="whitespace-pre-line text-sm">{msg.text}</p>
              </div>
            </div>
          );
        })}
        {!messages.length && <p className="py-8 text-center text-xs text-slate-500">No messages yet. Say hello!</p>}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-slate-800 p-3">
        {canPost ? (
          <div className="flex items-center gap-2">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { void handleAttachImage(e.target.files?.[0]); e.currentTarget.value = ""; }} />
            <button onClick={() => fileInputRef.current?.click()} disabled={isSending} className="rounded-xl bg-slate-800 p-2.5 text-slate-300 hover:text-white disabled:opacity-40">
              <Paperclip className="h-4 w-4" />
            </button>
            <input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleSend();
                }
              }}
              placeholder={liveRoom.type === "channel" ? "Post an announcement..." : "Message the group..."}
              className="min-w-0 flex-1 rounded-xl bg-slate-900 px-3 py-2.5 text-sm text-white outline-none"
            />
            <button
              onClick={() => void handleSend()}
              disabled={!inputText.trim() || isSending}
              className="rounded-xl bg-cyan-500 p-2.5 text-slate-950 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <p className="rounded-xl bg-slate-900 px-3 py-2.5 text-center text-xs text-slate-500">
            Only admins can post in this {liveRoom.type === "channel" ? "channel" : "group"} right now.
          </p>
        )}
      </div>

      <GroupManagementModal
        isOpen={isSettingsOpen}
        onClose={() => { setIsSettingsOpen(false); refreshLiveRoom(); }}
        roomId={room.id}
        groupName={liveRoom.name}
        isAdmin={isAdmin}
        currentUser={currentUser}
        onLeftOrDeleted={onBack}
      />
    </div>
  );
};

export default GroupChatView;
