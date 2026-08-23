import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Image as ImageIcon,
  Video,
  Mic,
  Link2,
  FileText,
  Timer,
  Shield,
  ShieldCheck,
  QrCode,
  BellOff,
  Palette,
  Search,
  Users,
  Download,
  Ban,
  Lock,
  Fingerprint,
  Check,
  CheckCircle2,
  Clock,
  Trash2,
} from "lucide-react";
import {
  ChatMessage,
  ConversationPreferences,
  DisappearingTimer,
  MuteDuration,
  MediaFilter,
  WallpaperChoice,
  WallpaperCategory,
  SharedGroup,
  NoticeFn,
} from "../../types";

/** Media, Links & Docs item type */
interface MediaItem {
  id: string;
  kind: MediaFilter;
  url?: string;
  preview?: string;
  title: string;
  subtitle: string;
  created_at: string;
}

type DrawerView =
  | "home"
  | "media"
  | "disappearing"
  | "encryption"
  | "mute"
  | "wallpaper"
  | "search"
  | "groups"
  | "group_detail"
  | "export"
  | "block_report"
  | "lock";

interface ChatInfoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  contactName: string;
  contactAvatar: string;
  targetUserId: string;
  conversationId: string;
currentUserId: string;
  messages: ChatMessage[];
  prefs: ConversationPreferences;
  onPrefsChange: (patch: Partial<ConversationPreferences>) => void;
  onNotice: NoticeFn;
  onClearHistory: () => void;
  onOpenGroupManagement?: () => void;
}

const SOLID_COLORS = [
  { label: "Slate", value: "#0f172a" },
  { label: "Navy", value: "#0c1a3a" },
  { label: "Emerald", value: "#064e3b" },
  { label: "Plum", value: "#3b0764" },
  { label: "Crimson", value: "#450a0a" },
  { label: "Cobalt", value: "#1e1b4b" },
];

const DARK_GRADIENTS = [
  { label: "Midnight", value: "linear-gradient(135deg,#0f0c29,#302b63,#24243e)" },
  { label: "Aurora", value: "linear-gradient(135deg,#0f2027,#203a43,#2c5364)" },
  { label: "Nautical", value: "linear-gradient(135deg,#020111,#20124d,#064e3b)" },
  { label: "Cyberpunk", value: "linear-gradient(135deg,#0f0c29,#302b63,#b5365c)" },
  { label: "Deep Ocean", value: "linear-gradient(135deg,#000428,#004e92)" },
];

const TIMER_OPTIONS: DisappearingTimer[] = ["Off", "24 Hours", "7 Days", "90 Days"];
const MUTE_OPTIONS: MuteDuration[] = ["1 Hour", "8 Hours", "1 Week", "Always"];

const DEFAULT_GROUPS: SharedGroup[] = [
  { id: "g1", name: "Nautical Explorers", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100", members_count: 42, last_active: "2h ago", is_active: true },
  { id: "g2", name: "HeyLook Beta Crew", avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100", members_count: 18, last_active: "5h ago", is_active: true },
  { id: "g3", name: "Startup Founders", avatar: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=100", members_count: 27, last_active: "1d ago", is_active: false },
];

const REPORT_REASONS = [
  "Spam or Malicious Links",
  "Harassment or Bullying",
  "Impersonation",
  "Inappropriate Content",
  "Scam or Fraud",
  "Violence or Threats",
];

/** Build a deterministic pseudo-encryption hash from the conversation ids */
function buildSafetyNumbers(a: string, b: string): string {
  const seed = `${a}${b}`;
  let hash = "";
  let acc = 0;
  for (let i = 0; i < seed.length; i++) {
    acc = (acc * 31 + seed.charCodeAt(i)) % 9973;
  }
  for (let i = 0; i < 60; i++) {
    acc = (acc * 33 + i * 7) % 9973;
    hash += (acc % 10).toString();
  }
  // Group into 5s
  return hash.match(/.{1,5}/g)?.join(" ") || hash;
}

/** Render a lightweight pseudo-QR grid from a seed */
function QRGrid({ seed }: { seed: string }) {
  const cells = useMemo(() => {
    let acc = 0;
    for (let i = 0; i < seed.length; i++) acc = (acc * 31 + seed.charCodeAt(i)) % 9973;
    const arr: boolean[] = [];
    for (let i = 0; i < 132; i++) {
      acc = (acc * 33 + i * 13) % 9973;
      arr.push(acc % 2 === 0);
    }
    return arr;
  }, [seed]);
  return (
    <div className="grid grid-cols-12 gap-0.5 w-40 h-40 p-2 bg-white rounded-xl">
      {cells.map((on, i) => (
        <div
          key={i}
          className={`rounded-[1px] ${on ? "bg-slate-900" : "bg-white border border-slate-200"}`}
        />
      ))}
    </div>
  );
}

export const ChatInfoDrawer: React.FC<ChatInfoDrawerProps> = ({
  isOpen,
  onClose,
  contactName,
  contactAvatar,
  targetUserId,
  conversationId,
  currentUserId,
  messages,
  prefs,
onPrefsChange,
  onNotice,
  onClearHistory,
  onOpenGroupManagement,
}) => {
  const [view, setView] = useState<DrawerView>("home");
  const [selectedMediaFilter, setSelectedMediaFilter] = useState<MediaFilter>("Photos");
  const [encryptionMode, setEncryptionMode] = useState<"numbers" | "qr">("numbers");
  const [wallpaperCat, setWallpaperCat] = useState<WallpaperCategory>("Solid Colors");
  const [searchFilters, setSearchFilters] = useState({
    byDate: false,
    bySender: false,
    hasMedia: false,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<SharedGroup | null>(null);
  const [includeMedia, setIncludeMedia] = useState(true);
  const [reportStep, setReportStep] = useState<"reasons" | "delete" | "confirm">("reasons");
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [deleteChat, setDeleteChat] = useState(false);
  const [lockPin, setLockPin] = useState("");
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [mediaSearch, setMediaSearch] = useState("");

  // Compute media items from messages
  const mediaItems: MediaItem[] = useMemo(() => {
    const items: MediaItem[] = [];
    messages.forEach((m) => {
      if (m.type === "image" || m.image_url) {
        items.push({
          id: `${m.id}-img`,
          kind: "Photos",
          url: m.image_url,
          preview: m.image_url,
          title: "Photo",
          subtitle: m.text || "Shared image",
          created_at: m.created_at,
        });
      } else if (m.type === "voice" || m.audio_url) {
        items.push({
          id: `${m.id}-voice`,
          kind: "Audio Clips",
          title: "Voice note",
          subtitle: m.audio_duration ? `${m.audio_duration} sec` : "Audio message",
          created_at: m.created_at,
        });
      } else if (/(https?:\/\/[^\s]+)/.test(m.text || "")) {
        items.push({
          id: `${m.id}-link`,
          kind: "Links",
          title: "Shared link",
          subtitle: m.text || "",
          created_at: m.created_at,
        });
      } else if ((m.text || "").match(/\.(pdf|docx?|txt|xlsx?|pptx?)(\?.*)?$/i)) {
        items.push({
          id: `${m.id}-doc`,
          kind: "Documents",
          title: "Document",
          subtitle: m.text || "",
          created_at: m.created_at,
        });
      }
    });
    return items;
  }, [messages]);

  const filteredMedia = mediaItems.filter(
    (m) =>
      m.kind === selectedMediaFilter &&
      (mediaSearch ? m.title.toLowerCase().includes(mediaSearch.toLowerCase()) || (m.subtitle || "").toLowerCase().includes(mediaSearch.toLowerCase()) : true),
  );

  const safetyHash = buildSafetyNumbers(currentUserId, targetUserId);

  const filteredSearchResults = useMemo(() => {
    let results = messages;
    if (searchFilters.bySender) results = results.filter((m) => m.is_me);
    if (searchFilters.hasMedia) results = results.filter((m) => m.type === "image" || m.type === "voice" || !!m.image_url || !!m.audio_url);
    if (searchTerm) results = results.filter((m) => m.text.toLowerCase().includes(searchTerm.toLowerCase()));
    return results.slice(-30).reverse();
  }, [messages, searchTerm, searchFilters]);

  const timerLabel = prefs.disappearingTimer || "Off";
  const isMuted = !!prefs.mutedUntil && new Date(prefs.mutedUntil).getTime() > Date.now();

  const goBack = () => {
    if (view === "group_detail") {
      setView("groups");
      setSelectedGroup(null);
    } else {
      setView("home");
    }
  };

  const persist = (patch: Partial<ConversationPreferences>) => {
    onPrefsChange(patch);
  };

  const Row = ({
    icon,
    label,
    sub,
    onClick,
    danger,
  }: {
    icon: React.ReactNode;
    label: string;
    sub?: string;
    onClick?: () => void;
    danger?: boolean;
  }) => (
    <button
      onClick={onClick}
      className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2 text-left hover:border-cyan-500/40 transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className={`shrink-0 p-1.5 rounded-lg ${danger ? "bg-rose-500/15 text-rose-400" : "bg-slate-800 text-cyan-400"}`}>
          {icon}
        </span>
        <div className="min-w-0">
          <p className={`font-semibold text-xs ${danger ? "text-rose-300" : "text-slate-100"}`}>{label}</p>
          {sub && <p className="text-[10px] text-slate-400 truncate">{sub}</p>}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
    </button>
  );

  const SubHeader = ({ title }: { title: string }) => (
    <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
      <button onClick={goBack} className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white">
        <ChevronLeft className="w-4 h-4" />
      </button>
      <h3 className="font-bold text-sm text-white">{title}</h3>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-40"
          />
          {/* Drawer */}
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-slate-900 border-l border-slate-800 shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <img src={contactAvatar} alt={contactName} className="w-10 h-10 rounded-full object-cover border border-slate-700" />
                <div>
                  <h3 className="font-bold text-sm text-white">{contactName}</h3>
                  <p className="text-[10px] text-slate-400">Chat Info</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {view === "home" && (
                <>
                  <Row
                    icon={<ImageIcon className="w-4 h-4" />}
                    label="Media, Links & Docs"
                    sub={`${mediaItems.length} items`}
                    onClick={() => setView("media")}
                  />
                  <Row
                    icon={<Timer className="w-4 h-4" />}
                    label="Disappearing Messages"
                    sub={timerLabel === "Off" ? "Off" : `Messages disappear after ${timerLabel.toLowerCase()}`}
                    onClick={() => setView("disappearing")}
                  />
                  <Row
                    icon={<Shield className="w-4 h-4" />}
                    label="Encryption Settings"
                    sub="Safety numbers & QR verification"
                    onClick={() => setView("encryption")}
                  />
                  <Row
                    icon={<BellOff className="w-4 h-4" />}
                    label="Mute Notifications"
                    sub={isMuted ? "Muted" : "Notifications on"}
                    onClick={() => setView("mute")}
                  />
                  <Row
                    icon={<Palette className="w-4 h-4" />}
                    label="Custom Wallpaper"
                    sub={prefs.wallpaper?.value?.split(",")[0] || "Default"}
                    onClick={() => setView("wallpaper")}
                  />
                  <Row
                    icon={<Search className="w-4 h-4" />}
                    label="Search in Conversation"
                    sub="Find messages by date, sender, or media"
                    onClick={() => setView("search")}
                  />
                  <Row
                    icon={<Users className="w-4 h-4" />}
                    label="Shared Groups"
                    sub={`${DEFAULT_GROUPS.length} groups in common`}
                    onClick={() => setView("groups")}
                  />
                  <Row
                    icon={<Download className="w-4 h-4" />}
                    label="Export Chat History"
                    sub="Download a ZIP archive"
                    onClick={() => setView("export")}
                  />
                  <Row
                    icon={<Ban className="w-4 h-4" />}
                    label="Block & Report"
                    sub={prefs.isBlocked ? "Blocked" : "Manage privacy"}
                    danger={prefs.isBlocked}
                    onClick={() => {
                      setReportStep("reasons");
                      setSelectedReasons([]);
                      setDeleteChat(false);
                      setView("block_report");
                    }}
                  />
                  {onOpenGroupManagement && (
                    <Row
                      icon={<Users className="w-4 h-4" />}
                      label="Group Management"
                      sub="Add, remove, promote members"
                      onClick={onOpenGroupManagement}
                    />
                  )}
                  <Row
                    icon={<Lock className="w-4 h-4" />}
                    label="Lock Chat"
                    sub={prefs.isLocked ? "Locked" : "Biometric + PIN"}
                    onClick={() => setView("lock")}
                  />
                  <Row
                    icon={<Trash2 className="w-4 h-4" />}
                    label="Clear Chat History"
                    sub="Delete messages from this conversation"
                    danger
                    onClick={() => {
                      if (window.confirm("Clear all messages in this chat?")) {
                        onClearHistory();
                        onClose();
                      }
                    }}
                  />
                </>
              )}

              {/* 11. MEDIA, LINKS & DOCS */}
              {view === "media" && (
                <>
                  <SubHeader title="Media, Links & Docs" />
                  <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2 text-[11px]">
                    {(["Photos", "Videos", "Audio Clips", "Links", "Documents"] as MediaFilter[]).map((f) => (
                      <button
                        key={f}
                        onClick={() => setSelectedMediaFilter(f)}
                        className={`px-2 py-1 rounded-lg font-bold ${selectedMediaFilter === f ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "text-slate-400"}`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                  <input
                    value={mediaSearch}
                    onChange={(e) => setMediaSearch(e.target.value)}
                    placeholder={`Search ${selectedMediaFilter.toLowerCase()}...`}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-slate-100"
                  />
                  <div className="space-y-1.5">
                    {filteredMedia.length === 0 && (
                      <p className="text-center text-[11px] text-slate-500 py-6">No {selectedMediaFilter.toLowerCase()} found.</p>
                    )}
                    {filteredMedia.map((m) => (
                      <div key={m.id} className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2.5">
                        {m.preview ? (
                          <img src={m.preview} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                        ) : (
                          <span className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-cyan-400 shrink-0">
                            {m.kind === "Audio Clips" ? <Mic className="w-4 h-4" /> : m.kind === "Links" ? <Link2 className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-100 truncate">{m.title}</p>
                          <p className="text-[10px] text-slate-400 truncate">{m.subtitle}</p>
                        </div>
                        <span className="text-[9px] text-slate-500 shrink-0">
                          {new Date(m.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* 12. DISAPPEARING MESSAGES */}
              {view === "disappearing" && (
                <>
                  <SubHeader title="Disappearing Messages" />
                  <p className="text-[11px] text-slate-400">
                    New messages in this chat will disappear after the selected duration.
                  </p>
                  <div className="space-y-1.5">
                    {TIMER_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => {
                          persist({ disappearingTimer: opt });
                          onNotice(`Disappearing messages: ${opt}`);
                        }}
                        className={`w-full p-3 rounded-xl border flex items-center justify-between cursor-pointer ${
                          timerLabel === opt ? "bg-cyan-500/15 border-cyan-500/40" : "bg-slate-950 border-slate-800"
                        }`}
                      >
                        <span className="text-xs font-semibold text-slate-100">{opt}</span>
                        {timerLabel === opt && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* 13. ENCRYPTION SETTINGS */}
              {view === "encryption" && (
                <>
                  <SubHeader title="Encryption Settings" />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEncryptionMode("numbers")}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold ${encryptionMode === "numbers" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "text-slate-400"}`}
                    >
                      Safety Numbers
                    </button>
                    <button
                      onClick={() => setEncryptionMode("qr")}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold ${encryptionMode === "qr" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "text-slate-400"}`}
                    >
                      QR Scanner
                    </button>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <p className="text-xs font-bold text-emerald-300">Messages end-to-end encrypted</p>
                    </div>
                    {encryptionMode === "numbers" ? (
                      <div className="space-y-2">
                        <p className="text-[10px] text-slate-400">Scan the code or compare the numbers below to verify your contacts.</p>
                        <div className="p-2 rounded-lg bg-slate-900 border border-slate-700 font-mono text-[11px] text-cyan-300 break-all leading-relaxed">
                          {safetyHash}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <img src={contactAvatar} alt="" className="w-6 h-6 rounded-full" />
                          <span>{contactName}</span>
                          <span className="ml-auto text-cyan-400 font-mono">{safetyHash.slice(0, 12)}…</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <QRGrid seed={safetyHash} />
                        <p className="text-[10px] text-slate-400">Point at the other phone's code to verify this Chat.</p>
                        <button
                          onClick={() => onNotice("QR code scanned & verified ✔")}
                          className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold hover:bg-emerald-500/30"
                        >
                          Simulate Scan
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* 14. MUTE NOTIFICATIONS */}
              {view === "mute" && (
                <>
                  <SubHeader title="Mute Notifications" />
                  <p className="text-[11px] text-slate-400">Choose how long to silence notifications from this chat.</p>
                  <div className="space-y-1.5">
                    {MUTE_OPTIONS.map((opt) => {
                      const hours = opt === "1 Hour" ? 1 : opt === "8 Hours" ? 8 : opt === "1 Week" ? 168 : 8760 * 5;
                      return (
                        <button
                          key={opt}
                          onClick={() => {
                            if (opt === "Always") {
                              persist({ mutedUntil: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString() });
                            } else {
                              persist({ mutedUntil: new Date(Date.now() + hours * 3600 * 1000).toISOString() });
                            }
                            onNotice(`Notifications muted for ${opt}`);
                            onClose();
                          }}
                          className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between hover:border-cyan-500/40 cursor-pointer"
                        >
                          <span className="text-xs font-semibold text-slate-100">{opt}</span>
                          <BellOff className="w-4 h-4 text-slate-500" />
                        </button>
                      );
                    })}
                    {isMuted && (
                      <button
                        onClick={() => {
                          persist({ mutedUntil: null });
                          onNotice("Notifications unmuted");
                        }}
                        className="w-full p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold hover:bg-rose-500/20 cursor-pointer"
                      >
                        Unmute Notifications
                      </button>
                    )}
                  </div>
                </>
              )}

              {/* 15. CUSTOM WALLPAPER */}
              {view === "wallpaper" && (
                <>
                  <SubHeader title="Custom Wallpaper" />
                  <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2 text-[11px]">
                    {(["Solid Colors", "Dark Gradients", "Custom Gallery"] as WallpaperCategory[]).map((c) => (
                      <button
                        key={c}
                        onClick={() => setWallpaperCat(c)}
                        className={`px-2 py-1 rounded-lg font-bold ${wallpaperCat === c ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "text-slate-400"}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  {wallpaperCat === "Solid Colors" && (
                    <div className="grid grid-cols-3 gap-2">
                      {SOLID_COLORS.map((c) => (
                        <button
                          key={c.value}
                          onClick={() => {
                            persist({ wallpaper: { category: "Solid Colors", value: c.label, solid: c.value } });
                            onNotice(`Wallpaper set to ${c.label}`);
                          }}
                          className="h-16 rounded-xl border border-slate-700 flex flex-col items-center justify-center gap-1 hover:scale-105 transition cursor-pointer"
                          style={{ background: c.value }}
                        >
                          <span className="text-[10px] font-bold text-white/90">{c.label}</span>
                          {prefs.wallpaper?.solid === c.value && <Check className="w-3 h-3 text-white" />}
                        </button>
                      ))}
                    </div>
                  )}
                  {wallpaperCat === "Dark Gradients" && (
                    <div className="grid grid-cols-2 gap-2">
                      {DARK_GRADIENTS.map((c) => (
                        <button
                          key={c.label}
                          onClick={() => {
                            persist({ wallpaper: { category: "Dark Gradients", value: c.label, gradient: c.value } });
                            onNotice(`Wallpaper set to ${c.label}`);
                          }}
                          className="h-16 rounded-xl border border-slate-700 flex items-center justify-center hover:scale-105 transition cursor-pointer"
                          style={{ background: c.value }}
                        >
                          <span className="text-[10px] font-bold text-white/90">{c.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {wallpaperCat === "Custom Gallery" && (
                    <div className="space-y-2 text-center">
                      <button
                        onClick={() => onNotice("Gallery upload enabled (demo)")}
                        className="w-full p-4 rounded-xl border-2 border-dashed border-slate-700 text-slate-400 hover:border-cyan-500 text-xs cursor-pointer"
                      >
                        <ImageIcon className="w-6 h-6 mx-auto mb-1" />
                        Upload from Gallery
                      </button>
                      <button
                        onClick={() => {
                          persist({ wallpaper: null });
                          onNotice("Wallpaper reset to default");
                        }}
                        className="w-full p-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 cursor-pointer"
                      >
                        Reset to Default
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* 16. SEARCH IN CONVERSATION */}
              {view === "search" && (
                <>
                  <SubHeader title="Search in Conversation" />
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search messages..."
                      className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-slate-100"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    {(["bySender", "hasMedia"] as const).map((k) => (
                      <button
                        key={k}
                        onClick={() => setSearchFilters((s) => ({ ...s, [k]: !s[k] }))}
                        className={`px-2 py-1 rounded-lg border font-bold ${searchFilters[k] ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40" : "bg-slate-950 text-slate-400 border-slate-800"}`}
                      >
                        {k === "bySender" ? "By Sender" : "Has Media"}
                      </button>
                    ))}
                    <button
                      onClick={() => setSearchFilters((s) => ({ ...s, byDate: !s.byDate }))}
                      className={`px-2 py-1 rounded-lg border font-bold flex items-center gap-1 ${searchFilters.byDate ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40" : "bg-slate-950 text-slate-400 border-slate-800"}`}
                    >
                      <Clock className="w-3 h-3" /> Today
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {searchFilters.byDate
                      ? messages.filter((m) => new Date(m.created_at).toDateString() === new Date().toDateString()).slice(-20).reverse().map((m) => (
                          <div key={m.id} className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                            <p className="text-xs text-slate-100">{m.text}</p>
                            <p className="text-[9px] text-slate-500 mt-0.5">{m.is_me ? "You" : contactName} • {new Date(m.created_at).toLocaleTimeString()}</p>
                          </div>
                        ))
                      : filteredSearchResults.map((m) => (
                          <div key={m.id} className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                            <p className="text-xs text-slate-100">{m.type === "image" ? "📷 [Photo]" : m.type === "voice" ? "🎙 [Voice note]" : m.text}</p>
                            <p className="text-[9px] text-slate-500 mt-0.5">{m.is_me ? "You" : contactName} • {new Date(m.created_at).toLocaleTimeString()}</p>
                          </div>
                        ))}
                  </div>
                </>
              )}

              {/* 17. SHARED GROUPS */}
              {view === "groups" && (
                <>
                  <SubHeader title="Shared Groups" />
                  <div className="space-y-1.5">
                    {DEFAULT_GROUPS.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => {
                          setSelectedGroup(g);
                          setView("group_detail");
                        }}
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2.5 hover:border-cyan-500/40 cursor-pointer"
                      >
                        <img src={g.avatar} alt="" className="w-9 h-9 rounded-xl object-cover shrink-0" />
                        <div className="min-w-0 flex-1 text-left">
                          <p className="text-xs font-semibold text-slate-100 truncate">{g.name}</p>
                          <p className="text-[10px] text-slate-400">{g.members_count} members • {g.last_active}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* 17b. GROUP DETAIL */}
              {view === "group_detail" && selectedGroup && (
                <>
                  <SubHeader title={selectedGroup.name} />
                  <div className="flex flex-col items-center gap-2 py-2">
                    <img src={selectedGroup.avatar} alt="" className="w-16 h-16 rounded-2xl object-cover border border-slate-700" />
                    <p className={`text-xs font-bold ${selectedGroup.is_active ? "text-emerald-300" : "text-slate-400"}`}>
                      {selectedGroup.is_active ? "Active" : "Last active " + selectedGroup.last_active}
                    </p>
                    <p className="text-[11px] text-slate-400">{selectedGroup.members_count} members</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                    <p className="font-bold text-slate-100">Group description</p>
                    <p>You and {contactName} are both members of this group. Chat, share media, and collaborate in real time within the HeyLook nautical stream.</p>
                  </div>
                  <button
                    onClick={() => onNotice(`Opening ${selectedGroup.name}`)}
                    className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-bold hover:bg-cyan-500/30 cursor-pointer"
                  >
                    View Group
                  </button>
                </>
              )}

              {/* 18. EXPORT CHAT HISTORY */}
              {view === "export" && (
                <>
                  <SubHeader title="Export Chat History" />
                  <div className="space-y-1.5">
                    <button
                      onClick={() => setIncludeMedia(true)}
                      className={`w-full p-3 rounded-xl border flex items-center justify-between cursor-pointer ${includeMedia ? "bg-cyan-500/15 border-cyan-500/40" : "bg-slate-950 border-slate-800"}`}
                    >
                      <span className="text-xs font-semibold text-slate-100">Include Media</span>
                      {includeMedia && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                    </button>
                    <button
                      onClick={() => setIncludeMedia(false)}
                      className={`w-full p-3 rounded-xl border flex items-center justify-between cursor-pointer ${!includeMedia ? "bg-cyan-500/15 border-cyan-500/40" : "bg-slate-950 border-slate-800"}`}
                    >
                      <span className="text-xs font-semibold text-slate-100">Text Only</span>
                      {!includeMedia && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                    </button>
                    <button
                      onClick={() => {
                        const text = messages
                          .map((m) => `${new Date(m.created_at).toLocaleString()} • ${m.is_me ? "You" : contactName}: ${m.text || `[${m.type}]`}`)
                          .join("\n");
                        const blob = new Blob([text], { type: "text/plain" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `heylook_${contactName.replace(/\s+/g, "_")}.txt`;
                        a.click();
                        URL.revokeObjectURL(url);
                        onNotice("Chat history exported as .txt (ZIP demo)");
                        onClose();
                      }}
                      className="w-full p-3 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center justify-center gap-2 hover:bg-emerald-500/30 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      Download Archive
                    </button>
                  </div>
                </>
              )}

              {/* 19. BLOCK & REPORT */}
              {view === "block_report" && (
                <>
                  <SubHeader title="Block & Report" />
                  {reportStep === "reasons" && (
                    <div className="space-y-1.5">
                      <p className="text-[11px] text-slate-400">Select reasons for reporting this chat:</p>
                      {REPORT_REASONS.map((r) => (
                        <button
                          key={r}
                          onClick={() =>
                            setSelectedReasons((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]))
                          }
                          className={`w-full p-2.5 rounded-xl border flex items-center justify-between cursor-pointer ${
                            selectedReasons.includes(r) ? "bg-rose-500/15 border-rose-500/40" : "bg-slate-950 border-slate-800"
                          }`}
                        >
                          <span className="text-xs text-slate-100">{r}</span>
                          {selectedReasons.includes(r) && <Check className="w-4 h-4 text-rose-400" />}
                        </button>
                      ))}
                      <button
                        onClick={() => setReportStep("delete")}
                        disabled={selectedReasons.length === 0}
                        className="w-full p-2.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold disabled:opacity-40 cursor-pointer"
                      >
                        Continue
                      </button>
                    </div>
                  )}
                  {reportStep === "delete" && (
                    <div className="space-y-2">
                      <p className="text-[11px] text-slate-400">Also delete this chat?</p>
                      <button
                        onClick={() => setDeleteChat(!deleteChat)}
                        className={`w-full p-3 rounded-xl border flex items-center justify-between cursor-pointer ${deleteChat ? "bg-rose-500/15 border-rose-500/40" : "bg-slate-950 border-slate-800"}`}
                      >
                        <span className="text-xs font-semibold text-slate-100">Delete this chat</span>
                        {deleteChat && <CheckCircle2 className="w-4 h-4 text-rose-400" />}
                      </button>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setReportStep("reasons")}
                          className="flex-1 p-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                        >
                          Back
                        </button>
                        <button
                          onClick={() => setReportStep("confirm")}
                          className="flex-1 p-2.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold cursor-pointer"
                        >
                          Confirm
                        </button>
                      </div>
                    </div>
                  )}
                  {reportStep === "confirm" && (
                    <div className="space-y-2 text-center">
                      <Ban className="w-10 h-10 text-rose-400 mx-auto" />
                      <p className="text-sm font-bold text-white">Report Submitted</p>
                      <p className="text-[11px] text-slate-400">
                        {selectedReasons.length} reason(s) will be reviewed by our moderation team.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setView("home");
                            onNotice("Report submitted (demo)");
                          }}
                          className="flex-1 p-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                        >
                          Close
                        </button>
                        <button
                          onClick={() => {
                            persist({ isBlocked: true });
                            onNotice(`${contactName} has been blocked`);
                          }}
                          className="flex-1 p-2.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold cursor-pointer"
                        >
                          Block User
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* 20. LOCK CHAT */}
              {view === "lock" && (
                <>
                  <SubHeader title="Lock Chat" />
                  <div className="space-y-2">
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Fingerprint className="w-4 h-4 text-cyan-400" />
                          <span className="text-xs font-semibold text-slate-100">Biometric Lock</span>
                        </div>
                        <button
                          onClick={() => {
                            setBiometricEnabled(!biometricEnabled);
                            onNotice(biometricEnabled ? "Biometric lock disabled" : "Biometric lock enabled");
                          }}
                          className={`w-10 h-5 rounded-full relative transition ${biometricEnabled ? "bg-cyan-500" : "bg-slate-700"}`}
                        >
                          <span
                            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${biometricEnabled ? "left-5" : "left-0.5"}`}
                          />
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Require Touch ID / Face ID to open this chat.</p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <p className="text-xs font-semibold text-slate-100 mb-2">Security PIN</p>
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        value={lockPin}
                        onChange={(e) => setLockPin(e.target.value.replace(/\D/g, ""))}
                        placeholder="4-digit PIN"
                        className="w-full px-3 py-2 text-center text-lg tracking-[0.5em] rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-500 text-cyan-300"
                      />
                      <button
                        disabled={lockPin.length !== 4}
                        onClick={() => {
                          persist({
                            isLocked: true,
                            lockConfig: { enabled: true, requiresBiometric: biometricEnabled, pin: lockPin },
                          });
                          onNotice("Chat locked with PIN");
                        }}
                        className="w-full mt-2 p-2.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-bold disabled:opacity-40 cursor-pointer"
                      >
                        Enable Lock
                      </button>
                    </div>

                    {prefs.isLocked && (
                      <button
                        onClick={() => {
                          persist({ isLocked: false, lockConfig: null });
                          onNotice("Chat unlocked");
                        }}
                        className="w-full p-2.5 rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/30 text-xs font-bold hover:bg-rose-500/20 cursor-pointer"
                      >
                        Disable Lock
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
