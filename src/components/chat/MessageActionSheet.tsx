import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Smile,
  CornerDownRight,
  Forward,
  Star,
  Globe,
  Info,
  Pin,
  Edit3,
  MoreHorizontal,
  Flag,
  Download,
  Search,
  Users,
  Send,
  ChevronRight,
  ArrowLeft,
  Clock,
  Shield,
  Eye,
  Ship,
  Anchor,
  Check,
  Bookmark,
  Trash2,
  Sparkles,
} from "lucide-react";
import {
  ChatMessage,
  Profile,
  Conversation,
  ReactionCategory,
  StarCollection,
  TranslateLanguage,
  PinDuration,
  ReportReason,
  ExportFormat,
  MessageInfo,
  MessageEditHistory,
} from "../../types";
import { supabase } from "../../lib/supabase";
import { chatService } from "../../services/chatService";

// ============================================================================
// REACTION PRESET DATA
// ============================================================================
const REACTION_SETS: Record<ReactionCategory, string[]> = {
  "Frequently Used": ["👍", "❤️", "😂", "🔥", "👏", "😮", "🎉", "💯"],
  Animals: ["🐶", "🐱", "🦊", "🐼", "🐸", "🦁", "🐙", "🦋"],
  Objects: ["⚽", "🎸", "📚", "☂️", "🎁", "💎", "🧭", "⚓"],
};

const REACTION_CATEGORIES: ReactionCategory[] = [
  "Frequently Used",
  "Animals",
  "Objects",
];

const STAR_COLLECTIONS: StarCollection[] = ["Work", "Personal", "Read Later"];
const TRANSLATE_LANGUAGES: TranslateLanguage[] = [
  "English",
  "Spanish",
  "French",
  "Swahili",
  "Japanese",
];
const PIN_DURATIONS: PinDuration[] = ["24 Hours", "7 Days", "30 Days"];
const REPORT_REASONS: ReportReason[] = ["Spam", "Harassment", "Misinformation"];
const EXPORT_FORMATS: ExportFormat[] = ["TXT", "JSON", "PDF"];

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================
export type MessageActionSheetView =
  | "main"
  | "react"
  | "reply"
  | "forward"
  | "star"
  | "translate"
  | "info"
  | "pin"
  | "edit"
  | "more"
  | "report"
  | "export"
  | "editHistory";

interface MessageActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  message: ChatMessage | null;
  currentUser: Profile;
  targetUser: Conversation["user"];
  isMe?: boolean;
  isPinned?: boolean;
  onReply?: () => void;
  onForwardSent?: (targetUserIds: string[], count: number) => void;
  onStarred?: (collection: StarCollection) => void;
  onUnstarred?: () => void;
  onTranslated?: (lang: TranslateLanguage, result: string) => void;
  onPinned?: (duration: PinDuration) => void;
  onUnpinned?: () => void;
  onEdited?: (newText: string) => void;
  onEditHistorySaved?: (previousText: string) => void;
  onDeleteMessage?: (messageId: string) => void; // New prop for deleting messages
  draftConversations?: Conversation[];
  availableContacts?: Profile[];
  onReplyPrivately?: (targetProfile: Profile) => void;
}

// ============================================================================
// HELPER: Trigger a local file download
// ============================================================================
function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const MessageActionSheet: React.FC<MessageActionSheetProps> = ({
  isOpen,
  onClose,
  message,
  currentUser,
  targetUser,
  isMe,
  isPinned = false,
  onReply,
  onForwardSent,
  onStarred,
  onUnstarred,
  onTranslated,
  onPinned,
  onUnpinned,
  onEdited,
  onEditHistorySaved,
  onDeleteMessage,
  draftConversations = [],
  availableContacts = [],
  onReplyPrivately,
}) => {
  const [view, setView] = useState<MessageActionSheetView>("main");
  const [reactionCategory, setReactionCategory] =
    useState<ReactionCategory>("Frequently Used");
  const [replySearch, setReplySearch] = useState("");
  const [forwardSearch, setForwardSearch] = useState("");
  const [selectedForwardTargets, setSelectedForwardTargets] = useState<
    string[]
  >([]);
  const [starCollection, setStarCollection] =
    useState<StarCollection>("Read Later");
  const [translateLang, setTranslateLang] =
    useState<TranslateLanguage>("Spanish");
  const [pinDuration, setPinDuration] = useState<PinDuration>("24 Hours");
  const [reportReason, setReportReason] = useState<ReportReason>("Spam");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("TXT");
  const [editText, setEditText] = useState("");
  const [messageInfo, setMessageInfo] = useState<MessageInfo | null>(null);
  const [editHistory, setEditHistory] = useState<MessageEditHistory[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Reset view whenever the sheet opens / changes message
  useEffect(() => {
    if (isOpen) {
      setView("main");
      setNotice(null);
      setEditText(message?.text || "");
    }
  }, [isOpen, message?.id]);

  // Debounce notice
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 2200);
    return () => clearTimeout(t);
  }, [notice]);

  const flash = (msg: string) => setNotice(msg);

  if (!isOpen || !message) return null;

  // =========================================================================
  // REACTION VIEW
  // =========================================================================
  const handleReact = (emoji: string, cat: ReactionCategory) => {
    chatService.reactToMessage(message.id, currentUser.id, emoji, cat);
    flash(`Reacted ${emoji}`);
    onClose();
  };

  // =========================================================================
  // REPLY PRIVATELY VIEW
  // =========================================================================
  const safeContacts = (availableContacts || []).filter(
    (c) => c?.id && c.id !== currentUser?.id && !(c as any).is_self,
  );
  const q = (replySearch || "").trim().toLowerCase();
  const filteredContacts = safeContacts.filter(
    (c) =>
      !q ||
      (c.full_name || "").toLowerCase().includes(q) ||
      (c.username || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q),
  );

  // =========================================================================
  // FORWARD VIEW
  // =========================================================================
  const safeDrafts = (draftConversations || []).filter(
    (c) => c?.user?.id && c.user.id !== currentUser?.id,
  );
  const fq = (forwardSearch || "").trim().toLowerCase();
  const filteredDrafts = safeDrafts.filter(
    (c) =>
      !fq ||
      (c?.user?.name || "").toLowerCase().includes(fq) ||
      (c?.lastMessage || "").toLowerCase().includes(fq),
  );

  const toggleForwardTarget = (id: string) => {
    setSelectedForwardTargets((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSendForward = () => {
    if (selectedForwardTargets.length === 0) return;
    onForwardSent?.(selectedForwardTargets, selectedForwardTargets.length);
    flash(`Forwarded to ${selectedForwardTargets.length} chats`);
    setSelectedForwardTargets([]);
    onClose();
  };

  // =========================================================================
  // STAR / BOOKMARK VIEW
  // =========================================================================
  const handleConfirmStar = () => {
    onStarred?.(starCollection);
    flash(`Bookmarked in ${starCollection}`);
    onClose();
  };

  const handleRemoveStar = () => {
    onUnstarred?.();
    flash("Bookmark removed");
    onClose();
  };

  // =========================================================================
  // TRANSLATE VIEW
  // =========================================================================
  const handleTranslate = async () => {
    setIsTranslating(true);
    try {
      const res = await import("../../services/ollamaService");
      const result = await res.ollamaService.translateText(
        message.text,
        translateLang,
      );
      onTranslated?.(translateLang, result.result || "Translation unavailable");
      flash(`Translated to ${translateLang}`);
    } catch {
      // Localized fallback when Ollama is unavailable
      const fake = `[${translateLang}] ${message.text}`;
      onTranslated?.(translateLang, fake);
      flash(`Translated to ${translateLang} (offline)`);
    }
    setIsTranslating(false);
    onClose();
  };

  // =========================================================================
  // MESSAGE INFO VIEW
  // =========================================================================
  const loadMessageInfo = useCallback(async () => {
    if (!message) return;
    const info = await chatService.getMessageInfo(message.id, currentUser.id);
    if (info) setMessageInfo(info);
    else {
      setMessageInfo({
        id: message.id,
        sent_at: message.created_at,
        delivered_at: message.status >= 2 ? message.created_at : undefined,
        read_at: message.status >= 3 ? message.created_at : undefined,
        encryption_hash: `sha256$${message.id.slice(0, 8)}$local`,
        delivery_state: message.status,
      });
    }
  }, [message, currentUser.id]);

  useEffect(() => {
    if (view === "info") loadMessageInfo();
  }, [view, loadMessageInfo]);

  // =========================================================================
  // PIN VIEW
  // =========================================================================
  const handleConfirmPin = () => {
    onPinned?.(pinDuration);
    flash(`Pinned for ${pinDuration}`);
    onClose();
  };

  const handleUnpin = () => {
    onUnpinned?.();
    flash("Message unpinned");
    onClose();
  };

  // =========================================================================
  // EDIT VIEW
  // =========================================================================
  const loadEditHistory = useCallback(async () => {
    if (!message) return;
    const history = await chatService.fetchEditHistory(message.id);
    setEditHistory(history);
  }, [message]);

  useEffect(() => {
    if (view === "editHistory") loadEditHistory();
  }, [view, loadEditHistory]);

  const handleSaveEdit = () => {
    if (!editText.trim()) return;
    onEditHistorySaved?.(message.text);
    onEdited?.(editText);
    flash("Message edited");
    onClose();
  };

  // =========================================================================
  // REPORT / EXPORT VIEWS
  // =========================================================================
  const handleReport = () => {
    chatService.reportMessage(message.id, currentUser.id, reportReason);
    flash(`Reported as ${reportReason}`);
    onClose();
  };

  const handleExport = () => {
    const contentMap: Record<
      ExportFormat,
      { ext: string; mime: string; body: string }
    > = {
      TXT: {
        ext: "txt",
        mime: "text/plain",
        body: `HeyLook Message Export\n========================\nFrom: ${currentUser.full_name}\nTo: ${targetUser.name}\nTime: ${new Date(message.created_at).toLocaleString()}\n\n${message.text}`,
      },
      JSON: {
        ext: "json",
        mime: "application/json",
        body: JSON.stringify(
          {
            platform: "HeyLook",
            sender: currentUser.full_name,
            receiver: targetUser.name,
            sent_at: message.created_at,
            text: message.text,
            type: message.type,
            image_url: message.image_url,
          },
          null,
          2,
        ),
      },
      PDF: {
        ext: "pdf",
        mime: "application/pdf",
        body: "",
      },
    };

    const fmt = contentMap[exportFormat];
    flash(`Exporting ${exportFormat}`);
    if (exportFormat === "PDF") {
      const html = `<html><head><title>HeyLook Export</title></head><body><h1>HeyLook Message</h1><p><b>From:</b> ${currentUser.full_name}</p><p><b>To:</b> ${targetUser.name}</p><p><b>Time:</b> ${new Date(message.created_at).toLocaleString()}</p><hr/><p>${message.text}</p></body></html>`;
      downloadFile(`message-${message.id.slice(0, 6)}.pdf`, html, "text/html");
    } else {
      downloadFile(
        `message-${message.id.slice(0, 6)}.${fmt.ext}`,
        fmt.body,
        fmt.mime,
      );
    }
    onClose();
  };

  // =========================================================================
  // RENDER: ROW COMPONENT
  // =========================================================================
  const ActionRow: React.FC<{
    icon: React.ReactNode;
    label: string;
    sub?: string;
    onClick: () => void;
    color?: string;
  }> = ({ icon, label, sub, onClick, color = "text-slate-200" }) => (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/80 transition-colors text-left cursor-pointer group"
    >
      <div className="p-2 rounded-lg bg-slate-800/80 group-hover:bg-slate-700/80 transition-colors">
        {icon}
      </div>
      <span className={`flex-1 text-sm font-medium ${color}`}>{label}</span>
      {sub && <span className="text-[10px] text-slate-500">{sub}</span>}
      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />
    </button>
  );

  // Sub-header for nested views
  const SubHeader: React.FC<{ title: string; onBack: () => void }> = ({
    title,
    onBack,
  }) => (
    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h4 className="font-bold text-sm text-slate-100">{title}</h4>
      </div>
      <button
        onClick={onClose}
        className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );

  // Toast notice
  const Notice: React.FC<{ text: string | null }> = ({ text }) =>
    text ? (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-2 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold text-center"
      >
        {text}
      </motion.div>
    ) : null;

  // De-dup target selection for forward
  const uniqueForwardTargets = Array.from(new Set(selectedForwardTargets));

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 80 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden"
          >
            {/* Drag handle */}
            <div className="pt-3 pb-1 flex justify-center sm:hidden">
              <div className="w-10 h-1 rounded-full bg-slate-700" />
            </div>

            {/* Content area with max height */}
            <div className="p-3 max-h-[80vh] overflow-y-auto space-y-2.5">
              {/* Toast Notice */}
              <Notice text={notice} />

              {/* MAIN VIEW */}
              {view === "main" && (
                <div className="space-y-1">
                  {/* Header: message preview */}
                  <div className="px-2 py-3 rounded-xl bg-slate-950/80 border border-slate-800 mb-1">
                    <p className="text-xs text-slate-400 mb-1 font-bold">
                      Message Actions
                    </p>
                    <p className="text-sm text-slate-200 line-clamp-2">
                      {message.text ||
                        (message.type === "image"
                          ? "[📷 Image attachment]"
                          : message.type === "voice"
                            ? "[🎤 Voice note]"
                            : "")}
                    </p>
                  </div>

                  <ActionRow
                    icon={<Smile className="w-4 h-4 text-amber-400" />}
                    label="React..."
                    sub="Emoji"
                    onClick={() => setView("react")}
                  />
                  <ActionRow
                    icon={<CornerDownRight className="w-4 h-4 text-cyan-400" />}
                    label="Reply"
                    onClick={() => {
                      onReply?.();
                      onClose();
                    }}
                  />
                  <ActionRow
                    icon={<CornerDownRight className="w-4 h-4 text-cyan-400" />}
                    label="Reply Privately"
                    onClick={() => setView("reply")}
                  />
                  <ActionRow
                    icon={<Forward className="w-4 h-4 text-indigo-400" />}
                    label="Forward"
                    onClick={() => setView("forward")}
                  />
                  <ActionRow
                    icon={<Star className="w-4 h-4 text-yellow-400" />}
                    label={isPinned ? "Starred / Bookmarked" : "Star/Bookmark"}
                    sub={isPinned ? "In a collection" : "Save later"}
                    onClick={() => setView("star")}
                  />
                  <ActionRow
                    icon={<Globe className="w-4 h-4 text-emerald-400" />}
                    label="Translate"
                    onClick={() => setView("translate")}
                  />
                  <ActionRow
                    icon={<Info className="w-4 h-4 text-blue-400" />}
                    label="Message Info"
                    onClick={() => setView("info")}
                  />
                  <ActionRow
                    icon={<Pin className="w-4 h-4 text-rose-400" />}
                    label={isPinned ? "Unpin Message" : "Pin Message"}
                    onClick={() => {
                      if (isPinned) onUnpinned?.();
                      else setView("pin");
                    }}
                  />
                  {isMe && (
                    <ActionRow
                      icon={<Edit3 className="w-4 h-4 text-purple-400" />}
                      label="Edit Message"
                      onClick={() => {
                        setView("edit");
                        // This will be handled by ChatView.tsx
                        // onEdited will be called from ChatView.tsx after editing is complete
                      }}
                    />
                  )}
                  {isMe && (
                    <ActionRow
                      icon={<Trash2 className="w-4 h-4 text-rose-400" />}
                      label="Delete Message"
                      onClick={() => {
                        if (message) {
                          onDeleteMessage?.(message.id);
                          onClose();
                        }
                      }}
                    />
                  )}

                  {/* Divider + More Options */}
                  <div className="pt-1 mt-1 border-t border-slate-800">
                    <ActionRow
                      icon={
                        <MoreHorizontal className="w-4 h-4 text-slate-400" />
                      }
                      label="More Options"
                      onClick={() => setView("more")}
                    />
                  </div>
                </div>
              )}

              {/* REACT VIEW */}
              {view === "react" && (
                <div className="space-y-2">
                  <SubHeader
                    title="React to Message"
                    onBack={() => setView("main")}
                  />
                  <p className="text-xs text-slate-400 px-1">
                    Reacted to:{" "}
                    <span className="text-slate-200 line-clamp-1">
                      {message.text || "attachment"}
                    </span>
                  </p>

                  {/* Category Selector */}
                  <div className="flex items-center gap-1.5 py-1.5">
                    {REACTION_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setReactionCategory(cat)}
                        className={`flex-1 px-2 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                          reactionCategory === cat
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            : "text-slate-400 hover:bg-slate-800"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Emoji Grid */}
                  <div className="grid grid-cols-4 gap-2 p-2 rounded-2xl bg-slate-950/60 border border-slate-800">
                    {REACTION_SETS[reactionCategory].map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleReact(emoji, reactionCategory)}
                        className="aspect-square flex items-center justify-center text-3xl rounded-xl hover:bg-slate-800 hover:scale-110 transition-all cursor-pointer"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* REPLY PRIVATELY VIEW */}
              {view === "reply" && (
                <div className="space-y-2">
                  <SubHeader
                    title="Reply Privately"
                    onBack={() => setView("main")}
                  />
                  <p className="text-xs text-slate-400 px-1">
                    Start a 1-on-1 with quote context for:{" "}
                    <span className="text-slate-200 line-clamp-1">
                      {message.text}
                    </span>
                  </p>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      value={replySearch}
                      onChange={(e) => setReplySearch(e.target.value)}
                      placeholder="Search contacts..."
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:outline-none text-sm text-slate-100 placeholder:text-slate-500"
                      autoFocus
                    />
                  </div>

                  <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
                    {filteredContacts.length === 0 ? (
                      <p className="text-center text-xs text-slate-500 py-6">
                        No contacts available.
                      </p>
                    ) : (
                      filteredContacts.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => {
                            onReplyPrivately?.(c);
                            onClose();
                          }}
                          className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer text-left"
                        >
                          <img
                            src={c.avatar_url}
                            alt={c.full_name}
                            className="w-9 h-9 rounded-full object-cover border border-slate-700"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-200 truncate">
                              {c.full_name}
                            </p>
                            <p className="text-[10px] text-slate-500 truncate">
                              @{c.username}
                            </p>
                          </div>
                          <CornerDownRight className="w-4 h-4 text-cyan-400 ml-auto shrink-0" />
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* FORWARD VIEW */}
              {view === "forward" && (
                <div className="space-y-2">
                  <SubHeader title="Forward" onBack={() => setView("main")} />
                  <p className="text-xs text-slate-400 px-1">
                    Select chats to forward this message to:
                  </p>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      value={forwardSearch}
                      onChange={(e) => setForwardSearch(e.target.value)}
                      placeholder="Search conversations..."
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-sm text-slate-100 placeholder:text-slate-500"
                    />
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                    {filteredDrafts.length === 0 ? (
                      <p className="text-center text-xs text-slate-500 py-6">
                        No conversations available.
                      </p>
                    ) : (
                      filteredDrafts.map((c) => {
                        const selected = uniqueForwardTargets.includes(
                          c.user.id,
                        );
                        return (
                          <button
                            key={c.id}
                            onClick={() => toggleForwardTarget(c.user.id)}
                            className={`w-full flex items-center gap-3 p-2 rounded-xl transition-colors cursor-pointer text-left border ${
                              selected
                                ? "bg-indigo-500/15 border-indigo-500/50"
                                : "hover:bg-slate-800 border-transparent"
                            }`}
                          >
                            <img
                              src={c.user.avatar}
                              alt={c.user.name}
                              className="w-9 h-9 rounded-full object-cover border border-slate-700"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-slate-200 truncate">
                                {c.user.name}
                              </p>
                              <p className="text-[10px] text-slate-500 truncate">
                                {c.lastMessage}
                              </p>
                            </div>
                            <span
                              className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                                selected
                                  ? "bg-indigo-500 border-indigo-500 text-white"
                                  : "border-slate-600"
                              }`}
                            >
                              {selected && <Check className="w-3 h-3" />}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>

                  <button
                    onClick={handleSendForward}
                    disabled={selectedForwardTargets.length === 0}
                    className="w-full py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-400 transition-colors cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    Forward ({selectedForwardTargets.length})
                  </button>
                </div>
              )}

              {/* STAR / BOOKMARK VIEW */}
              {view === "star" && (
                <div className="space-y-2">
                  <SubHeader
                    title="Star / Bookmark"
                    onBack={() => setView("main")}
                  />
                  <p className="text-xs text-slate-400 px-1">
                    Save to a collection:
                  </p>
                  <div className="space-y-1.5">
                    {STAR_COLLECTIONS.map((col) => (
                      <button
                        key={col}
                        onClick={() => setStarCollection(col)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors cursor-pointer text-left ${
                          starCollection === col
                            ? "bg-yellow-500/15 border-yellow-500/50"
                            : "hover:bg-slate-800 border-slate-800"
                        }`}
                      >
                        <Bookmark
                          className={`w-4 h-4 ${
                            starCollection === col
                              ? "text-yellow-400"
                              : "text-slate-500"
                          }`}
                        />
                        <span className="text-sm text-slate-200">{col}</span>
                        {starCollection === col && (
                          <Check className="w-4 h-4 text-yellow-400 ml-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleConfirmStar}
                    className="w-full py-2.5 rounded-xl bg-yellow-500 text-slate-950 text-sm font-bold hover:bg-yellow-400 transition-colors cursor-pointer"
                  >
                    Save to {starCollection}
                  </button>
                  {isPinned && (
                    <button
                      onClick={handleRemoveStar}
                      className="w-full py-2 rounded-xl bg-slate-800 text-rose-300 text-xs font-semibold hover:bg-rose-500/20 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 inline mr-1" />
                      Remove Bookmark
                    </button>
                  )}
                </div>
              )}

              {/* TRANSLATE VIEW */}
              {view === "translate" && (
                <div className="space-y-2">
                  <SubHeader title="Translate" onBack={() => setView("main")} />
                  <p className="text-xs text-slate-400 px-1">
                    Translate this message to:
                  </p>
                  <div className="space-y-1.5">
                    {TRANSLATE_LANGUAGES.map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setTranslateLang(lang)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors cursor-pointer text-left ${
                          translateLang === lang
                            ? "bg-emerald-500/15 border-emerald-500/50"
                            : "hover:bg-slate-800 border-slate-800"
                        }`}
                      >
                        <Globe
                          className={`w-4 h-4 ${
                            translateLang === lang
                              ? "text-emerald-400"
                              : "text-slate-500"
                          }`}
                        />
                        <span className="text-sm text-slate-200">{lang}</span>
                        {translateLang === lang && (
                          <Check className="w-4 h-4 text-emerald-400 ml-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleTranslate}
                    disabled={isTranslating}
                    className="w-full py-2.5 rounded-xl bg-emerald-500 text-slate-950 text-sm font-bold hover:bg-emerald-400 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isTranslating
                      ? "Translating..."
                      : `Translate to ${translateLang}`}
                  </button>
                </div>
              )}

              {/* MESSAGE INFO VIEW */}
              {view === "info" && (
                <div className="space-y-2">
                  <SubHeader
                    title="Message Info"
                    onBack={() => setView("main")}
                  />
                  <div className="space-y-2 p-2 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs">
                    <InfoRow
                      icon={<Anchor className="w-3.5 h-3.5 text-cyan-400" />}
                      label="Sent"
                      value={
                        messageInfo?.sent_at
                          ? new Date(messageInfo.sent_at).toLocaleString()
                          : new Date(message.created_at).toLocaleString()
                      }
                    />
                    <InfoRow
                      icon={<Ship className="w-3.5 h-3.5 text-emerald-400" />}
                      label="Delivered"
                      value={
                        messageInfo?.delivered_at
                          ? new Date(messageInfo.delivered_at).toLocaleString()
                          : message.status >= 2
                            ? new Date(message.created_at).toLocaleString()
                            : "N/A"
                      }
                    />
                    <InfoRow
                      icon={<Eye className="w-3.5 h-3.5 text-indigo-400" />}
                      label="Read"
                      value={
                        messageInfo?.read_at
                          ? new Date(messageInfo.read_at).toLocaleString()
                          : message.status >= 3
                            ? new Date(message.created_at).toLocaleString()
                            : "N/A"
                      }
                    />
                    <div className="flex items-start gap-3 pt-2 border-t border-slate-800">
                      <Shield className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-slate-400 font-bold mb-0.5">
                          Encryption Hash
                        </p>
                        <p className="font-mono text-[10px] text-cyan-300 break-all">
                          {messageInfo?.encryption_hash ||
                            `sha256$${message.id.slice(0, 8)}$local`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 pt-2 border-t border-slate-800">
                      <Clock className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-slate-400 font-bold mb-0.5">
                          Delivery State
                        </p>
                        <p className="text-slate-200">
                          {messageInfo?.delivery_state === 3
                            ? "Submerged (Read)"
                            : messageInfo?.delivery_state === 2
                              ? "Docked (Delivered)"
                              : "Launched (Sent)"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PIN VIEW */}
              {view === "pin" && (
                <div className="space-y-2">
                  <SubHeader
                    title="Pin Message"
                    onBack={() => setView("main")}
                  />
                  <p className="text-xs text-slate-400 px-1">
                    Pin this message to the conversation for:
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {PIN_DURATIONS.map((dur) => (
                      <button
                        key={dur}
                        onClick={() => setPinDuration(dur)}
                        className={`p-2.5 rounded-xl border text-center transition-colors cursor-pointer ${
                          pinDuration === dur
                            ? "bg-rose-500/15 border-rose-500/50"
                            : "hover:bg-slate-800 border-slate-800"
                        }`}
                      >
                        <Pin
                          className={`w-4 h-4 mx-auto mb-1 ${
                            pinDuration === dur
                              ? "text-rose-400"
                              : "text-slate-500"
                          }`}
                        />
                        <span className="text-[10px] text-slate-200">
                          {dur}
                        </span>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleConfirmPin}
                    className="w-full py-2.5 rounded-xl bg-rose-500 text-white text-sm font-bold hover:bg-rose-400 transition-colors cursor-pointer"
                  >
                    Pin for {pinDuration}
                  </button>
                </div>
              )}

              {/* EDIT VIEW */}
              {view === "edit" && (
                <div className="space-y-2">
                  <SubHeader
                    title="Edit Message"
                    onBack={() => setView("main")}
                  />
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-purple-500/40 focus:border-purple-400 focus:outline-none text-sm text-slate-100 min-h-20"
                    rows={3}
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveEdit}
                      disabled={!editText.trim()}
                      className="flex-1 py-2.5 rounded-xl bg-purple-500 text-white text-sm font-bold hover:bg-purple-400 transition-colors disabled:opacity-40 cursor-pointer"
                    >
                      Save Edit
                    </button>
                    <button
                      onClick={() => setView("editHistory")}
                      className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-sm font-semibold hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      <Clock className="w-3.5 h-3.5 inline mr-1" />
                      Revision History
                    </button>
                  </div>
                </div>
              )}

              {/* EDIT HISTORY VIEW */}
              {view === "editHistory" && (
                <div className="space-y-2">
                  <SubHeader
                    title="Revision History"
                    onBack={() => setView("edit")}
                  />
                  {editHistory.length === 0 ? (
                    <p className="text-center text-xs text-slate-500 py-6">
                      No prior edits found.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {editHistory.map((h) => (
                        <div
                          key={h.id}
                          className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs"
                        >
                          <p className="text-[10px] text-slate-500 font-mono mb-1">
                            {new Date(h.edited_at).toLocaleString()}
                          </p>
                          <p className="text-slate-300 whitespace-pre-wrap">
                            {h.previous_text}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* MORE OPTIONS VIEW */}
              {view === "more" && (
                <div className="space-y-1">
                  <SubHeader
                    title="More Options"
                    onBack={() => setView("main")}
                  />
                  <ActionRow
                    icon={<Flag className="w-4 h-4 text-rose-400" />}
                    label="Report Message"
                    onClick={() => setView("report")}
                  />
                  <ActionRow
                    icon={<Download className="w-4 h-4 text-emerald-400" />}
                    label="Export Message"
                    onClick={() => setView("export")}
                  />
                </div>
              )}

              {/* REPORT VIEW */}
              {view === "report" && (
                <div className="space-y-2">
                  <SubHeader
                    title="Report Message"
                    onBack={() => setView("more")}
                  />
                  <p className="text-xs text-slate-400 px-1">
                    Select a reason for reporting this message:
                  </p>
                  <div className="space-y-1.5">
                    {REPORT_REASONS.map((reason) => (
                      <button
                        key={reason}
                        onClick={() => setReportReason(reason)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors cursor-pointer text-left ${
                          reportReason === reason
                            ? "bg-rose-500/15 border-rose-500/50"
                            : "hover:bg-slate-800 border-slate-800"
                        }`}
                      >
                        <Flag
                          className={`w-4 h-4 ${
                            reportReason === reason
                              ? "text-rose-400"
                              : "text-slate-500"
                          }`}
                        />
                        <span className="text-sm text-slate-200">{reason}</span>
                        {reportReason === reason && (
                          <Check className="w-4 h-4 text-rose-400 ml-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleReport}
                    className="w-full py-2.5 rounded-xl bg-rose-500 text-white text-sm font-bold hover:bg-rose-400 transition-colors cursor-pointer"
                  >
                    Report as {reportReason}
                  </button>
                </div>
              )}

              {/* EXPORT VIEW */}
              {view === "export" && (
                <div className="space-y-2">
                  <SubHeader
                    title="Export Message"
                    onBack={() => setView("more")}
                  />
                  <p className="text-xs text-slate-400 px-1">
                    Choose a format for export:
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {EXPORT_FORMATS.map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => setExportFormat(fmt)}
                        className={`p-3 rounded-xl border text-center transition-colors cursor-pointer ${
                          exportFormat === fmt
                            ? "bg-emerald-500/15 border-emerald-500/50"
                            : "hover:bg-slate-800 border-slate-800"
                        }`}
                      >
                        <Download
                          className={`w-4 h-4 mx-auto mb-1 ${
                            exportFormat === fmt
                              ? "text-emerald-400"
                              : "text-slate-500"
                          }`}
                        />
                        <span className="text-xs font-bold text-slate-200">
                          .{fmt}
                        </span>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleExport}
                    className="w-full py-2.5 rounded-xl bg-emerald-500 text-slate-950 text-sm font-bold hover:bg-emerald-400 transition-colors cursor-pointer"
                  >
                    Export as .{exportFormat}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// Small helper row for the Message Info view
const InfoRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
}> = ({ icon, label, value }) => (
  <div className="flex items-center gap-3">
    {icon}
    <div className="min-w-0">
      <p className="text-slate-400 font-bold">{label}</p>
      <p className="text-slate-200 truncate">{value}</p>
    </div>
  </div>
);
