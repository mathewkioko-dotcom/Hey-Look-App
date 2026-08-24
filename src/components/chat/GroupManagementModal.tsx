import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  ChevronLeft,
  Shield,
  Send,
  UserPlus,
  Pin,
  CheckCircle2,
  Users,
  CheckCheck,
  XCircle,
  Link2,
  Copy,
  RotateCcw,
  QrCode,
  UserCog,
  UserMinus,
  MessageSquare,
  Calendar,
  CalendarPlus,
  PenLine,
  UserCheck,
  Megaphone,
  Info,
  FileText,
  BookOpenCheck,
  HardDrive,
  Upload,
  Trash2,
  Crown,
  Lock,
  AlertTriangle,
  Archive,
  LogOut,
  Loader2,
  Search,
  Eye,
} from "lucide-react";
import { Profile, RoomMember, RoomJoinRequest, RoomEvent } from "../../types";
import {
  fetchRoomMembers,
  fetchRoomById,
  setMemberRole,
  removeMember,
  updateRoom,
  updateRoomSettings,
  leaveRoom,
  deleteRoom,
  fetchPendingJoinRequests,
  decideJoinRequest,
  generateInviteCode,
  fetchRoomEvents,
  createRoomEvent,
  updateRoomEvent,
  rsvpToEvent,
  setRoomArchived,
  verifyPasswordAndTransferOwnership,
  fetchRoomMediaStats,
} from "../../services/groupChatService";

type GroupView =
  | "hub"
  | "permissions"
  | "approvals"
  | "inviteLink"
  | "participants"
  | "eventPlanner"
  | "announcement"
  | "description"
  | "sharedMedia"
  | "transferOwnership"
  | "exitDelete";

interface GroupManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupName: string;
  isAdmin: boolean;
  onNotice?: (msg: string) => void;
  /** Real room id — when provided, Participants/Description/Exit &Delete act
   * on the actual `chat_rooms`/`room_members` tables instead of sample data. */
  roomId?: string;
  currentUser?: Profile;
  onLeftOrDeleted?: () => void;
}

/* ------------------------- Sample Data ------------------------- */
const PENDING_APPROVALS = [
  { id: "p1", name: "Ravi Patel", handle: "@ravi_p", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100", requested: "2h ago", reason: "Invited by Sara Chen" },
  { id: "p2", name: "Lena Fischer", handle: "@lena_f", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100", requested: "5h ago", reason: "Requested via link" },
  { id: "p3", name: "Tom O'Brien", handle: "@tom_o", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100", requested: "1d ago", reason: "Invited by Alex Rivera" },
];

const PARTICIPANTS = [
  { id: "m1", name: "Sara Chen", handle: "@sara_c", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100", role: "Admin" },
  { id: "m2", name: "Alex Rivera", handle: "@alex_r", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100", role: "Member" },
  { id: "m3", name: "Maya Okafor", handle: "@maya_o", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100", role: "Member" },
  { id: "m4", name: "Ravi Patel", handle: "@ravi_p", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100", role: "Member" },
];

const UPCOMING_EVENTS = [
  { id: "e1", title: "Weekly Fleet Sync", date: "Mon • 10:00 AM", rsvps: 12, attendees: 8 },
  { id: "e2", title: "Harbor Launch Party", date: "Fri • 7:00 PM", rsvps: 24, attendees: 19 },
];

const STORAGE_CATEGORIES = [
  { label: "Photos & GIFs", size: "820 MB", color: "bg-pink-500" },
  { label: "Videos", size: "1.4 GB", color: "bg-indigo-500" },
  { label: "Documents", size: "310 MB", color: "bg-emerald-500" },
  { label: "Voice Notes", size: "240 MB", color: "bg-amber-500" },
];

/* ====================================================================== */
/*  MAIN COMPONENT                                                         */
/* ====================================================================== */
export const GroupManagementModal: React.FC<GroupManagementModalProps> = ({
  isOpen,
  onClose,
  groupName,
  isAdmin,
  onNotice,
  roomId,
  currentUser,
  onLeftOrDeleted,
}) => {
  const [view, setView] = useState<GroupView>("hub");
  const [toast, setToast] = useState<string>("");

  // When a real roomId is supplied, participants are loaded from the DB and
  // replace the sample PARTICIPANTS array used when this modal is opened
  // without a room context (kept for backward compatibility elsewhere).
  const [realMembers, setRealMembers] = useState<RoomMember[] | null>(null);
  const [realRoom, setRealRoom] = useState<import("../../types").ChatRoom | null>(null);
  const [realJoinRequests, setRealJoinRequests] = useState<RoomJoinRequest[] | null>(null);
  const [realEvents, setRealEvents] = useState<RoomEvent[] | null>(null);
  const [mediaStats, setMediaStats] = useState({ images: 0, videos: 0, voice: 0, total: 0 });

  const refreshRoomData = () => {
    if (!roomId || !currentUser) return;
    void fetchRoomMembers(roomId).then(setRealMembers);
    void fetchRoomById(roomId, currentUser.id).then(setRealRoom);
    void fetchPendingJoinRequests(roomId).then(setRealJoinRequests);
    void fetchRoomEvents(roomId, currentUser.id).then(setRealEvents);
    void fetchRoomMediaStats(roomId).then(setMediaStats);
  };

  useEffect(() => {
    if (!isOpen || !roomId || !currentUser) return;
    refreshRoomData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, roomId]);

  // Group Permissions
  const [permEditInfo, setPermEditInfo] = useState(true);
  const [permSend, setPermSend] = useState(true);
  const [permAddMembers, setPermAddMembers] = useState(true);
  const [permPin, setPermPin] = useState(true);

  // Pending Approvals
  const [pending, setPending] = useState(PENDING_APPROVALS);
  const [approvalSub, setApprovalSub] = useState<"list" | "review">("list");
  const [reviewTarget, setReviewTarget] = useState<any>(null);

  useEffect(() => {
    if (!realJoinRequests) return;
    setPending(
      realJoinRequests.map((r) => ({
        id: r.id,
        name: r.profile?.full_name || "Someone",
        handle: `@${r.profile?.username || "user"}`,
        avatar: r.profile?.avatar_url || "",
        requested: new Date(r.requested_at).toLocaleString(),
        reason: "Requested via invite link",
        userId: r.user_id,
      })),
    );
  }, [realJoinRequests]);

  // Invite Link
  const [inviteLink, setInviteLink] = useState(
    "https://heylook.app/join/Harbor-Crew-7xk2",
  );

  // Participants — mapped from real DB membership when a roomId is provided,
  // otherwise falls back to the local sample data (legacy call sites without
  // a room context).
  const [participants, setParticipants] = useState(PARTICIPANTS);
  const [activeParticipant, setActiveParticipant] = useState<any>(null);

  useEffect(() => {
    if (!realMembers) return;
    setParticipants(
      realMembers.map((m) => ({
        id: m.user_id,
        name: m.profile?.full_name || "Member",
        handle: `@${m.profile?.username || "member"}`,
        avatar: m.profile?.avatar_url || "",
        role: m.role === "admin" ? "Admin" : "Member",
      })),
    );
  }, [realMembers]);

  // Event Planner
  const [eventSub, setEventSub] = useState<"list" | "create" | "edit" | "rsvps">("list");
  const [events, setEvents] = useState(UPCOMING_EVENTS);
  const [activeEvent, setActiveEvent] = useState<any>(null);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState("");

  useEffect(() => {
    if (!realEvents) return;
    setEvents(
      realEvents.map((e) => ({
        id: e.id,
        title: e.title,
        date: e.event_date || "TBD",
        rsvps: e.going_count || 0,
        attendees: e.going_count || 0,
      })),
    );
  }, [realEvents]);

  // Announcement Mode
  const [announcementMode, setAnnouncementMode] = useState(false);
  const [announcementDrawer, setAnnouncementDrawer] = useState(false);

  // Description & Rules
  const [groupDescription, setGroupDescription] = useState(
    "A tight-knit crew coordinating the fleet launch. All hands on deck! ⚓",
  );
  const [groupRules, setGroupRules] = useState(
    "1. Be respectful\n2. No spam\n3. Announcements are admins-only",
  );
  const [enforceRules, setEnforceRules] = useState(true);

  // Shared Media & File Limits
  const [maxUploadSize, setMaxUploadSize] = useState("100 MB");
  const [autoDeleteMedia, setAutoDeleteMedia] = useState("Never");

  useEffect(() => {
    if (!realRoom) return;
    setPermEditInfo(realRoom.allow_edit_info ?? true);
    setPermSend(realRoom.allow_send ?? true);
    setPermAddMembers(realRoom.allow_add_members ?? true);
    setPermPin(realRoom.allow_pin ?? true);
    setAnnouncementMode(Boolean(realRoom.announcement_mode));
    setGroupDescription(realRoom.description || "");
    setGroupRules(realRoom.rules || "");
    setEnforceRules(Boolean(realRoom.enforce_rules));
    setMaxUploadSize(`${realRoom.max_upload_mb ?? 100} MB`);
    setAutoDeleteMedia(realRoom.auto_delete_media || "Never");
    if (realRoom.invite_code) setInviteLink(`https://heylook.app/join/${realRoom.invite_code}`);
  }, [realRoom]);

  // Transfer Ownership
  const [transferSub, setTransferSub] = useState<"list" | "select" | "verify">("list");
  const [transferTarget, setTransferTarget] = useState<any>(null);
  const [transferPassword, setTransferPassword] = useState("");
  const [transferring, setTransferring] = useState(false);

  // Exit & Delete
  const [exitSub, setExitSub] = useState<"list" | "warning">("list");

  const showToast = (msg: string) => {
    setToast(msg);
    onNotice?.(msg);
    setTimeout(() => setToast(""), 1800);
  };

  const closeModal = () => {
    setView("hub");
    setApprovalSub("list");
    setEventSub("list");
    setTransferSub("list");
    setExitSub("list");
    setActiveParticipant(null);
    setReviewTarget(null);
    onClose();
  };

  const Toggle: React.FC<{ on: boolean; onClick: () => void; color?: string }> = ({
    on,
    onClick,
    color = "bg-cyan-500",
  }) => (
    <button
      onClick={onClick}
      className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer ${on ? color : "bg-slate-600"}`}
    >
      <div
        className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-5" : ""}`}
      />
    </button>
  );

  /* ------------------------- Render helpers ------------------------- */
  const renderPermissions = () => (
    <div className="space-y-4">
      <Header
        title="Group Permissions"
        subtitle="Admin toggle list"
        color="text-cyan-400"
        bg="bg-cyan-500/20 border-cyan-500/30"
        icon={<Shield className="w-6 h-6" />}
        onBack={() => setView("hub")}
      />
      <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-[11px] text-amber-200 flex items-center gap-2">
        <Shield className="w-4 h-4 text-amber-400" /> Admin controls — only group
        admins can modify these.
      </div>
      {[
        { label: "Edit Group Info", desc: "Allow members to change name, description & photo", val: permEditInfo, set: setPermEditInfo, icon: <PenLine className="w-4 h-4 text-cyan-400" /> },
        { label: "Send Messages", desc: "Allow members to post messages", val: permSend, set: setPermSend, icon: <Send className="w-4 h-4 text-emerald-400" /> },
        { label: "Add Other Members", desc: "Allow members to invite new people", val: permAddMembers, set: setPermAddMembers, icon: <UserPlus className="w-4 h-4 text-indigo-400" /> },
        { label: "Pin Messages", desc: "Allow members to pin important messages", val: permPin, set: setPermPin, icon: <Pin className="w-4 h-4 text-pink-400" /> },
      ].map((p) => (
        <div
          key={p.label}
          className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/50 border border-slate-700"
        >
          <div className="flex items-center gap-3">
            {p.icon}
            <div>
              <p className="text-xs font-semibold text-slate-200">{p.label}</p>
              <p className="text-[10px] text-slate-500">{p.desc}</p>
            </div>
          </div>
          <Toggle on={p.val} onClick={() => p.set(!p.val)} />
        </div>
      ))}
      <button
        onClick={() => { if (roomId) void updateRoomSettings(roomId, { allow_edit_info: permEditInfo, allow_send: permSend, allow_add_members: permAddMembers, allow_pin: permPin }); showToast("Permissions saved"); }}
        className="w-full py-3 rounded-2xl bg-cyan-500 text-slate-950 font-extrabold hover:bg-cyan-400 transition-colors cursor-pointer"
      >
        Save Permissions
      </button>
    </div>
  );

  const renderApprovals = () => {
    if (approvalSub === "review" && reviewTarget) {
      return (
        <div className="space-y-4">
          <Header
            title="Profile Review"
            subtitle={reviewTarget.name}
            color="text-emerald-400"
            bg="bg-emerald-500/20 border-emerald-500/30"
            icon={<UserCheck className="w-6 h-6" />}
            onBack={() => setApprovalSub("list")}
          />
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <img src={reviewTarget.avatar} alt={reviewTarget.name} className="w-20 h-20 rounded-full object-cover border-2 border-emerald-500/40" />
            <p className="text-sm font-bold text-slate-100">{reviewTarget.name}</p>
            <p className="text-xs text-slate-500">{reviewTarget.handle}</p>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">{reviewTarget.reason}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (roomId && reviewTarget.userId) void decideJoinRequest(reviewTarget.id, roomId, reviewTarget.userId, true).then(refreshRoomData);
                setPending(pending.filter((p) => p.id !== reviewTarget.id));
                setApprovalSub("list");
                showToast(`${reviewTarget.name} approved`);
              }}
              className="flex-1 py-3 rounded-2xl bg-emerald-500 text-slate-950 font-extrabold hover:bg-emerald-400 flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" /> Approve
            </button>
            <button
              onClick={() => {
                if (roomId && reviewTarget.userId) void decideJoinRequest(reviewTarget.id, roomId, reviewTarget.userId, false).then(refreshRoomData);
                setPending(pending.filter((p) => p.id !== reviewTarget.id));
                setApprovalSub("list");
                showToast(`${reviewTarget.name} rejected`);
              }}
              className="flex-1 py-3 rounded-2xl bg-rose-500 text-white font-extrabold hover:bg-rose-400 flex items-center justify-center gap-2 cursor-pointer"
            >
              <XCircle className="w-4 h-4" /> Reject
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <Header
          title="Pending Member Approvals"
          subtitle={`${pending.length} awaiting review`}
          color="text-emerald-400"
          bg="bg-emerald-500/20 border-emerald-500/30"
          icon={<Users className="w-6 h-6" />}
          onBack={() => setView("hub")}
        />
        <div className="flex gap-2">
          <button
            onClick={() => { if (roomId) { pending.forEach((p: any) => p.userId && void decideJoinRequest(p.id, roomId, p.userId, true)); refreshRoomData(); } setPending([]); showToast("All requests approved"); }}
            className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-extrabold hover:bg-emerald-400 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <CheckCheck className="w-4 h-4" /> Approve All
          </button>
          <button
            onClick={() => { if (roomId) { pending.forEach((p: any) => p.userId && void decideJoinRequest(p.id, roomId, p.userId, false)); refreshRoomData(); } setPending([]); showToast("All requests rejected"); }}
            className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white text-xs font-extrabold hover:bg-rose-400 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <XCircle className="w-4 h-4" /> Reject All
          </button>
        </div>
        <div className="space-y-2">
          {pending.length === 0 && (
            <p className="text-center text-xs text-slate-500 py-4">No pending approvals 🎉</p>
          )}
          {pending.map((p) => (
            <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700">
              <img src={p.avatar} alt={p.name} className="w-9 h-9 rounded-full object-cover" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-slate-200">{p.name}</p>
                <p className="text-[10px] text-slate-500">{p.handle} • {p.requested}</p>
              </div>
              <button
                onClick={() => { setReviewTarget(p); setApprovalSub("review"); }}
                className="px-3 py-1.5 rounded-lg bg-slate-700 text-xs font-bold hover:bg-slate-600 cursor-pointer"
              >
                Review
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderInviteLink = () => (
    <div className="space-y-4">
      <Header
        title="Group Invite Link"
        subtitle="Share & manage invites"
        color="text-indigo-400"
        bg="bg-indigo-500/20 border-indigo-500/30"
        icon={<Link2 className="w-6 h-6" />}
        onBack={() => setView("hub")}
      />
      <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700">
        <p className="text-[10px] font-bold text-slate-400 mb-1.5">CURRENT LINK</p>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={inviteLink}
            className="flex-1 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-cyan-300 font-mono focus:outline-none"
          />
          <button
            onClick={() => { navigator.clipboard?.writeText(inviteLink); showToast("Invite link copied ✓"); }}
            className="p-2.5 rounded-xl bg-indigo-500 text-white hover:bg-indigo-400 cursor-pointer"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="space-y-2">
        <button
          onClick={() => {
            if (roomId) {
              void generateInviteCode(roomId).then((code) => {
                if (code) setInviteLink(`https://heylook.app/join/${code}`);
              });
            } else {
              setInviteLink(`https://heylook.app/join/${groupName.replace(/\s+/g, "-")}-${crypto.randomUUID().slice(0, 6)}`);
            }
            showToast("Invite link reset");
          }}
          className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-indigo-500/40 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4 text-amber-400" />
          <div className="flex-1 text-left">
            <p className="text-xs font-semibold text-slate-200">Reset Invite Link</p>
            <p className="text-[10px] text-slate-500">Invalidate the current link</p>
          </div>
          <ChevronLeft className="w-4 h-4 text-slate-500 rotate-180" />
        </button>
        <button
          onClick={() => showToast("QR Code banner generated")}
          className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-indigo-500/40 cursor-pointer"
        >
          <QrCode className="w-4 h-4 text-indigo-400" />
          <div className="flex-1 text-left">
            <p className="text-xs font-semibold text-slate-200">Generate QR Code Banner</p>
            <p className="text-[10px] text-slate-500">Create a scannable invite banner</p>
          </div>
          <ChevronLeft className="w-4 h-4 text-slate-500 rotate-180" />
        </button>
      </div>
    </div>
  );

  const renderParticipants = () => {
    if (activeParticipant) {
      const isAdminUser = activeParticipant.role === "Admin";
      return (
        <div className="space-y-4">
          <Header
            title="Participant Actions"
            subtitle={activeParticipant.name}
            color="text-purple-400"
            bg="bg-purple-500/20 border-purple-500/30"
            icon={<UserCog className="w-6 h-6" />}
            onBack={() => setActiveParticipant(null)}
          />
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700">
            <img src={activeParticipant.avatar} alt={activeParticipant.name} className="w-10 h-10 rounded-full object-cover" />
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-200">{activeParticipant.name}</p>
              <p className="text-[10px] text-slate-500">{activeParticipant.handle}</p>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isAdminUser ? "bg-amber-500/20 text-amber-300" : "bg-slate-700 text-slate-300"}`}>
              {isAdminUser ? <span className="flex items-center gap-1"><Crown className="w-3 h-3" /> Admin</span> : "Member"}
            </span>
          </div>
          <div className="space-y-2">
            {!isAdminUser && (
              <button
                onClick={() => { if (roomId) void setMemberRole(roomId, activeParticipant.id, "admin"); setParticipants(participants.map((m) => m.id === activeParticipant.id ? { ...m, role: "Admin" } : m)); setActiveParticipant(null); showToast(`${activeParticipant.name} is now an admin`); }}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-amber-500/40 cursor-pointer"
              >
                <Crown className="w-4 h-4 text-amber-400" />
                <div className="flex-1 text-left">
                  <p className="text-xs font-semibold text-slate-200">Make Group Admin</p>
                  <p className="text-[10px] text-slate-500">Grant admin privileges</p>
                </div>
              </button>
            )}
            {isAdminUser && (
              <button
                onClick={() => { if (roomId) void setMemberRole(roomId, activeParticipant.id, "member"); setParticipants(participants.map((m) => m.id === activeParticipant.id ? { ...m, role: "Member" } : m)); setActiveParticipant(null); showToast(`${activeParticipant.name} dismissed as admin`); }}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-rose-500/40 cursor-pointer"
              >
                <UserMinus className="w-4 h-4 text-rose-400" />
                <div className="flex-1 text-left">
                  <p className="text-xs font-semibold text-slate-200">Dismiss as Admin</p>
                  <p className="text-[10px] text-slate-500">Remove admin privileges</p>
                </div>
              </button>
            )}
            <button
              onClick={() => { if (roomId) void removeMember(roomId, activeParticipant.id); setParticipants(participants.filter((m) => m.id !== activeParticipant.id)); setActiveParticipant(null); showToast(`${activeParticipant.name} removed from group`); }}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/40 hover:bg-rose-500/20 cursor-pointer"
            >
              <UserMinus className="w-4 h-4 text-rose-400" />
              <div className="flex-1 text-left">
                <p className="text-xs font-semibold text-rose-300">Remove from Group</p>
                <p className="text-[10px] text-slate-500">Can't be re-added without invite</p>
              </div>
            </button>
            <button
              onClick={() => { setActiveParticipant(null); showToast(`Opening private chat with ${activeParticipant.name}`); }}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-cyan-500/40 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              <div className="flex-1 text-left">
                <p className="text-xs font-semibold text-slate-200">Message Privately</p>
                <p className="text-[10px] text-slate-500">Open a 1-on-1 chat</p>
              </div>
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <Header
          title="Participants"
          subtitle={`${participants.length} members`}
          color="text-purple-400"
          bg="bg-purple-500/20 border-purple-500/30"
          icon={<Users className="w-6 h-6" />}
          onBack={() => setView("hub")}
        />
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search participants..." className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-purple-500 focus:outline-none" />
        </div>
        <div className="space-y-2">
          {participants.map((m) => (
            <button
              key={m.id}
              onClick={() => setActiveParticipant(m)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-purple-500/40 cursor-pointer text-left"
            >
              <img src={m.avatar} alt={m.name} className="w-9 h-9 rounded-full object-cover" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  {m.name}
                  {m.role === "Admin" && <Crown className="w-3 h-3 text-amber-400" />}
                </p>
                <p className="text-[10px] text-slate-500">{m.handle}</p>
              </div>
              <ChevronLeft className="w-4 h-4 text-slate-500 rotate-180" />
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderEventPlanner = () => {
    if (eventSub === "create") {
      return (
        <div className="space-y-4">
          <Header title="Create New Group Event" subtitle="Schedule something" color="text-orange-400" bg="bg-orange-500/20 border-orange-500/30" icon={<CalendarPlus className="w-6 h-6" />} onBack={() => setEventSub("list")} />
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400">Event Title</label>
              <input type="text" value={newEventTitle} onChange={(e) => setNewEventTitle(e.target.value)} placeholder="e.g. Dock Meetup" className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:border-orange-500 focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400">Date & Time</label>
              <input type="text" value={newEventDate} onChange={(e) => setNewEventDate(e.target.value)} placeholder="e.g. Mon • 5:00 PM" className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:border-orange-500 focus:outline-none" />
            </div>
            <button
              onClick={() => {
                if (!newEventTitle) return;
                if (roomId && currentUser) {
                  void createRoomEvent(roomId, currentUser.id, newEventTitle, newEventDate || "TBD").then(refreshRoomData);
                } else {
                  setEvents([...events, { id: `e${Date.now()}`, title: newEventTitle, date: newEventDate || "TBD", rsvps: 0, attendees: 0 }]);
                }
                setNewEventTitle(""); setNewEventDate(""); setEventSub("list"); showToast("Event created");
              }}
              className="w-full py-3 rounded-2xl bg-orange-500 text-slate-950 font-extrabold hover:bg-orange-400 cursor-pointer"
            >
              Create Event
            </button>
          </div>
        </div>
      );
    }
    if (eventSub === "edit" && activeEvent) {
      return (
        <div className="space-y-4">
          <Header title="Edit Upcoming Event" subtitle={activeEvent.title} color="text-orange-400" bg="bg-orange-500/20 border-orange-500/30" icon={<PenLine className="w-6 h-6" />} onBack={() => setEventSub("list")} />
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700">
            <p className="text-xs font-bold text-slate-200">{activeEvent.title}</p>
            <p className="text-[10px] text-slate-500">{activeEvent.date}</p>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400">New Title</label>
            <input type="text" value={newEventTitle || activeEvent.title} onChange={(e) => setNewEventTitle(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:border-orange-500 focus:outline-none" />
          </div>
          <button onClick={() => { if (roomId) void updateRoomEvent(activeEvent.id, newEventTitle || activeEvent.title, activeEvent.date).then(refreshRoomData); setNewEventTitle(""); setEventSub("list"); showToast("Event updated"); }} className="w-full py-3 rounded-2xl bg-orange-500 text-slate-950 font-extrabold hover:bg-orange-400 cursor-pointer">Save Changes</button>
        </div>
      );
    }
    if (eventSub === "rsvps" && activeEvent) {
      return (
        <div className="space-y-4">
          <Header title="View RSVPs" subtitle={activeEvent.title} color="text-orange-400" bg="bg-orange-500/20 border-orange-500/30" icon={<UserCheck className="w-6 h-6" />} onBack={() => setEventSub("list")} />
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700 text-center">
              <p className="text-2xl font-black text-orange-400">{activeEvent.rsvps}</p>
              <p className="text-[10px] text-slate-500">Total RSVPs</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700 text-center">
              <p className="text-2xl font-black text-emerald-400">{activeEvent.attendees}</p>
              <p className="text-[10px] text-slate-500">Attending</p>
            </div>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => { if (roomId && currentUser) void rsvpToEvent(activeEvent.id, currentUser.id, "going").then(refreshRoomData); showToast("RSVP'd as Going"); }}
              className="w-full py-2.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-extrabold hover:bg-emerald-400 cursor-pointer"
            >
              RSVP: Going
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <Header title="Group Event Planner" subtitle="Coordinate activities" color="text-orange-400" bg="bg-orange-500/20 border-orange-500/30" icon={<Calendar className="w-6 h-6" />} onBack={() => setView("hub")} />
        <button onClick={() => setEventSub("create")} className="w-full flex items-center gap-3 p-3 rounded-xl bg-orange-500/10 border border-orange-500/40 hover:bg-orange-500/20 cursor-pointer">
          <CalendarPlus className="w-4 h-4 text-orange-400" />
          <div className="flex-1 text-left">
            <p className="text-xs font-semibold text-orange-300">Create New Group Event</p>
            <p className="text-[10px] text-slate-500">Schedule a new event</p>
          </div>
          <ChevronLeft className="w-4 h-4 text-slate-500 rotate-180" />
        </button>
        <div className="space-y-2">
          {events.map((e) => (
            <div key={e.id} className="p-3 rounded-xl bg-slate-800/50 border border-slate-700">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-200">{e.title}</span>
                <span className="text-[10px] text-slate-500">{e.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400">{e.rsvps} RSVPs</span>
                <button onClick={() => { setActiveEvent(e); setEventSub("edit"); }} className="text-[10px] text-cyan-400 hover:text-cyan-300 cursor-pointer">Edit</button>
                <button onClick={() => { setActiveEvent(e); setEventSub("rsvps"); }} className="text-[10px] text-emerald-400 hover:text-emerald-300 cursor-pointer">View RSVPs</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderAnnouncement = () => (
    <div className="space-y-4">
      <Header title="Group Announcement Mode" subtitle="Broadcast control" color="text-fuchsia-400" bg="bg-fuchsia-500/20 border-fuchsia-500/30" icon={<Megaphone className="w-6 h-6" />} onBack={() => setView("hub")} />
      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/50 border border-slate-700">
        <div className="flex items-center gap-3">
          <Megaphone className="w-4 h-4 text-fuchsia-400" />
          <div>
            <p className="text-xs font-semibold text-slate-200">Announcement Mode</p>
            <p className="text-[10px] text-slate-500">{announcementMode ? "Enabled" : "Disabled"}</p>
          </div>
        </div>
        <Toggle on={announcementMode} onClick={() => { const next = !announcementMode; setAnnouncementMode(next); setAnnouncementDrawer(true); if (roomId) void updateRoomSettings(roomId, { announcement_mode: next }); }} color="bg-fuchsia-500" />
      </div>

      <AnimatePresence>
        {announcementDrawer && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="p-4 rounded-2xl border border-fuchsia-500/40 bg-fuchsia-500/10"
          >
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-fuchsia-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-fuchsia-300">
                  {announcementMode ? "Announcement Mode ON" : "Announcement Mode OFF"}
                </p>
                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                  {announcementMode
                    ? "Only group admins can now broadcast messages. Regular members will see a lock icon and cannot post until mode is turned off."
                    : "Announcement mode was turned off. All members can send messages normally again."}
                </p>
              </div>
            </div>
            <button onClick={() => setAnnouncementDrawer(false)} className="mt-3 w-full py-2 rounded-xl bg-slate-700 text-white text-xs font-bold hover:bg-slate-600 cursor-pointer">Got it</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const renderDescription = () => (
    <div className="space-y-4">
      <Header title="Group Description & Rules" subtitle="Shape the group culture" color="text-teal-400" bg="bg-teal-500/20 border-teal-500/30" icon={<FileText className="w-6 h-6" />} onBack={() => setView("hub")} />
      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-400">Description</label>
        <textarea value={groupDescription} onChange={(e) => setGroupDescription(e.target.value)} rows={3} className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:border-teal-500 focus:outline-none resize-none" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-400">Rules</label>
        <textarea value={groupRules} onChange={(e) => setGroupRules(e.target.value)} rows={4} className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:border-teal-500 focus:outline-none resize-none" />
      </div>
      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/50 border border-slate-700">
        <div className="flex items-center gap-3">
          <BookOpenCheck className="w-4 h-4 text-teal-400" />
          <div>
            <p className="text-xs font-semibold text-slate-200">Enforce Rule Acknowledgement on Join</p>
            <p className="text-[10px] text-slate-500">New members must accept rules before posting</p>
          </div>
        </div>
        <Toggle on={enforceRules} onClick={() => setEnforceRules(!enforceRules)} color="bg-teal-500" />
      </div>
      <button onClick={() => { if (roomId) void updateRoom(roomId, { description: groupDescription }).then(() => updateRoomSettings(roomId, { rules: groupRules, enforce_rules: enforceRules })); showToast("Description & rules saved"); }} className="w-full py-3 rounded-2xl bg-teal-500 text-slate-950 font-extrabold hover:bg-teal-400 cursor-pointer">Save</button>
    </div>
  );

  const renderSharedMedia = () => (
    <div className="space-y-4">
      <Header title="Shared Media & File Limits" subtitle="Storage configuration" color="text-amber-400" bg="bg-amber-500/20 border-amber-500/30" icon={<HardDrive className="w-6 h-6" />} onBack={() => setView("hub")} />
      <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700">
        <p className="text-2xl font-black text-amber-400">{mediaStats.total} <span className="text-sm text-slate-400">messages</span></p>
        <p className="text-[10px] text-slate-500 mt-1">Total messages sent in this room</p>
      </div>
      <div className="space-y-2">
        {[
          { label: "Photos", count: mediaStats.images, color: "bg-pink-500" },
          { label: "Videos", count: mediaStats.videos, color: "bg-indigo-500" },
          { label: "Voice Notes", count: mediaStats.voice, color: "bg-amber-500" },
        ].map((c) => (
          <div key={c.label} className="p-3 rounded-xl bg-slate-800/50 border border-slate-700">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-200">{c.label}</span>
              <span className="text-[10px] text-slate-500">{c.count}</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden"><div className={`h-full ${c.color} rounded-full`} style={{ width: `${mediaStats.total ? Math.min(100, (c.count / mediaStats.total) * 100) : 0}%` }} /></div>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5"><Upload className="w-3.5 h-3.5 text-amber-400" /> Max Upload Size per Member</p>
        {["25 MB", "50 MB", "100 MB", "250 MB"].map((s) => (
          <button key={s} onClick={() => { setMaxUploadSize(s); if (roomId) void updateRoomSettings(roomId, { max_upload_mb: parseInt(s, 10) }); showToast(`Max upload: ${s}`); }} className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${maxUploadSize === s ? "border-amber-500/60 bg-amber-500/10" : "border-slate-700 bg-slate-800/50"}`}>
            <span className="text-xs font-semibold text-slate-200">{s}</span>
            {maxUploadSize === s && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5"><Trash2 className="w-3.5 h-3.5 text-rose-400" /> Auto-Delete Group Media</p>
        {(["Never", "After 30 days", "After 90 days", "After 1 year"] as const).map((d) => (
          <button key={d} onClick={() => { setAutoDeleteMedia(d); if (roomId) void updateRoomSettings(roomId, { auto_delete_media: d }); showToast(`Auto-delete: ${d}`); }} className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${autoDeleteMedia === d ? "border-rose-500/60 bg-rose-500/10" : "border-slate-700 bg-slate-800/50"}`}>
            <span className="text-xs font-semibold text-slate-200">{d}</span>
            {autoDeleteMedia === d && <CheckCircle2 className="w-4 h-4 text-rose-400" />}
          </button>
        ))}
      </div>
    </div>
  );

  const renderTransferOwnership = () => {
    if (transferSub === "select") {
      return (
        <div className="space-y-4">
          <Header title="Select New Owner" subtitle="Transfer admin privileges" color="text-amber-400" bg="bg-amber-500/20 border-amber-500/30" icon={<Crown className="w-6 h-6" />} onBack={() => setTransferSub("list")} />
          <div className="space-y-2">
            {participants.filter((p) => p.role !== "Admin").map((m) => (
              <button key={m.id} onClick={() => { setTransferTarget(m); setTransferSub("verify"); }} className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-amber-500/40 cursor-pointer text-left">
                <img src={m.avatar} alt={m.name} className="w-9 h-9 rounded-full object-cover" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-200">{m.name}</p>
                  <p className="text-[10px] text-slate-500">{m.handle}</p>
                </div>
                <ChevronLeft className="w-4 h-4 text-slate-500 rotate-180" />
              </button>
            ))}
          </div>
        </div>
      );
    }
    if (transferSub === "verify" && transferTarget) {
      return (
        <div className="space-y-4">
          <Header title="Password Verification" subtitle="Confirm transfer" color="text-amber-400" bg="bg-amber-500/20 border-amber-500/30" icon={<Lock className="w-6 h-6" />} onBack={() => setTransferSub("select")} />
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-center">
            <Crown className="w-10 h-10 text-amber-400 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-200">Transfer ownership to {transferTarget.name}?</p>
            <p className="text-[11px] text-slate-400 mt-1">You will lose admin privileges after this transfer.</p>
          </div>
          <input type="password" value={transferPassword} onChange={(e) => setTransferPassword(e.target.value)} placeholder="Enter your password to confirm" className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:border-amber-500 focus:outline-none" />
          <button
            onClick={() => {
              if (!transferPassword) { showToast("Enter your password"); return; }
              setTransferring(true);
              if (roomId && currentUser?.email) {
                void verifyPasswordAndTransferOwnership(roomId, currentUser.email, currentUser.id, transferTarget.id, transferPassword).then((result) => {
                  setTransferring(false);
                  if (!result.success) {
                    showToast(result.error || "Transfer failed");
                    return;
                  }
                  refreshRoomData();
                  setTransferSub("list");
                  setTransferTarget(null);
                  setTransferPassword("");
                  showToast(`Ownership transferred to ${transferTarget.name} ✓`);
                });
                return;
              }
              setTimeout(() => {
                setParticipants(participants.map((p) => p.id === transferTarget.id ? { ...p, role: "Admin" } : p));
                setTransferring(false);
                setTransferSub("list");
                setTransferTarget(null);
                setTransferPassword("");
                showToast(`Ownership transferred to ${transferTarget.name} ✓`);
              }, 1200);
            }}
            disabled={transferring}
            className="w-full py-3 rounded-2xl bg-amber-500 text-slate-950 font-extrabold hover:bg-amber-400 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {transferring ? <><Loader2 className="w-4 h-4 animate-spin" /> Transferring...</> : <><Crown className="w-4 h-4" /> Transfer Ownership</>}
          </button>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <Header title="Transfer Group Ownership" subtitle="Pass the captain's wheel" color="text-amber-400" bg="bg-amber-500/20 border-amber-500/30" icon={<Crown className="w-6 h-6" />} onBack={() => setView("hub")} />
        <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700">
          <p className="text-xs text-slate-300 leading-relaxed">
            Transferring ownership makes another member the primary admin. You will be demoted to a regular member. This requires password verification.
          </p>
        </div>
        <button onClick={() => setTransferSub("select")} className="w-full flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/40 hover:bg-amber-500/20 cursor-pointer">
          <Crown className="w-4 h-4 text-amber-400" />
          <div className="flex-1 text-left">
            <p className="text-xs font-semibold text-amber-300">Transfer Ownership</p>
            <p className="text-[10px] text-slate-500">Select a member to become the new admin</p>
          </div>
          <ChevronLeft className="w-4 h-4 text-slate-500 rotate-180" />
        </button>
      </div>
    );
  };

  const renderExitDelete = () => {
    if (exitSub === "warning") {
      return (
        <div className="space-y-4">
          <Header title="Confirmation" subtitle="Are you sure?" color="text-rose-400" bg="bg-rose-500/20 border-rose-500/30" icon={<AlertTriangle className="w-6 h-6" />} onBack={() => setExitSub("list")} />
          <div className="p-4 rounded-2xl border border-rose-500/40 bg-rose-500/10 text-center">
            <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-200">Leave this group?</p>
            <p className="text-[11px] text-slate-400 mt-1">You will no longer have access to shared files or history.</p>
          </div>
          <div className="space-y-2">
            <button onClick={() => { setExitSub("list"); if (roomId && currentUser) void setRoomArchived(roomId, currentUser.id, true).then(() => onLeftOrDeleted?.()); showToast("Group archived instead"); }} className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-cyan-500/40 cursor-pointer">
              <Archive className="w-4 h-4 text-cyan-400" />
              <div className="flex-1 text-left">
                <p className="text-xs font-semibold text-slate-200">Archive Instead</p>
                <p className="text-[10px] text-slate-500">Hide the group without leaving</p>
              </div>
            </button>
            <button onClick={() => { setExitSub("list"); if (roomId && currentUser) void leaveRoom(roomId, currentUser.id).then(() => onLeftOrDeleted?.()); showToast("You left the group"); }} className="w-full flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/40 hover:bg-amber-500/20 cursor-pointer">
              <LogOut className="w-4 h-4 text-amber-400" />
              <div className="flex-1 text-left">
                <p className="text-xs font-semibold text-amber-300">Exit Group</p>
                <p className="text-[10px] text-slate-500">Leave as a regular member</p>
              </div>
            </button>
            {isAdmin && (
              <button onClick={() => { setExitSub("list"); if (roomId) void deleteRoom(roomId).then(() => onLeftOrDeleted?.()); showToast("Group deleted for everyone"); }} className="w-full flex items-center gap-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/40 hover:bg-rose-500/20 cursor-pointer">
                <Trash2 className="w-4 h-4 text-rose-400" />
                <div className="flex-1 text-left">
                  <p className="text-xs font-semibold text-rose-300">Delete Group for Everyone</p>
                  <p className="text-[10px] text-slate-500">Admin only — permanent</p>
                </div>
              </button>
            )}
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <Header title="Exit & Delete Group" subtitle="Manage group end-of-life" color="text-rose-400" bg="bg-rose-500/20 border-rose-500/30" icon={<Trash2 className="w-6 h-6" />} onBack={() => setView("hub")} />
        <div className="p-4 rounded-2xl border border-rose-500/40 bg-rose-500/10">
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Leaving lets you return anytime. Deleting the group for everyone removes all messages, files, and member history permanently.
          </p>
        </div>
        <button onClick={() => setExitSub("warning")} className="w-full flex items-center gap-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/40 hover:bg-rose-500/20 cursor-pointer">
          <Trash2 className="w-4 h-4 text-rose-400" />
          <div className="flex-1 text-left">
            <p className="text-xs font-semibold text-rose-300">Exit & Delete Options</p>
            <p className="text-[10px] text-slate-500">Choose archive, exit, or delete</p>
          </div>
          <ChevronLeft className="w-4 h-4 text-slate-500 rotate-180" />
        </button>
      </div>
    );
  };

  /* ------------------------- Hub grid ------------------------- */
  const renderHub = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-600 text-white">
          <Users className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            {groupName}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Group Management Matrix</p>
        </div>
        {isAdmin && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
            <Crown className="w-3 h-3" /> Admin
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {[
          { k: "permissions" as const, label: "Group Permissions", icon: <Shield className="w-5 h-5" />, grad: "from-cyan-500/20 to-blue-500/10 border-cyan-500/30 text-cyan-400" },
          { k: "approvals" as const, label: "Pending Approvals", icon: <UserCheck className="w-5 h-5" />, grad: "from-emerald-500/20 to-green-500/10 border-emerald-500/30 text-emerald-400" },
          { k: "inviteLink" as const, label: "Group Invite Link", icon: <Link2 className="w-5 h-5" />, grad: "from-indigo-500/20 to-violet-500/10 border-indigo-500/30 text-indigo-400" },
          { k: "participants" as const, label: "Participants", icon: <Users className="w-5 h-5" />, grad: "from-purple-500/20 to-fuchsia-500/10 border-purple-500/30 text-purple-400" },
          { k: "eventPlanner" as const, label: "Event Planner", icon: <Calendar className="w-5 h-5" />, grad: "from-orange-500/20 to-amber-500/10 border-orange-500/30 text-orange-400" },
          { k: "announcement" as const, label: "Announcement Mode", icon: <Megaphone className="w-5 h-5" />, grad: "from-fuchsia-500/20 to-pink-500/10 border-fuchsia-500/30 text-fuchsia-400" },
          { k: "description" as const, label: "Description & Rules", icon: <FileText className="w-5 h-5" />, grad: "from-teal-500/20 to-cyan-500/10 border-teal-500/30 text-teal-400" },
          { k: "sharedMedia" as const, label: "Shared Media & Limits", icon: <HardDrive className="w-5 h-5" />, grad: "from-amber-500/20 to-yellow-500/10 border-amber-500/30 text-amber-400" },
          { k: "transferOwnership" as const, label: "Transfer Ownership", icon: <Crown className="w-5 h-5" />, grad: "from-yellow-500/20 to-amber-500/10 border-yellow-500/30 text-yellow-400" },
          { k: "exitDelete" as const, label: "Exit & Delete Group", icon: <Trash2 className="w-5 h-5" />, grad: "from-rose-500/20 to-red-500/10 border-rose-500/30 text-rose-400" },
        ].map((tile) => (
          <button
            key={tile.k}
            onClick={() => setView(tile.k)}
            className={`group p-3.5 rounded-2xl bg-gradient-to-br border text-left transition-all hover:scale-[1.03] hover:shadow-xl cursor-pointer ${tile.grad}`}
          >
            <div className="mb-2">{tile.icon}</div>
            <p className="text-[11px] font-bold text-slate-100 group-hover:text-white leading-tight">
              {tile.label}
            </p>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={closeModal}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg max-h-[85vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl text-slate-100 relative"
          >
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white z-10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <AnimatePresence>
              {toast && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-extrabold shadow-lg whitespace-nowrap"
                >
                  {toast}
                </motion.div>
              )}
            </AnimatePresence>

            {view === "hub" && renderHub()}
            {view === "permissions" && renderPermissions()}
            {view === "approvals" && renderApprovals()}
            {view === "inviteLink" && renderInviteLink()}
            {view === "participants" && renderParticipants()}
            {view === "eventPlanner" && renderEventPlanner()}
            {view === "announcement" && renderAnnouncement()}
            {view === "description" && renderDescription()}
            {view === "sharedMedia" && renderSharedMedia()}
            {view === "transferOwnership" && renderTransferOwnership()}
            {view === "exitDelete" && renderExitDelete()}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/* ------------------------- Helper: Header ------------------------- */
const Header: React.FC<{
  title: string;
  subtitle: string;
  color: string;
  bg: string;
  icon: React.ReactNode;
  onBack: () => void;
}> = ({ title, subtitle, color, bg, icon, onBack }) => (
  <div className="flex items-center gap-3">
    <button
      onClick={onBack}
      className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white cursor-pointer shrink-0"
    >
      <ChevronLeft className="w-5 h-5" />
    </button>
    <div className={`p-3 rounded-2xl border ${bg} ${color}`}>{icon}</div>
    <div>
      <h4 className="font-bold text-white text-sm leading-tight">{title}</h4>
      <p className="text-[11px] text-slate-400">{subtitle}</p>
    </div>
  </div>
);

export default GroupManagementModal;
