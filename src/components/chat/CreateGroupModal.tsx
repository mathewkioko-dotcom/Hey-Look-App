import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Users, Megaphone, Search, Check, Link2 } from "lucide-react";
import { Profile } from "../../types";
import { createRoom, requestToJoinByInviteCode } from "../../services/groupChatService";

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Profile;
  profiles: Profile[];
  onCreated: (roomId: string) => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  profiles,
  onCreated,
}) => {
  const [mode, setMode] = useState<"create" | "join">("create");
  const [type, setType] = useState<"group" | "channel">("group");
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinStatus, setJoinStatus] = useState("");

  if (!isOpen) return null;

  const handleJoin = async () => {
    const code = joinCode.trim().split("/").pop() || joinCode.trim();
    if (!code) return;
    const result = await requestToJoinByInviteCode(code, currentUser.id);
    if (result === "requested") setJoinStatus("Join request sent — waiting for an admin to approve.");
    else if (result === "already-member") setJoinStatus("You're already a member of this group.");
    else if (result === "not-found") setJoinStatus("No group found with that invite code.");
    else setJoinStatus("Could not send the join request. Try again.");
  };

  const filtered = profiles.filter(
    (p) =>
      p.id !== currentUser.id &&
      (p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        p.username?.toLowerCase().includes(search.toLowerCase())),
  );

  const toggleMember = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));
  };

  const handleCreate = async () => {
    if (!name.trim() || isCreating) return;
    // Channels can be created with zero initial subscribers (broadcast-only);
    // groups need at least one other member to make sense.
    if (type === "group" && selected.length === 0) return;
    setIsCreating(true);
    const room = await createRoom(currentUser.id, type, name.trim(), selected);
    setIsCreating(false);
    if (room) {
      setName("");
      setSelected([]);
      onCreated(room.id);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-3xl border border-slate-700 bg-slate-900 p-6 text-slate-100"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-white">New Group or Channel</h3>
            <button onClick={onClose} className="rounded-full bg-slate-800 p-2 text-slate-400 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-4 flex gap-2">
            <button onClick={() => setMode("create")} className={`flex-1 rounded-xl border py-2 text-xs font-bold ${mode === "create" ? "border-cyan-500/60 bg-cyan-500/10 text-cyan-300" : "border-slate-700 text-slate-400"}`}>Create</button>
            <button onClick={() => setMode("join")} className={`flex-1 rounded-xl border py-2 text-xs font-bold ${mode === "join" ? "border-cyan-500/60 bg-cyan-500/10 text-cyan-300" : "border-slate-700 text-slate-400"}`}>Join via Code</button>
          </div>

          {mode === "join" ? (
            <div className="space-y-3">
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                <input
                  value={joinCode}
                  onChange={(e) => { setJoinCode(e.target.value); setJoinStatus(""); }}
                  placeholder="Paste invite link or code..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-8 pr-3 text-xs text-white outline-none focus:border-cyan-500"
                />
              </div>
              {joinStatus && <p className="text-[11px] text-slate-400">{joinStatus}</p>}
              <button
                onClick={() => void handleJoin()}
                disabled={!joinCode.trim()}
                className="w-full rounded-2xl bg-cyan-500 py-3 text-sm font-extrabold text-slate-950 disabled:opacity-40"
              >
                Request to Join
              </button>
            </div>
          ) : (
            <>
            <div className="mb-4 flex gap-2">
            <button
              onClick={() => setType("group")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-bold ${
                type === "group" ? "border-cyan-500/60 bg-cyan-500/10 text-cyan-300" : "border-slate-700 text-slate-400"
              }`}
            >
              <Users className="h-4 w-4" /> Group
            </button>
            <button
              onClick={() => setType("channel")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-bold ${
                type === "channel" ? "border-pink-500/60 bg-pink-500/10 text-pink-300" : "border-slate-700 text-slate-400"
              }`}
            >
              <Megaphone className="h-4 w-4" /> Channel
            </button>
          </div>
          <p className="mb-4 text-[10px] text-slate-500">
            {type === "group"
              ? "Everyone in a group can send messages."
              : "Only admins can post in a channel — everyone else just reads (like a Telegram/WhatsApp channel)."}
          </p>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={type === "group" ? "Group name..." : "Channel name..."}
            className="mb-4 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500"
          />

          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={type === "group" ? "Add members..." : "Add initial subscribers (optional)..."}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 pl-8 pr-3 text-xs text-white outline-none focus:border-cyan-500"
            />
          </div>

          <div className="mb-4 max-h-56 space-y-1.5 overflow-y-auto">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => toggleMember(p.id)}
                className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-colors ${
                  selected.includes(p.id) ? "border-cyan-500/60 bg-cyan-500/10" : "border-slate-800 bg-slate-950/50"
                }`}
              >
                <img src={p.avatar_url} alt={p.full_name} className="h-8 w-8 rounded-full object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-200">{p.full_name}</p>
                  <p className="truncate text-[10px] text-slate-500">@{p.username}</p>
                </div>
                {selected.includes(p.id) && <Check className="h-4 w-4 shrink-0 text-cyan-400" />}
              </button>
            ))}
            {!filtered.length && <p className="py-3 text-center text-xs text-slate-500">No contacts found.</p>}
          </div>

          <button
            onClick={() => void handleCreate()}
            disabled={!name.trim() || (type === "group" && !selected.length) || isCreating}
            className="w-full rounded-2xl bg-cyan-500 py-3 text-sm font-extrabold text-slate-950 disabled:opacity-40"
          >
            {isCreating ? "Creating..." : `Create ${type === "group" ? "Group" : "Channel"}`}
          </button>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
