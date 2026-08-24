import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChatInputBar } from "./chat/ChatInputBar";
import {
  Send,
  Image as ImageIcon,
  Phone,
  Video,
  ArrowLeft,
  X,
  Lock,
  Flame,
  CornerDownRight,
  Wifi,
  PhoneMissed,
  PhoneCall,
  Search,
  Plus,
  MoreVertical,
  Briefcase,
  Film,
  MapPin,
  Handshake,
  Trash2,
  Download,
  Bell,
  BellOff,
  CheckCircle,
  Edit3,
  RotateCcw,
  Sparkles,
  Globe,
  Pin,
  Shield,
  Eye,
  EyeOff,
  User,
  Award,
  ExternalLink,
  Users,
  Star,
  FileText,
  Check,
  ShieldAlert,
  Calendar,
  Vote,
  FileCode,
  ShieldCheck,
  Zap,
  CheckSquare,
  Share2,
  Bookmark,
  Copy,
  Link as LinkIcon,
  Clock,
  Tag,
  BarChart2,
  MessageSquare,
  AlertTriangle,
  FolderPlus,
  Archive,
  Cpu,
  Type,
  Palette,
  Bot,
  Mic,
  Activity,
  Fingerprint,
  UserX,
  HelpCircle,
  RefreshCw,
  QrCode,
  FileCheck,
  Paperclip,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Sliders,
  Table,
  Upload,
  ChevronDown,
  Radio,
} from "lucide-react";

import {
  Conversation,
  ChatMessage,
  Profile,
  MessageDeliveryStatus,
  Beacon,
  BeaconComment,
  ConversationPreferences,
} from "../types";
import { BeaconModal } from "./BeaconModal";
import { BeaconViewer } from "./BeaconViewer";
import { MessageStatus } from "./MessageStatus";
import { usePresence } from "../hooks/usePresence";
import { chatService, filterVanishingMessages } from "../services/chatService";
import { placeRealPhoneCall } from "../services/phoneCallService";
import { supabase } from "../lib/supabase";
import { ollamaService } from "../services/ollamaService";
import { hymliAiService } from "../services/hymliAiService";
import {
  AVAILABLE_MODELS,
  checkModelAccess,
  ModelOption,
} from "../services/aiRouterService";
import { UpgradeModal } from "./UpgradeModal";
import { InteractiveCanvas } from "./canvas/InteractiveCanvas";
import { useSubscription } from "../hooks/useSubscription";
import { parseDocumentContent } from "../lib/plugins/documentDeepDive";
import {
  getMessageDateLabel,
  renderMessageTextWithCodeBlocks,
} from "./chat/MessageContentRenderer";

import { getLivePresenceLabel } from "../hooks/usePresence";
import { useTypingIndicator } from "../hooks/useTypingIndicator";
import { useVoiceRecorder, formatClock } from "../hooks/useVoiceRecorder";
import { WaveformPlayer } from "./chat/WaveformPlayer";
import { AttachmentModals } from "./chat/AttachmentModals";
import { RoomModals } from "./chat/RoomModals";
import { ProfileCardModal } from "./chat/ProfileCardModal";
import {
  RoomSettingsSidebar,
  RoomSettingsTab,
  RoomModalType,
  WallpaperTheme,
} from "./chat/RoomSettingsSidebar";
import { GroupManagementModal } from "./chat/GroupManagementModal";
import { HymliToolsModal } from "./ai/HymliToolsModal";
import { ChatHeader } from "./chat/ChatHeader";
import {
  CommandPalette,
  BotCommand,
  BOT_COMMANDS,
} from "./chat/CommandPalette";
import { MessageActionSheet } from "./chat/MessageActionSheet";
import { ChatInfoDrawer } from "./chat/ChatInfoDrawer";
import { AttachmentHub, AttachmentHubResult } from "./chat/AttachmentHub";
// WebRTC call state is owned by the single global CallProvider (mounted at the
// app root in App.tsx) and shared via useCall(). ChatView consumes the same
// shared handler so incoming-call signaling remains active across all tabs and
// there is never a second, independent WebRTC instance.
import { WebRTCState } from "../hooks/useWebRTCCall";
import { useCall } from "../context/CallContext";

interface ChatViewProps {
  activeConv: Conversation;
  currentUser: Profile;
  isDark: boolean;
  onBack?: () => void;
  onUpdateConversation?: (
    convId: string,
    lastMsg: string,
    newMsg?: ChatMessage,
    cleared?: boolean,
  ) => void;
  // Called when the user sends a reply in this chat so the parent (ChatsTab)
  // can zero the unread badge + remove the unread highlight immediately.
  onClearUnread?: (convId: string) => void;
  webrtc?: WebRTCState;
}

export const ChatView: React.FC<ChatViewProps> = ({
  activeConv,
  currentUser,
  isDark,
  onBack,
  onUpdateConversation,
  onClearUnread,
  webrtc: propWebRTC,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(
    activeConv.messages || [],
  );
  const [vanishSeconds, setVanishSeconds] = useState<number | null>(null);

  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(
    null,
  );

  const [isVoiceRecorderOpen, setIsVoiceRecorderOpen] =
    useState<boolean>(false);
  const [isSendingVoice, setIsSendingVoice] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>("");
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);

  // MENU 1: Attachment Drawer State
  const [isAttachmentOpen, setIsAttachmentOpen] = useState(false);
  const [attachmentCategory, setAttachmentCategory] = useState<
    "docs" | "media" | "legal" | "tools"
  >("docs");
  const [activeAttachmentModal, setActiveAttachmentModal] = useState<
    string | null
  >(null);

  // ATTACHMENT & MEDIA PICKER HUB (10 rich features)
  const [isAttachmentHubOpen, setIsAttachmentHubOpen] = useState(false);

  // MENU 2: Message Contextual Actions Popover State
  const [activeMsgMenuId, setActiveMsgMenuId] = useState<string | null>(null);
  const [activeMsgMenuTab, setActiveMsgMenuTab] = useState<
    "refine" | "organize" | "insights" | "privacy"
  >("refine");
  // NEW Advanced Message Action Sheet: message it acts on (null = closed)
  const [actionSheetMessage, setActionSheetMessage] =
    useState<ChatMessage | null>(null);
  const [actionSheetPinned, setActionSheetPinned] = useState(false);

  const openMessageActionSheet = (msg: ChatMessage) => {
    setActionSheetMessage(msg);
    setActionSheetPinned(pinnedMessage?.id === msg.id);
  };

  const handleReply = (msgToReply: ChatMessage) => {
    setReplyingTo(msgToReply);
    setActiveMsgMenuId(null); // Close action sheet
  };

  const handleEditMessage = (msgToEdit: ChatMessage) => {
    setEditingMessage(msgToEdit);
    setActiveMsgMenuId(null); // Close action sheet
  };

  const handleDeleteMessage = async (messageId: string) => {
    const success = await chatService.deleteMessage(messageId);
    if (success) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, is_deleted: true, text: "" } : msg,
        ),
      );
      showNotice("Message deleted.");
    } else {
      showNotice("Failed to delete message.");
    }
    setActiveMsgMenuId(null);
  };

  const closeMessageActionSheet = () => {
    setActionSheetMessage(null);
  };
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editingMsgText, setEditingMsgText] = useState<string>("");
  const [pinnedMessage, setPinnedMessage] = useState<ChatMessage | null>(null);

  // BEACON (Instagram-style story ring) state
  const [beacons, setBeacons] = useState<Beacon[]>([]);
  const [isBeaconModalOpen, setIsBeaconModalOpen] = useState(false);
  const [isBeaconViewerOpen, setIsBeaconViewerOpen] = useState(false);
  const [activeBeaconIndex, setActiveBeaconIndex] = useState(0);
  const [anchoredBeaconId, setAnchoredBeaconId] = useState<string | null>(null);

  // FULL-BLEED IMAGE LIGHTBOX STATE
  const [lightboxImage, setLightboxImage] = useState<{
    src: string;
    caption: string;
  } | null>(null);

  const [lockedMsgIds, setLockedMsgIds] = useState<string[]>([]);
  const [unlockedMsgIds, setUnlockedMsgIds] = useState<string[]>([]);
  const [passcodeModalMsgId, setPasscodeModalMsgId] = useState<string | null>(
    null,
  );
  const [passcodeInput, setPasscodeInput] = useState<string>("");
  const [blurredMsgIds, setBlurredMsgIds] = useState<string[]>([]);

  // GROUP MANAGEMENT MATRIX MODAL STATE
  const [isGroupMgmtOpen, setIsGroupMgmtOpen] = useState(false);

  // CHAT INFO DRAWER (WhatsApp-style) OPEN STATE + PER-CONVERSATION PREFS
  const [isChatInfoOpen, setIsChatInfoOpen] = useState(false);
  const [chatPrefs, setChatPrefs] = useState<ConversationPreferences>({
    conversationId: activeConv.id,
    mutedUntil: null,
    disappearingTimer: "Off",
    wallpaper: null,
    isLocked: false,
    lockConfig: null,
    isBlocked: false,
    blockReason: undefined,
  });
  const [isUserBlocked, setIsUserBlocked] = useState(false);

  useEffect(() => {
    void supabase.from("user_blocks").select("blocked_id").eq("blocker_id", currentUser.id).eq("blocked_id", activeConv.user.id).maybeSingle().then(({ data }) => setIsUserBlocked(Boolean(data)));
  }, [currentUser.id, activeConv.user.id]);

  // Persist Chat Info preference changes locally (and to Supabase when table exists)
  const handleChatPrefsChange = (patch: Partial<ConversationPreferences>) => {
    setChatPrefs((prev) => ({ ...prev, ...patch }));
    try {
      const key = `heylook_prefs_${activeConv.id}`;
      localStorage.setItem(key, JSON.stringify({ ...chatPrefs, ...patch }));
    } catch (e) {
      console.warn("[ChatInfoDrawer] Failed to persist prefs locally:", e);
    }
  };

  // Restore persisted Chat Info prefs on mount / conversation change
  useEffect(() => {
    try {
      const key = `heylook_prefs_${activeConv.id}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored) as ConversationPreferences;
        setChatPrefs((prev) => ({ ...prev, ...parsed }));
      }
    } catch (e) {
      console.warn("[ChatInfoDrawer] Failed to restore prefs:", e);
    }
  }, [activeConv.id]);

  // MENU 3: Room Settings Slide-Out Sidebar State
  const [isRoomMenuOpen, setIsRoomMenuOpen] = useState(false);
  const [activeRoomMenuTab, setActiveRoomMenuTab] = useState<
    "security" | "efficiency" | "visual" | "automations"
  >("security");
  const [activeRoomModal, setActiveRoomModal] = useState<
    "barcode" | "assets" | "transcript" | "crm" | "devices" | null
  >(null);
  const [isRoomLocked, setIsRoomLocked] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isWatermarkActive, setIsWatermarkActive] = useState(false);
  const [isSummarizerOpen, setIsSummarizerOpen] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [roomNotification, setRoomNotification] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [presentationFont, setPresentationFont] = useState(false);
  const [compactRows, setCompactRows] = useState(false);
  const [moodWallpaper, setMoodWallpaper] = useState<
    "default" | "nautical" | "midnight" | "cyberpunk"
  >("default");
  const [autoReplyBot, setAutoReplyBot] = useState(false);
  const [voiceAutoTranscribe, setVoiceAutoTranscribe] = useState(true);
  const [lowDataMode, setLowDataMode] = useState(false);

  // MENU 4: Header User Profile Card Modal State
  const [isUserProfileModalOpen, setIsUserProfileModalOpen] = useState(false);
  const [isVipPriority, setIsVipPriority] = useState(false);
  const [languageOverride, setLanguageOverride] = useState("English (US)");

  // Model Selector & Subscription Upgrade Modal States
  const [selectedModelId, setSelectedModelId] =
    useState<string>("gemini-2.5-flash");
  const [isModelDropdownOpen, setIsModelDropdownOpen] =
    useState<boolean>(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState<boolean>(false);
  const [upgradeTargetModelId, setUpgradeTargetModelId] =
    useState<string>("claude-3-5-sonnet");
  const [isCanvasOpen, setIsCanvasOpen] = useState<boolean>(false);
  const [isHymliToolsOpen, setIsHymliToolsOpen] = useState<boolean>(false);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);

  const handlePdfFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      showNotice(`Analyzing ${file.name} (Parsing PDF text)...`);
      const extractedText = await parseDocumentContent(file);
      const pageMatches = extractedText.match(/--- Page \d+ ---/g);
      const pages = pageMatches ? pageMatches.length : 1;

      showNotice(
        `Successfully parsed ${file.name} (${pages} pages). Transmitting to AI...`,
      );

      // Format document prompt for Hymli AI
      const docPrompt = `[Document Deep-Dive: ${file.name} - ${pages} Pages]\n${extractedText.slice(0, 15000)}\n\nPlease analyze this document and summarize key insights.`;

      hymliAiService.askHymli(docPrompt, currentUser.id, activeConv.id);
    } catch (err: any) {
      showNotice(`PDF Error: ${err?.message || "Failed to parse document"}`);
    } finally {
      if (e.target) e.target.value = "";
    }
  };

  const { isSubscribed } = useSubscription();

  useEffect(() => {
    if (isSubscribed && upgradeTargetModelId) {
      setSelectedModelId(upgradeTargetModelId);
      hymliAiService.setModel(upgradeTargetModelId);
      showNotice(
        `Payment confirmed! Active AI Model switched to ${upgradeTargetModelId}`,
      );
    }
  }, [isSubscribed]);

  const handleSelectModel = async (model: ModelOption) => {
    setIsModelDropdownOpen(false);
    if (model.id === selectedModelId) return;

    // Call Supabase RPC check_model_access(user_id, model_id)
    const hasAccess = await checkModelAccess(currentUser.id, model.id);
    if (hasAccess) {
      setSelectedModelId(model.id);
      hymliAiService.setModel(model.id);
      showNotice(`Active AI Model switched to ${model.name}`);
    } else {
      // Prevent model switch and open UpgradeModal
      setUpgradeTargetModelId(model.id);
      setIsUpgradeModalOpen(true);
    }
  };

  // INLINE CANVAS GESTURES & AI
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedMsgIds, setSelectedMsgIds] = useState<string[]>([]);
  const [showAiPromptToolbar, setShowAiPromptToolbar] = useState(false);
  const [aiPromptInput, setAiPromptInput] = useState("");
  const [activeCommandIndex, setActiveCommandIndex] = useState(0);
  const [msgReactions, setMsgReactions] = useState<Record<string, string[]>>(
    {},
  );
  const [reactionPickerMsgId, setReactionPickerMsgId] = useState<string | null>(
    null,
  );

  // Search & Jump to Message States
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);

  // Floating Sticky Scroll Date State
  const [floatingDate, setFloatingDate] = useState<string>("Today");
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Network & WebRTC Hook
  const [pingMs, setPingMs] = useState<number>(42);
  // Use the single globally-managed WebRTC instance from the CallProvider
  // (mounted at the app root) so incoming-call signaling stays active across
  // all tabs and no second independent RTC instance is ever created here.
  const contextCall = useCall();
  const webrtc = propWebRTC || contextCall;
  const { isUserOnline, onlinePresences } = usePresence(currentUser.id);
  const { isUserTyping, sendTyping } = useTypingIndicator();

  const targetUserOnline = isUserOnline(activeConv.user.id);
  const targetLastSeen =
    activeConv.user.last_seen || activeConv.user.last_anchored;

  // Map the active conversation's user (Conversation.user shape) into a full
  // Profile so WebRTC startCall / calls receive the required fields.
  const targetProfile: Profile = {
    id: activeConv.user.id,
    username: activeConv.user.name,
    full_name: activeConv.user.name,
    avatar_url: activeConv.user.avatar,
    is_online: activeConv.user.is_online,
    last_seen: activeConv.user.last_seen,
    nautical_presence: activeConv.user.nautical_presence,
    custom_status: activeConv.user.custom_status,
    last_anchored: activeConv.user.last_anchored,
  };

  // Live presence broadcast state for the active contact (if any)
  const livePresence = onlinePresences[activeConv.user.id];

  // Real-time typing indicator state for the remote user in this room.
  const remoteUserTyping = isUserTyping(activeConv.user.id, activeConv.id);
  // "Nevermind" message shown for 3s after the remote user clears their box.
  const [showNevermind, setShowNevermind] = useState(false);
  const nevermindTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevRemoteTyping = useRef<boolean>(false);

  useEffect(() => {
    if (remoteUserTyping) {
      // Remote is typing — make sure "Nevermind" is hidden.
      setShowNevermind(false);
    } else if (prevRemoteTyping.current) {
      // Remote just cleared their box — show "Nevermind" for 3s then fade out.
      setShowNevermind(true);
      if (nevermindTimer.current) clearTimeout(nevermindTimer.current);
      nevermindTimer.current = setTimeout(() => {
        setShowNevermind(false);
      }, 3000);
    }
    prevRemoteTyping.current = remoteUserTyping;
  }, [remoteUserTyping]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const showNotice = (msg: string) => {
    setRoomNotification(msg);
    setTimeout(() => {
      setRoomNotification(null);
    }, 3800);
  };

  // ---- FILTER VISIBLE MESSAGES BY ACTIVE CHAT ----
  // Strictly derive the list shown in the timeline from the active conversation
  // so stale messages from a previously-open chat can never appear. A message
  // is visible only when it is between the current user and the active contact
  // (either direction), or carries the active conversation id.
  const activeMessages = messages.filter(
    (m) =>
      (m.sender_id === currentUser.id &&
        m.receiver_id === activeConv.user.id) ||
      (m.sender_id === activeConv.user.id &&
        m.receiver_id === currentUser.id) ||
      m.room_id === activeConv.id ||
      (m as any).conversation_id === activeConv.id,
  );

  // Subscribe to Supabase Messages
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let isActiveConversation = true;

    // ---- RESET MESSAGES ON CONTACT SWITCH ----
    // Whenever the active conversation changes, immediately clear the message
    // list so stale messages from the previous chat never leak into the new
    // one, then fetch the messages for the now-active conversation.
    setMessages([]);

    const loadMessages = async () => {
      const fetched = await chatService.fetchMessages(
        currentUser.id,
        activeConv.user.id,
      );
      if (!isActiveConversation) return;
      if (fetched && fetched.length > 0) {
        // Only keep messages that actually belong to the active conversation.
        const scoped = fetched.filter(
          (m) =>
            (m.sender_id === currentUser.id &&
              m.receiver_id === activeConv.user.id) ||
            (m.sender_id === activeConv.user.id &&
              m.receiver_id === currentUser.id),
        );
        setMessages((prev) => {
          const merged = new Map(prev.map((message) => [message.id, message]));
          scoped.forEach((message) => merged.set(message.id, message));
          return Array.from(merged.values()).sort(
            (a, b) =>
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
          );
        });
      } else if (activeConv.messages && activeConv.messages.length > 0) {
        const formatted = activeConv.messages.map((m) => ({
          ...m,
          status: (typeof m.status === "number"
            ? m.status
            : m.is_me
              ? 1
              : 3) as MessageDeliveryStatus,
        }));
        setMessages((prev) => {
          const merged = new Map(prev.map((message) => [message.id, message]));
          filterVanishingMessages(formatted).forEach((message) =>
            merged.set(message.id, message),
          );
          return Array.from(merged.values()).sort(
            (a, b) =>
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
          );
        });
      }
    };

    loadMessages();

    unsubscribe = chatService.subscribeToMessages(
      currentUser.id,
      activeConv.user.id,
      (newMsg) => {
        // ---- FILTER REALTIME STREAM ----
        // Only push a realtime INSERT into the visible list if it actually
        // belongs to the currently active conversation/user pair.
        const belongsToActiveChat =
          (newMsg.sender_id === currentUser.id &&
            newMsg.receiver_id === activeConv.user.id) ||
          (newMsg.sender_id === activeConv.user.id &&
            newMsg.receiver_id === currentUser.id);
        if (!belongsToActiveChat) return;

        setMessages((prev) => {
          // Dedup by canonical id. Also ignore our own sent messages that we
          // already placed optimistically (pre-generated UUID) — the realtime
          // echo of our own insert must not append a second copy.
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          if (
            newMsg.sender_id === currentUser.id &&
            prev.some(
              (m) =>
                m.sender_id === newMsg.sender_id &&
                m.created_at === newMsg.created_at,
            )
          ) {
            return prev;
          }
          const updated = [...prev, newMsg];
          return filterVanishingMessages(updated);
        });
        if (onUpdateConversation) {
          onUpdateConversation(activeConv.id, newMsg.text, newMsg);
        }
      },
      (updatedMsg) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === updatedMsg.id
              ? {
                  ...m,
                  status: (updatedMsg.status ?? 3) as MessageDeliveryStatus,
                }
              : m,
          ),
        );
      },
    );

    return () => {
      isActiveConversation = false;
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser.id, activeConv.user.id, activeConv.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  // Scroll Observer for Floating Date Badge
  const handleScroll = () => {
    if (!chatScrollRef.current) return;
    const dateElements =
      chatScrollRef.current.querySelectorAll("[data-date-label]");
    let currentVisibleLabel = "";

    for (const el of Array.from(dateElements)) {
      const htmlEl = el as HTMLElement;
      const rect = htmlEl.getBoundingClientRect();
      if (rect.top <= 180) {
        currentVisibleLabel = htmlEl.getAttribute("data-date-label") || "";
      }
    }

    if (currentVisibleLabel) {
      setFloatingDate(currentVisibleLabel);
    }
  };

  // Observer for read receipts
  const observerMap = useRef<Map<string, IntersectionObserver>>(new Map());

  const observeMessageRef = useCallback(
    (node: HTMLDivElement | null, msg: ChatMessage) => {
      if (!node || msg.is_me || msg.status === 3) return;

      if (observerMap.current.has(msg.id)) {
        observerMap.current.get(msg.id)?.disconnect();
      }

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              chatService.markSubmerged(msg.id, currentUser.id);
              setMessages((prev) =>
                prev.map((m) => (m.id === msg.id ? { ...m, status: 3 } : m)),
              );
              observer.disconnect();
              observerMap.current.delete(msg.id);
            }
          });
        },
        { threshold: 0.5 },
      );

      observer.observe(node);
      observerMap.current.set(msg.id, observer);
    },
    [currentUser.id],
  );

  useEffect(() => {
    const pingInterval = setInterval(() => {
      setPingMs(Math.floor(25 + Math.random() * 45));
    }, 4000);
    return () => clearInterval(pingInterval);
  }, []);

  // Inline list of commands used for the /help notice (kept in sync with the
  // CommandPalette registry).
  const BOT_COMMANDS_INLINE: { command: string }[] = [
    { command: "/summarize" },
    { command: "/generate-image" },
    { command: "/rephrase" },
    { command: "/polish" },
    { command: "/translate" },
    { command: "/tone" },
    { command: "/action-items" },
    { command: "/clear" },
    { command: "/help" },
  ];

  // The text after "/" used to filter the command palette.
  const commandQuery = inputText.startsWith("/") ? inputText.slice(1) : "";

  // Commands matching the current query, used for the palette + keyboard nav.
  const filteredCommands = BOT_COMMANDS.filter((c) =>
    c.command.toLowerCase().includes(commandQuery.toLowerCase()),
  );

  // Resolve a Telegram-style bot command (and its argument) into an enriched
  // Hymli AI prompt before the message is sent to the copilot thread.
  const resolveCommandText = (raw: string): string => {
    const trimmed = raw.trim();
    const [head, ...rest] = trimmed.split(" ");
    const arg = rest.join(" ").trim();
    const lower = head.toLowerCase();

    switch (lower) {
      case "/summarize":
        return "📋 [Hymli Copilot · Summarize]\nPlease provide an executive summary of our recent conversation, highlighting key decisions, action items, and open questions.";
      case "/generate-image":
        return `🎨 [Hymli Copilot · Generate Image]\nPlease describe a detailed image concept${arg ? ` for: ${arg}` : " based on our conversation"} — output a vivid visual description a designer could render.`;
      case "/rephrase":
        return `✍️ [Hymli Copilot · Rephrase]\nPlease rephrase the following text more clearly and concisely, preserving meaning:${arg ? `\n"${arg}"` : ""}`;
      case "/polish":
        return `✨ [Hymli Copilot · Polish Tone]\nPlease rewrite the following in a polished, professional executive tone${arg ? `:\n"${arg}"` : "."}`;
      case "/translate":
        return `🌐 [Hymli Copilot · Translate]\nPlease translate the following text${arg ? `:\n"${arg}"` : " from our recent messages"} into fluent English (or the target language the user specifies).`;
      case "/tone":
        return `🎯 [Hymli Copilot · Tone Analyzer]\nPlease analyze the tone of the following text and summarize the emotional register${arg ? `:\n"${arg}"` : ""}.`;
      case "/action-items":
        return "✅ [Hymli Copilot · Action Items]\nPlease extract the most important action items from our recent conversation, each as a short single line.";
      default:
        return "";
    }
  };

  // ---- CLEAR UNREAD ON REPLY ----
  // When the user submits a reply to this contact, immediately zero the unread
  // badge in the parent roster and mark the contact's messages as read in the
  // DB so the highlight clears right away (no refresh needed).
  const clearUnreadOnReply = useCallback(() => {
    // 1) Local roster sync: zero the badge + remove the highlight immediately.
    if (onClearUnread) {
      onClearUnread(activeConv.id);
    }
    // 2) DB mark-as-read for messages from this contact.
    (async () => {
      try {
        await supabase
          .from("messages")
          .update({ is_read: true, delivery_state: 3, status: 3 })
          .eq("sender_id", activeConv.user.id)
          .eq("receiver_id", currentUser.id);
      } catch (e) {
        console.warn("[ChatView] mark-as-read error:", e);
      }
    })();
  }, [onClearUnread, activeConv.id, activeConv.user.id, currentUser.id]);

  // Send Message Handler
  const handleSendMessage = async (
    customType?: "text" | "image" | "voice",
    imagePayloadUrl?: string,
  ) => {
    if (!inputText.trim() && !imagePayloadUrl) return;

    // Resolve Telegram-style bot commands into enriched Hymli AI prompts.
    const resolvedPrompt = resolveCommandText(inputText.trim());

    const burnAtTimestamp = vanishSeconds
      ? new Date(Date.now() + vanishSeconds * 1000).toISOString()
      : undefined;

    const msgData = {
      room_id: activeConv.id,
      sender_id: currentUser.id,
      receiver_id: activeConv.user.id,
      text:
        resolvedPrompt ||
        inputText.trim() ||
        (customType === "image" ? "Sent encrypted media stream" : ""),
      type: customType || (imagePayloadUrl ? "image" : "text"),
      image_url: imagePayloadUrl,
      created_at: new Date().toISOString(),
      burn_at: burnAtTimestamp,
      reply_to_id: replyingTo?.id,
      reply_preview: replyingTo
        ? {
            id: replyingTo.id,
            text: replyingTo.text,
            sender_name: replyingTo.is_me
              ? currentUser.full_name
              : activeConv.user.name,
          }
        : undefined,
    };

    const newMsg = await chatService.sendMessage(msgData);
    setMessages((prev) => [...prev, newMsg]);
    setInputText("");
    setReplyingTo(null);
    setShowAiPromptToolbar(false);
    // Box cleared after sending — immediately stop broadcasting typing.
    sendTyping(currentUser.id, activeConv.id, false);

    // Reply submitted → clear the unread badge/highlight for this contact now.
    clearUnreadOnReply();

    if (onUpdateConversation) {
      onUpdateConversation(activeConv.id, newMsg.text, newMsg);
    }

    // Hymli AI Assistant Thread Auto-Response Engine
    //
    // NOTE: The AI auto-response is now handled centrally inside
    // `chatService.sendMessage()` (see the "HYMLI AI AUTO-RESPONDER" block in
    // chatService.messages.ts). It detects Hymli threads, generates the reply,
    // and persists + broadcasts it so the bubble appears instantly. We removed
    // the duplicate trigger here to avoid the AI being called TWICE per message
    // (a race that could cause missing or duplicated replies).
    if (autoReplyBot) {
      setTimeout(async () => {
        const botMsgData = {
          room_id: activeConv.id,
          sender_id: activeConv.user.id,
          receiver_id: currentUser.id,
          text: `🤖 Auto-Reply Bot: Acknowledged "${newMsg.text.slice(0, 30)}...". Captain is currently anchored.`,
          created_at: new Date().toISOString(),
        };
        const botReply = await chatService.sendMessage(botMsgData);
        setMessages((prev) => [...prev, botReply]);
      }, 1500);
    }
  };

  // Dispatch Attachment Handler
  const handleDispatchAttachment = async (
    title: string,
    detail: string,
    cat: string,
    extraData?: any,
  ) => {
    setIsAttachmentOpen(false);
    const attachmentText = `📎 [${cat.toUpperCase()}] ${title}\n▸ ${detail}`;
    const msgData = {
      room_id: activeConv.id,
      sender_id: currentUser.id,
      receiver_id: activeConv.user.id,
      text: attachmentText,
      created_at: new Date().toISOString(),
      metadata: { attachmentData: extraData },
    };
    const newMsg = await chatService.sendMessage(msgData);
    setMessages((prev) => [...prev, newMsg]);
    showNotice(`Dispatched ${title}`);
  };

  const handleMediaFileSelected = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      showNotice("Choose an image or video file");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      showNotice("Media must be smaller than 50MB");
      return;
    }

    setIsUploadingMedia(true);
    try {
      const extension = file.name.split(".").pop()?.toLowerCase() || "bin";
      const fileId =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const filePath = `${currentUser.id}/${fileId}.${extension}`;
      const { data, error } = await supabase.storage
        .from("chat-media")
        .upload(filePath, file, { contentType: file.type, upsert: false });
      if (error) throw error;

      const { data: publicData } = supabase.storage
        .from("chat-media")
        .getPublicUrl(data.path);
      const isVideo = file.type.startsWith("video/");
      const msgData = {
        room_id: activeConv.id,
        sender_id: currentUser.id,
        receiver_id: activeConv.user.id,
        text: isVideo ? "Sent encrypted video stream" : "Sent encrypted photo",
        type: isVideo ? ("video" as const) : ("image" as const),
        image_url: isVideo ? undefined : publicData.publicUrl,
        video_url: isVideo ? publicData.publicUrl : undefined,
        created_at: new Date().toISOString(),
      };
      const newMsg = await chatService.sendMessage(msgData);
      setMessages((prev) => [...prev, newMsg]);
      onUpdateConversation?.(activeConv.id, newMsg.text, newMsg);
      showNotice(isVideo ? "Video sent" : "Photo sent");
    } catch (error) {
      console.error("[ChatView] Media upload failed:", error);
      showNotice("Media upload failed. Check storage permissions.");
    } finally {
      setIsUploadingMedia(false);
    }
  };

  // ATTACHMENT & MEDIA PICKER HUB SEND HANDLER
  // Routes results from AttachmentHub to the correct message pipeline:
  //   image/gif   → real image message (renders full-bleed + lightbox)
  //   voice       → voice note message (renders WaveformPlayer)
  //   code        → code snippet message (renders syntax-highlighted block)
  //   doc/poll/contact/event/location/beacon → rich text dispatch
  const handleAttachmentHubSend = async (result: AttachmentHubResult) => {
    setIsAttachmentHubOpen(false);
    try {
      if (result.type === "image" || result.type === "video" || result.type === "gif") {
        const file = result.extra?.file as File | undefined;
        let imageUrl = result.image_url;
        let videoUrl = result.video_url;
        if (file) {
          const extension = file.name.split(".").pop()?.toLowerCase() || "bin";
          const fileId =
            typeof crypto !== "undefined" && crypto.randomUUID
              ? crypto.randomUUID()
              : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
          const filePath = `${currentUser.id}/${fileId}.${extension}`;
          const { data, error } = await supabase.storage
            .from("chat-media")
            .upload(filePath, file, { contentType: file.type, upsert: false });
          if (error) throw error;
          const { data: publicData } = supabase.storage
            .from("chat-media")
            .getPublicUrl(data.path);
          if (result.type === "video") videoUrl = publicData.publicUrl;
          else imageUrl = publicData.publicUrl;
        }
        const msgData = {
          room_id: activeConv.id,
          sender_id: currentUser.id,
          receiver_id: activeConv.user.id,
          text: result.title,
          type: result.type === "video" ? ("video" as const) : ("image" as const),
          image_url: imageUrl,
          video_url: videoUrl,
          created_at: new Date().toISOString(),
        };
        const newMsg = await chatService.sendMessage(msgData);
        setMessages((prev) => [...prev, newMsg]);
        if (onUpdateConversation) {
          onUpdateConversation(activeConv.id, result.title, newMsg);
        }
        showNotice(result.title || "Media sent");
        return;
      }

      if (result.type === "voice") {
        const msgData = {
          room_id: activeConv.id,
          sender_id: currentUser.id,
          receiver_id: activeConv.user.id,
          text: result.title || "Voice note",
          type: "voice" as const,
          audio_url: result.audio_url,
          audio_duration: result.audio_duration,
          created_at: new Date().toISOString(),
        };
        const newMsg = await chatService.sendMessage(msgData);
        setMessages((prev) => [...prev, newMsg]);
        if (onUpdateConversation) {
          onUpdateConversation(activeConv.id, "🎤 Voice note", newMsg);
        }
        showNotice(result.detail || "Voice note sent");
        return;
      }

      if (result.type === "code") {
        const codeBlock = `\`\`\`${result.code_lang || "typescript"}\n${
          result.code_content || ""
        }\n\`\`\``;
        const msgData = {
          room_id: activeConv.id,
          sender_id: currentUser.id,
          receiver_id: activeConv.user.id,
          text: `${result.title}\n${codeBlock}`,
          created_at: new Date().toISOString(),
          metadata: {
            code_lang: result.code_lang,
            code_content: result.code_content,
            attachmentData: result.extra,
          },
        };
        const newMsg = await chatService.sendMessage(msgData);
        setMessages((prev) => [...prev, newMsg]);
        if (onUpdateConversation) {
          onUpdateConversation(activeConv.id, result.title, newMsg);
        }
        showNotice("Code snippet sent");
        return;
      }

      // Fallback: rich text dispatch (doc, poll, contact, event, location, beacon)
      const attachmentText = `[${result.category.toUpperCase()}] ${
        result.title
      } \u25B8 ${result.detail}`;
      const msgData = {
        room_id: activeConv.id,
        sender_id: currentUser.id,
        receiver_id: activeConv.user.id,
        text: attachmentText,
        created_at: new Date().toISOString(),
        metadata: { attachmentData: result.extra },
      };
      const newMsg = await chatService.sendMessage(msgData);
      setMessages((prev) => [...prev, newMsg]);
      if (onUpdateConversation) {
        onUpdateConversation(activeConv.id, result.title, newMsg);
      }
      showNotice(`Sent ${result.title}`);
    } catch (err) {
      console.warn("[ChatView] Attachment hub send error:", err);
      showNotice("Could not send attachment");
    }
  };

  // Silent Edit
  const handleSaveSilentEdit = (msgId: string) => {
    if (!editingMsgText.trim()) return;
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId ? { ...m, text: editingMsgText, is_edited: true } : m,
      ),
    );
    setEditingMsgId(null);
    showNotice("Message Silently Edited");
  };

  // Recall / Unsend Message
  const handleUnsendMsg = async (msgId: string) => {
    await chatService.deleteMessage(msgId);
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
    setActiveMsgMenuId(null);
    showNotice("Message Recalled & Unsent");
  };

  // AI Tone Polisher with Real Ollama Integration + Clean Metadata Storage
  const handlePolishTone = async (msg: ChatMessage) => {
    setActiveMsgMenuId(null);
    showNotice("Polishing Tone via Ollama AI...");
    const res = await ollamaService.generateTonePolish(msg.text, "Executive");

    setMessages((prev) =>
      prev.map((m) =>
        m.id === msg.id
          ? {
              ...m,
              metadata: {
                ...m.metadata,
                polishedText: res.result,
                tone: "Executive",
              },
            }
          : m,
      ),
    );

    if (res.isOffline) {
      showNotice(
        res.error || "Ollama offline. Run OLLAMA_ORIGINS='*' ollama serve",
      );
    } else {
      showNotice("Tone Polished Successfully");
    }
  };

  // Instant Translation with Real Ollama Integration + Clean Metadata Storage
  const handleTranslateMsg = async (
    msg: ChatMessage,
    targetLang = "Spanish",
  ) => {
    setActiveMsgMenuId(null);
    showNotice(`Translating to ${targetLang} via Ollama...`);
    const res = await ollamaService.translateText(msg.text, targetLang);

    setMessages((prev) =>
      prev.map((m) =>
        m.id === msg.id
          ? {
              ...m,
              metadata: {
                ...m.metadata,
                translation: res.result,
                translatedLang: targetLang,
              },
            }
          : m,
      ),
    );

    if (res.isOffline) {
      showNotice(
        res.error || "Ollama offline. Run OLLAMA_ORIGINS='*' ollama serve",
      );
    } else {
      showNotice(`Translated to ${targetLang}`);
    }
  };

  // AI Fact Check with Real Ollama Integration + Clean Metadata Storage
  const handleFactCheckMsg = async (msg: ChatMessage) => {
    setActiveMsgMenuId(null);
    showNotice("Fact-checking via Ollama AI...");
    const res = await ollamaService.factCheckStatement(msg.text);

    setMessages((prev) =>
      prev.map((m) =>
        m.id === msg.id
          ? {
              ...m,
              metadata: {
                ...m.metadata,
                factCheck: res.result,
              },
            }
          : m,
      ),
    );

    if (res.isOffline) {
      showNotice(
        res.error || "Ollama offline. Run OLLAMA_ORIGINS='*' ollama serve",
      );
    } else {
      showNotice("Fact-check Complete");
    }
  };

  // Generate AI Milestone Summary with Real Ollama Integration
  const handleGenerateAiSummary = async () => {
    setIsRoomMenuOpen(false);
    setIsSummarizerOpen(true);
    setAiSummary("Analyzing chat history via Ollama AI...");

    const msgList = messages.map(
      (m) =>
        `${m.is_me ? currentUser.full_name : activeConv.user.name}: ${m.text}`,
    );
    const res = await ollamaService.summarizeChat(msgList);

    setAiSummary(res.result);
    if (res.isOffline) {
      showNotice(
        res.error || "Ollama offline. Run OLLAMA_ORIGINS='*' ollama serve",
      );
    }
  };

  // Toggle Pin Message
  const handleTogglePinMsg = (msg: ChatMessage) => {
    if (pinnedMessage?.id === msg.id) {
      setPinnedMessage(null);
      showNotice("Message Unpinned");
    } else {
      setPinnedMessage(msg);
      showNotice("Message Pinned to Top");
    }
    setActiveMsgMenuId(null);
  };

  // Passcode Lock Toggle
  const handleLockMsg = (msgId: string) => {
    if (lockedMsgIds.includes(msgId)) {
      setLockedMsgIds((prev) => prev.filter((id) => id !== msgId));
      showNotice("Passcode Lock Removed");
    } else {
      setLockedMsgIds((prev) => [...prev, msgId]);
      showNotice("Passcode Lock Enabled (PIN: 1234)");
    }
    setActiveMsgMenuId(null);
  };

  const handleUnlockPasscode = () => {
    if (passcodeInput === "1234" && passcodeModalMsgId) {
      setUnlockedMsgIds((prev) => [...prev, passcodeModalMsgId]);
      setPasscodeModalMsgId(null);
      setPasscodeInput("");
      showNotice("Message Unlocked");
    } else {
      showNotice("Incorrect Passcode (Use 1234)");
    }
  };

  // Clear Chat History
  const handleClearHistory = async () => {
    const cleared = await chatService.clearHistory(currentUser.id, activeConv.user.id);
    if (!cleared) {
      showNotice("Could not clear chat history");
      return;
    }
    setMessages([]);
    setIsRoomMenuOpen(false);
    showNotice("Chat Canvas Cleared");
    if (onUpdateConversation) {
      onUpdateConversation(activeConv.id, "", undefined, true);
    }
  };

  // Execute a selected bot command. Commands that need an argument keep the
  // input in "command mode" so the user can append their text; the command is
  // resolved into an enriched Hymli AI prompt when the message is sent.
  const handleCommandSelect = (cmd: BotCommand) => {
    if (cmd.command === "/clear") {
      handleClearHistory();
      setInputText("");
      setShowAiPromptToolbar(false);
      return;
    }

    if (cmd.command === "/help") {
      const helpText = BOT_COMMANDS_INLINE.map((c) => c.command).join(", ");
      showNotice(`Available commands: ${helpText}`);
      setInputText("");
      setShowAiPromptToolbar(false);
      return;
    }

    // Commands that need an argument: replace "/x" with "/x " so the user can
    // continue typing the argument. Send resolves these into a Hymli AI prompt.
    setInputText(`${cmd.command} `);
    setShowAiPromptToolbar(true);
  };

  // Add Emoji Reaction
  const handleAddReaction = (msgId: string, emoji: string) => {
    setMsgReactions((prev) => ({
      ...prev,
      [msgId]: [...(prev[msgId] || []), emoji],
    }));
    setReactionPickerMsgId(null);
    showNotice(`Reacted ${emoji}`);
  };

  // Double Tap gesture for reaction
  const handleDoubleTap = (msgId: string) => {
    setReactionPickerMsgId(reactionPickerMsgId === msgId ? null : msgId);
  };

  // Voice Readout
  const handleTripleTapSpeech = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
      showNotice("🔊 Reading Message Aloud");
    }
  };

  // Multi select toggle
  const handleToggleSelectMsg = (msgId: string) => {
    if (selectedMsgIds.includes(msgId)) {
      setSelectedMsgIds((prev) => prev.filter((id) => id !== msgId));
    } else {
      setSelectedMsgIds((prev) => [...prev, msgId]);
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    for (const id of selectedMsgIds) {
      await chatService.deleteMessage(id);
    }
    setMessages((prev) => prev.filter((m) => !selectedMsgIds.includes(m.id)));
    setSelectedMsgIds([]);
    setMultiSelectMode(false);
    showNotice(`Deleted ${selectedMsgIds.length} Messages`);
  };

  // ---------------------------------------------------------------------------
  // BEACON (Instagram-style story ring) handlers
  // ---------------------------------------------------------------------------
  // Maps a raw `beacons` row into the app's Beacon shape. Since a chat-anchored
  // beacon can only have been created by one of this chat's two participants,
  // the author profile is resolved locally instead of a separate DB round trip.
  const mapBeaconRow = (row: any): Beacon => {
    const authorProfile = row.user_id === currentUser.id ? currentUser : targetProfile;
    return {
      id: row.id,
      user_id: row.user_id,
      author: {
        name: authorProfile.full_name || authorProfile.username,
        avatar: authorProfile.avatar_url,
        username: authorProfile.username,
      },
      media_type: row.media_type,
      content_url: row.content_url || undefined,
      text_content: row.text_content || undefined,
      bg_gradient: row.bg_gradient || undefined,
      custom_hex: row.custom_hex || undefined,
      font_family: row.font_family || undefined,
      caption_font_family: row.caption_font_family || undefined,
      audio_visualizer: row.audio_visualizer || undefined,
      is_one_time: row.is_one_time,
      created_at: row.created_at,
      expires_at: row.expires_at,
      ttl_setting: row.ttl_setting,
      allow_public_comments: row.allow_public_comments,
      viewed_by: [],
      comments: [],
      audience: row.audience,
      shared_with_user_id: row.shared_with_user_id || undefined,
    };
  };

  // Fetch + realtime-subscribe to this chat's DB-backed anchored beacon.
  // Keyed by an ORDERED user-id pair so both participants resolve to the same
  // row regardless of who anchored it or which side's local conversation id
  // they're viewing from — replaces the old localStorage-only approach, which
  // only the creator's own browser could ever see.
  useEffect(() => {
    const [userA, userB] = [currentUser.id, targetProfile.id].sort();
    let cancelled = false;

    const loadAnchor = async () => {
      const { data } = await supabase
        .from("beacon_anchors")
        .select("beacon_id, beacon:beacons(*)")
        .eq("user_a_id", userA)
        .eq("user_b_id", userB)
        .maybeSingle();
      if (cancelled) return;
      const row = (data as any)?.beacon;
      if (row) {
        const fetched = mapBeaconRow(row);
        setBeacons((prev) => (prev.some((b) => b.id === fetched.id) ? prev : [...prev, fetched]));
        setAnchoredBeaconId(fetched.id);
      } else {
        setAnchoredBeaconId(null);
      }
    };
    void loadAnchor();

    const channel = supabase
      .channel(`beacon_anchor_${userA}_${userB}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "beacon_anchors", filter: `user_a_id=eq.${userA}` },
        () => void loadAnchor(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [currentUser.id, targetProfile.id]);

  const handleCreateBeacon = async (newBeacon: Beacon) => {
    setBeacons((prev) => [...prev, newBeacon]);
    // Anchor the newly created beacon to this conversation header
    setAnchoredBeaconId(newBeacon.id);
    showNotice("🌟 Beacon Cast into Harbor & Anchored to Header");

    // Persist the anchor so the other person in this chat sees it too, on
    // any device — not just this browser's localStorage.
    const [userA, userB] = [currentUser.id, targetProfile.id].sort();
    try {
      const { error } = await supabase.from("beacon_anchors").upsert({
        user_a_id: userA,
        user_b_id: userB,
        beacon_id: newBeacon.id,
        anchored_by: currentUser.id,
      });
      if (error) console.warn("[ChatView] Failed to anchor beacon for chat partner:", error.message);
    } catch (e) {
      console.warn("[ChatView] Exception anchoring beacon for chat partner:", e);
    }
  };

  const handleAddBeaconComment = (beaconId: string, comment: BeaconComment) => {
    setBeacons((prev) =>
      prev.map((b) =>
        b.id === beaconId
          ? { ...b, comments: [...(b.comments || []), comment] }
          : b,
      ),
    );
  };

  const handleDeleteBeacon = async (beaconId: string) => {
    setBeacons((prev) => prev.filter((b) => b.id !== beaconId));
    if (anchoredBeaconId === beaconId) {
      setAnchoredBeaconId(null);
      const [userA, userB] = [currentUser.id, targetProfile.id].sort();
      try {
        await supabase
          .from("beacon_anchors")
          .delete()
          .eq("user_a_id", userA)
          .eq("user_b_id", userB)
          .eq("beacon_id", beaconId);
      } catch (e) {
        console.warn("[ChatView] Failed to clear beacon anchor:", e);
      }
    }
    showNotice("Beacon Submerged & Deleted");
  };

  const handleEditBeacon = (updatedBeacon: Beacon) => {
    setBeacons((prev) =>
      prev.map((b) => (b.id === updatedBeacon.id ? updatedBeacon : b)),
    );
  };

  const handleViewBeacon = (beaconId: string) => {
    setBeacons((prev) =>
      prev.map((b) =>
        b.id === beaconId
          ? {
              ...b,
              viewed_by: b.viewed_by?.includes(currentUser.id)
                ? b.viewed_by
                : [...(b.viewed_by || []), currentUser.id],
            }
          : b,
      ),
    );
  };

  const anchoredBeacon = beacons.find((b) => b.id === anchoredBeaconId) || null;

  const openBeaconViewerAt = (index: number) => {
    setActiveBeaconIndex(index);
    setIsBeaconViewerOpen(true);
  };

  // Wallpaper Styles
  const getWallpaperStyle = () => {
    switch (moodWallpaper) {
      case "nautical":
        return "bg-gradient-to-b from-slate-950 via-cyan-950/40 to-slate-950";
      case "midnight":
        return "bg-gradient-to-b from-slate-950 via-indigo-950/40 to-slate-950";
      case "cyberpunk":
        return "bg-gradient-to-b from-slate-950 via-purple-950/40 to-slate-950";
      default:
        return "bg-slate-950/60";
    }
  };

  return (
    <div
      className={`flex-1 flex flex-col h-full ${getWallpaperStyle()} relative overflow-hidden select-none`}
    >
{/* BEACON Creation + Viewing Modals */}
      <BeaconModal
        isOpen={isBeaconModalOpen}
        onClose={() => setIsBeaconModalOpen(false)}
        currentUser={currentUser}
        onCreateBeacon={handleCreateBeacon}
        chatPartner={{ id: targetProfile.id, name: targetProfile.full_name || targetProfile.username }}
      />

      <BeaconViewer
        beacons={beacons}
        initialIndex={activeBeaconIndex}
        isOpen={isBeaconViewerOpen}
        onClose={() => setIsBeaconViewerOpen(false)}
        currentUser={currentUser}
        onAddComment={handleAddBeaconComment}
        onViewBeacon={handleViewBeacon}
        onDeleteBeacon={handleDeleteBeacon}
        onEditBeacon={handleEditBeacon}
      />

      {/* FULL-BLEED IMAGE LIGHTBOX */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4"
            onClick={() => setLightboxImage(null)}
          >
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={lightboxImage.src}
              alt="Full-screen attachment"
              className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl select-none"
              onClick={(e) => e.stopPropagation()}
            />

            {lightboxImage.caption &&
              lightboxImage.caption !== "Sent encrypted media stream" && (
                <div
                  className="max-w-2xl w-full mt-4 px-4 py-3 rounded-2xl bg-slate-900/80 border border-slate-700 text-sm text-slate-200 text-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  {lightboxImage.caption}
                </div>
              )}

            <div
              className="mt-4 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-700 text-[10px] text-cyan-300 font-mono flex items-center gap-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              <Lock className="w-3 h-3 text-cyan-400" />
              E2EE Encrypted Stream
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attachment Modals */}
      <AttachmentModals
        type={activeAttachmentModal}
        onClose={() => setActiveAttachmentModal(null)}
        onDispatch={handleDispatchAttachment}
      />

      {/* ATTACHMENT & MEDIA PICKER HUB (10 rich features) */}
      <AttachmentHub
        isOpen={isAttachmentHubOpen}
        onClose={() => setIsAttachmentHubOpen(false)}
        onSend={handleAttachmentHubSend}
        currentUser={currentUser}
        contactName={activeConv.user.name}
      />

      {/* Room Controls Modals */}
      <RoomModals
        type={activeRoomModal}
        onClose={() => setActiveRoomModal(null)}
        messages={messages}
        currentUser={currentUser}
        targetUser={activeConv.user}
        onNotice={showNotice}
      />

      {/* User Profile Card Modal */}
      <ProfileCardModal
        isOpen={isUserProfileModalOpen}
        onClose={() => setIsUserProfileModalOpen(false)}
        targetUser={activeConv.user}
        currentUserId={currentUser.id}
        isVip={isVipPriority}
        onToggleVip={() => {
          setIsVipPriority(!isVipPriority);
          showNotice(
            isVipPriority
              ? "VIP Priority Removed"
              : "VIP Gold Priority Enabled",
          );
        }}
        languageOverride={languageOverride}
        onChangeLanguage={(lang) => setLanguageOverride(lang)}
        onNotice={showNotice}
      />

      {/* M-Pesa Subscription & AI Model Upgrade Modal */}
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        userEmail={
          currentUser.username
            ? `${currentUser.username}@hymli.com`
            : "user@hymli.com"
        }
        userId={currentUser.id}
        selectedModelId={upgradeTargetModelId}
        onSuccessUnlock={(unlockedModelId) => {
          setSelectedModelId(unlockedModelId);
          hymliAiService.setModel(unlockedModelId);
          const modelObj = AVAILABLE_MODELS.find(
            (m) => m.id === unlockedModelId,
          );
          showNotice(
            `Model Unlocked & Switched to ${modelObj?.name || unlockedModelId}`,
          );
        }}
      />

      {/* Interactive Multimodal Canvas Modal */}
      {isCanvasOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="relative max-w-3xl w-full">
            <button
              onClick={() => setIsCanvasOpen(false)}
              className="absolute -top-10 right-0 text-slate-300 hover:text-white text-sm bg-slate-800 px-3 py-1 rounded-xl cursor-pointer z-10"
            >
              ✕ Close Canvas
            </button>
            <InteractiveCanvas
              onGenerateFromSketch={(sketchBase64, prompt) => {
                showNotice(`Canvas Sketch sent to AI: "${prompt}"`);
                setIsCanvasOpen(false);
                hymliAiService.askHymli(
                  `[Canvas Sketch Submission]: ${prompt}`,
                  currentUser.id,
                  activeConv.id,
                );
              }}
              onSaveCanvas={() => {
                showNotice("Canvas exported as PNG");
              }}
            />
          </div>
        </div>
      )}

      {/* Security Watermark Overlay */}
      {isWatermarkActive && (
        <div className="absolute inset-0 z-0 pointer-events-none opacity-10 flex flex-wrap gap-12 p-8 overflow-hidden select-none">
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className="text-[11px] font-mono text-cyan-300 font-extrabold uppercase tracking-widest rotate-[-25deg]"
            >
              CONFIDENTIAL • {currentUser.full_name.toUpperCase()} • E2EE
              WATERMARK
            </div>
          ))}
        </div>
      )}

      {/* Room Lockdown Banner */}
      {isRoomLocked && (
        <div className="bg-rose-950/90 border-b border-rose-500/50 p-2 text-center text-xs font-bold text-rose-300 flex items-center justify-center gap-2 z-30">
          <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />
          <span>ROOM LOCKDOWN ENGAGED — High Security Enforcement Active</span>
        </div>
      )}

      {/* Toast Notification Banner */}
      <AnimatePresence>
        {roomNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-16 right-4 z-50 px-4 py-2.5 rounded-2xl bg-slate-900 border border-cyan-500/50 text-cyan-300 text-xs font-semibold shadow-2xl flex items-center gap-2 max-w-sm"
          >
            <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="truncate">{roomNotification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MULTI-SELECT TOP BAR */}
      {multiSelectMode && (
        <div className="p-3 bg-cyan-950 border-b border-cyan-500/40 text-cyan-200 flex items-center justify-between text-xs z-30 shrink-0">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-cyan-400" />
            <span className="font-bold">
              {selectedMsgIds.length} Messages Selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkDelete}
              disabled={selectedMsgIds.length === 0}
              className="px-3 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold hover:bg-rose-500/30"
            >
              Delete Selected
            </button>
            <button
              onClick={() => {
                setMultiSelectMode(false);
                setSelectedMsgIds([]);
              }}
              className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* 1. CHAT HEADER */}
      {!focusMode && (
        <ChatHeader
          activeConv={activeConv}
          isVipPriority={isVipPriority}
          targetUserOnline={targetUserOnline}
          targetLastSeen={targetLastSeen}
          livePresence={livePresence}
          selectedModelId={selectedModelId}
          isModelDropdownOpen={isModelDropdownOpen}
          onToggleModelDropdown={() =>
            setIsModelDropdownOpen(!isModelDropdownOpen)
          }
          onSelectModel={handleSelectModel}
          onOpenProfile={() => setIsUserProfileModalOpen(true)}
          onToggleSearch={() => setIsSearching(!isSearching)}
          onToggleRoomMenu={() => {
            // The header ⋮ button now opens the WhatsApp-style Chat Info Drawer.
            setIsRoomMenuOpen(false);
            setIsChatInfoOpen(true);
          }}
          onOpenCanvas={() => setIsCanvasOpen(true)}
          onStartCall={async () => {
            // Real phone-network call (Twilio bridge) replaces the old
            // WebRTC in-app call — works over any distance since it rides
            // the carrier network instead of a peer-to-peer internet path.
            showNotice(`Dialing ${targetProfile.full_name || targetProfile.username}'s phone...`);
            const result = await placeRealPhoneCall(currentUser, targetProfile);
            showNotice(result.success ? "Call placed — their phone is ringing" : result.error || "Could not place the call");
          }}
          onBack={onBack}
          isSearching={isSearching}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onCloseSearch={() => {
            setIsSearching(false);
            setSearchQuery("");
          }}
          pinnedMessage={pinnedMessage}
          onUnpin={() => setPinnedMessage(null)}
          anchoredBeacon={anchoredBeacon}
          onOpenBeaconViewer={() => {
            const idx = beacons.findIndex((b) => b.id === anchoredBeaconId);
            openBeaconViewerAt(idx >= 0 ? idx : 0);
          }}
        />
      )}

      {/* MENU 3: SLIDE-OUT ROOM CONTROLS SIDEBAR */}
      <RoomSettingsSidebar
        isOpen={isRoomMenuOpen}
        onClose={() => setIsRoomMenuOpen(false)}
        activeTab={activeRoomMenuTab}
        onTabChange={(tab) => setActiveRoomMenuTab(tab)}
        isLocked={isRoomLocked}
        onToggleLock={() => {
          setIsRoomLocked(!isRoomLocked);
          showNotice(isRoomLocked ? "Room Unlocked" : "Room Lockdown Engaged");
        }}
        isWatermarkActive={isWatermarkActive}
        onToggleWatermark={() => {
          setIsWatermarkActive(!isWatermarkActive);
          showNotice(
            isWatermarkActive
              ? "Watermark Disabled"
              : "Watermark Leak Shield Active",
          );
        }}
        onOpenModal={(modal) => {
          setIsRoomMenuOpen(false);
          setActiveRoomModal(modal);
        }}
        onClearHistory={handleClearHistory}
        onGenerateSummary={handleGenerateAiSummary}
        focusMode={focusMode}
        onToggleFocusMode={() => {
          setFocusMode(!focusMode);
          showNotice(focusMode ? "Focus Mode Disabled" : "Focus Mode Enabled");
        }}
        presentationFont={presentationFont}
        onTogglePresentationFont={() => {
          setPresentationFont(!presentationFont);
          showNotice(
            presentationFont ? "Sans Font Active" : "Serif Font Active",
          );
        }}
        moodWallpaper={moodWallpaper}
        onChangeWallpaper={() => {
          const wallpapers: WallpaperTheme[] = [
            "default",
            "nautical",
            "midnight",
            "cyberpunk",
          ];
          const nextWP =
            wallpapers[
              (wallpapers.indexOf(moodWallpaper) + 1) % wallpapers.length
            ];
          setMoodWallpaper(nextWP);
          showNotice(`Wallpaper: ${nextWP.toUpperCase()}`);
        }}
        autoReplyBot={autoReplyBot}
        onToggleAutoReply={() => {
          setAutoReplyBot(!autoReplyBot);
          showNotice(
            autoReplyBot ? "Auto-Reply Disabled" : "Auto-Reply Bot Active",
          );
        }}
      />

      {/* AI SUMMARIZER MODAL */}
      <AnimatePresence>
        {isSummarizerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl text-slate-100 relative"
            >
              <button
                onClick={() => setIsSummarizerOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">
                    Ollama AI Executive Summary
                  </h3>
                  <p className="text-xs text-slate-400">
                    Synthesized key points from transcript
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                {aiSummary || "Synthesizing..."}
              </div>

              <button
                onClick={() => setIsSummarizerOpen(false)}
                className="w-full mt-4 py-3 rounded-2xl bg-cyan-500 text-slate-950 font-extrabold hover:bg-cyan-400"
              >
                Acknowledge Summary
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. STICKY DYNAMIC FLOATING DATE BADGE */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-slate-900/90 text-cyan-300 border border-slate-700/80 shadow-xl backdrop-blur-md transition-all">
          {floatingDate}
        </span>
      </div>

      {/* 3. CHAT MESSAGES TIMELINE */}
      <div
        ref={chatScrollRef}
        onScroll={handleScroll}
        className={`min-h-0 flex-1 p-3 sm:p-4 overflow-y-auto ${compactRows ? "space-y-2" : "space-y-4"} relative pb-28`}
      >
        <div className="text-center my-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider bg-slate-900/90 border border-slate-800 text-cyan-400">
            <Lock className="w-3 h-3 text-cyan-400" />
            E2EE Nautical Encrypted Stream
          </span>
        </div>

{activeMessages.map((msg, index) => {
          // Sender identification: normalize BOTH sides to strings so a UUID
          // object, casing mismatch, or missing sender_id can never flip the
          // alignment. Messages from the current user render RIGHT (sent);
          // all others — including AI/bot messages (sender_id = bot ID) —
          // render LEFT (received).
const isMe =
            String(msg.sender_id || "") === String(currentUser?.id || "");
          const msgDateLabel = getMessageDateLabel(msg.created_at);
          const prevMsgDateLabel =
            index > 0
              ? getMessageDateLabel(messages[index - 1].created_at)
              : null;
          const showDateDivider = msgDateLabel !== prevMsgDateLabel;
          const isHighlighted = highlightedMsgId === msg.id;
          const isMenuOpen = activeMsgMenuId === msg.id;
          const isPasscodeLocked =
            lockedMsgIds.includes(msg.id) && !unlockedMsgIds.includes(msg.id);
          const isBlurred = blurredMsgIds.includes(msg.id);
          const reactions = msgReactions[msg.id] || [];

          return (
            <React.Fragment key={msg.id}>
              {/* Date Divider */}
              {showDateDivider && (
                <div
                  data-date-label={msgDateLabel}
                  className="flex justify-center my-3"
                >
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-slate-900/80 border border-slate-800 text-slate-400 uppercase tracking-wider">
                    {msgDateLabel}
                  </span>
                </div>
              )}

<div
                id={`msg-${msg.id}`}
                ref={(node) => observeMessageRef(node, msg)}
                onDoubleClick={() => handleDoubleTap(msg.id)}
                onTouchStart={(event) => {
                  const touch = event.touches[0];
                  swipeStartRef.current = { x: touch.clientX, y: touch.clientY };
                }}
                onTouchEnd={(event) => {
                  const start = swipeStartRef.current;
                  const touch = event.changedTouches[0];
                  swipeStartRef.current = null;
                  if (!start || !touch) return;
                  const deltaX = touch.clientX - start.x;
                  const deltaY = touch.clientY - start.y;
                  if (deltaX < -60 && Math.abs(deltaX) > Math.abs(deltaY) * 1.25) {
                    setReplyingTo(msg);
                    showNotice("Replying to message");
                  }
                }}
                className={`flex flex-col w-full ${
                  isMe ? "justify-end items-end" : "justify-start items-start"
                } group transition-all duration-300 relative touch-pan-y ${
                  isHighlighted
                    ? "scale-105 ring-2 ring-cyan-400 rounded-2xl p-1"
                    : ""
                }`}
              >
                {/* Multi Select Checkbox */}
                {multiSelectMode && (
                  <div className="absolute left-0 top-2 -ml-8">
                    <input
                      type="checkbox"
                      checked={selectedMsgIds.includes(msg.id)}
                      onChange={() => handleToggleSelectMsg(msg.id)}
                      className="w-4 h-4 rounded text-cyan-500"
                    />
                  </div>
                )}

                {/* Reply Preview Header */}
                {msg.reply_preview && (
                  <div
                    className={`text-[11px] p-2 rounded-t-xl mb-1 max-w-[80%] border-l-2 ${
                      isMe
                        ? "bg-indigo-950/60 border-cyan-400 text-indigo-200"
                        : "bg-slate-800/80 border-indigo-400 text-slate-300"
                    }`}
                  >
                    <span className="font-bold text-cyan-300">
                      {msg.reply_preview.sender_name}:{" "}
                    </span>
                    <span className="truncate">{msg.reply_preview.text}</span>
                    <span className="ml-2 text-[9px] text-slate-400">
                      {new Date(msg.reply_preview.created_at || msg.created_at).toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Message Bubble Container */}
                {msg.type === "call_log" ? (
                  <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs font-mono">
                    {msg.call_info?.status === "missed" ? (
                      <div className="p-1.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        <PhoneMissed className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="p-1.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <PhoneCall className="w-4 h-4" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-slate-200">{msg.text}</p>
                      <p className="text-[10px] text-slate-500">
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="relative flex items-center gap-1 max-w-[85%] sm:max-w-md">
                    {/* MENU 2: Message Contextual Menu Button — opens the new MessageActionSheet */}
                    <button
                      onClick={() =>
                        isMenuOpen
                          ? setActiveMsgMenuId(null)
                          : openMessageActionSheet(msg)
                      }
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white transition-opacity cursor-pointer shrink-0"
                      title="Message Actions & Insights"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>

                    <div
                      className={`relative w-full ${compactRows ? "p-2.5" : "p-3.5"} rounded-2xl text-sm shadow-xl transition-all ${
                        presentationFont ? "font-serif" : ""
                      } ${
                        isMe
                          ? "bg-gradient-to-r from-indigo-600 via-indigo-700 to-cyan-700 text-white rounded-br-none"
                          : "bg-slate-900 text-slate-100 rounded-bl-none border border-slate-800"
                      } ${isBlurred ? "filter blur-sm hover:filter-none transition-all" : ""}`}
                    >
                      {/* Passcode Lock Shroud */}
                      {isPasscodeLocked ? (
                        <div
                          onClick={() => setPasscodeModalMsgId(msg.id)}
                          className="p-4 bg-slate-950/90 rounded-xl border border-amber-500/40 flex flex-col items-center gap-2 cursor-pointer text-center"
                        >
                          <Lock className="w-6 h-6 text-amber-400 animate-bounce" />
                          <span className="text-xs font-bold text-amber-300">
                            Protected Message Bubble
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Click to enter passcode (Try 1234)
                          </span>
                        </div>
                      ) : (
                        <>
                          {/* Full-Bleed Image Attachment (Instagram-style) */}
                          {msg.video_url && (
                            <div
                              className={`relative overflow-hidden group/img ${
                                isMe ? "rounded-br-none" : "rounded-bl-none"
                              } ${compactRows ? "-m-2.5" : "-m-3.5"} mb-0`}
                            >
                              <video
                                src={msg.video_url}
                                controls
                                preload="metadata"
                                className="w-full max-h-[420px] object-cover"
                              />
                              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-[10px] text-cyan-300 font-mono flex items-center gap-1 shadow-lg pointer-events-none">
                                <Lock className="w-3 h-3 text-cyan-400" />
                                <span>Encrypted Stream</span>
                              </div>
                            </div>
                          )}

                          {msg.image_url && (
                            <div
                              className={`relative overflow-hidden group/img ${
                                isMe ? "rounded-br-none" : "rounded-bl-none"
                              } ${compactRows ? "-m-2.5" : "-m-3.5"} mb-0`}
                            >
                              <button
                                onClick={() =>
                                  setLightboxImage({
                                    src: msg.image_url!,
                                    caption: msg.text,
                                  })
                                }
                                className="block w-full cursor-zoom-in"
                                title="Open full-screen"
                              >
                                <img
                                  src={msg.image_url}
                                  alt="Encrypted attachment"
                                  className="w-full max-h-[420px] object-cover"
                                />
                              </button>
                              {/* Bottom gradient overlay */}
                              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
                              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-[10px] text-cyan-300 font-mono flex items-center gap-1 shadow-lg">
                                <Lock className="w-3 h-3 text-cyan-400" />
                                <span>Encrypted Stream</span>
                              </div>
                              <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-[10px] text-white flex items-center gap-1 shadow-lg">
                                ⛶ Full-Screen
                              </div>
                            </div>
                          )}

                          {/* Voice Note Bubble (WhatsApp-style waveform player) */}
                          {msg.type === "voice" && msg.audio_url && (
                            <div
                              className={`relative overflow-hidden ${
                                isMe ? "rounded-br-none" : "rounded-bl-none"
                              } ${compactRows ? "-m-2.5" : "-m-3.5"} mb-0`}
                            >
                              <WaveformPlayer
                                src={msg.audio_url}
                                duration={msg.audio_duration}
                                isMe={isMe}
                                compact={compactRows}
                              />
                            </div>
                          )}

                          {/* Inline Silent Editing Form */}
                          {editingMsgId === msg.id ? (
                            <div className="space-y-2">
                              <textarea
                                value={editingMsgText}
                                onChange={(e) =>
                                  setEditingMsgText(e.target.value)
                                }
                                className="w-full p-2 bg-slate-950 border border-cyan-400 rounded-lg text-xs text-slate-100 focus:outline-none"
                                rows={2}
                              />
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => setEditingMsgId(null)}
                                  className="px-2 py-1 text-[10px] text-slate-400 hover:text-white"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleSaveSilentEdit(msg.id)}
                                  className="px-2.5 py-1 text-[10px] bg-cyan-500 text-slate-950 font-bold rounded-md"
                                >
                                  Save Edit
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              {/* Raw Message Text or Polished Text with Code Block Execution
                                  (skip for voice notes — the WaveformPlayer carries the UI) */}
                              {msg.type !== "voice" &&
                                renderMessageTextWithCodeBlocks(
                                  msg.metadata?.polishedText || msg.text,
                                )}

                              {/* Separate Overlay: Translation */}
                              {msg.metadata?.translation && (
                                <div className="mt-2 p-2 rounded-xl bg-slate-950/80 border border-indigo-500/40 text-xs text-indigo-200 flex flex-col gap-1">
                                  <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-400">
                                    <Globe className="w-3 h-3" />
                                    <span>
                                      {msg.metadata.translatedLang || "Spanish"}{" "}
                                      Translation
                                    </span>
                                  </div>
                                  <p>{msg.metadata.translation}</p>
                                </div>
                              )}

                              {/* Separate Overlay: Fact Check */}
                              {msg.metadata?.factCheck && (
                                <div className="mt-2 p-2 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-[11px] text-emerald-200">
                                  {msg.metadata.factCheck}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Emoji Reactions List */}
                          {reactions.length > 0 && (
                            <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                              {reactions.map((r, i) => (
                                <span
                                  key={i}
                                  className="px-1.5 py-0.5 rounded-full bg-slate-800 text-[11px] border border-slate-700"
                                >
                                  {r}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Footer Info */}
                          <div className="flex items-center justify-end gap-2 text-[10px] mt-1.5 opacity-90">
                            {msg.burn_at && (
                              <span className="flex items-center gap-1 text-amber-300 font-mono">
                                <Flame className="w-3 h-3 text-amber-400 animate-pulse" />
                                <span>Vanishing</span>
                              </span>
                            )}

                            <span className="text-slate-300">
                              {new Date(msg.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>

                            {isMe && (
                              <MessageStatus
                                status={msg.status}
                                isRead={msg.status === 3}
                              />
                            )}

                            <button
                              onClick={() => setReplyingTo(msg)}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/20 rounded transition-opacity cursor-pointer text-slate-300"
                              title="Swipe / Reply"
                            >
                              <CornerDownRight className="w-3 h-3" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Quick Emoji Reaction Picker */}
                    <AnimatePresence>
                      {reactionPickerMsgId === msg.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 rounded-full p-1.5 flex items-center gap-2 shadow-2xl z-40"
                        >
                          {["👍", "❤️", "🔥", "👏", "🚀", "😂"].map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => handleAddReaction(msg.id, emoji)}
                              className="hover:scale-125 transition-transform text-base"
                            >
                              {emoji}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* MENU 2: Tabbed Contextual Popover Dropdown */}
                    <AnimatePresence>
                      {isMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className={`absolute bottom-full mb-2 ${
                            isMe ? "right-0" : "left-0"
                          } z-50 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 space-y-2 text-xs`}
                        >
                          {/* Menu 2 Category Tabs */}
                          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                            <button
                              onClick={() => setActiveMsgMenuTab("refine")}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                                activeMsgMenuTab === "refine"
                                  ? "bg-cyan-500/20 text-cyan-400"
                                  : "text-slate-400"
                              }`}
                            >
                              Refine
                            </button>
                            <button
                              onClick={() => setActiveMsgMenuTab("organize")}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                                activeMsgMenuTab === "organize"
                                  ? "bg-indigo-500/20 text-indigo-400"
                                  : "text-slate-400"
                              }`}
                            >
                              Organize
                            </button>
                            <button
                              onClick={() => setActiveMsgMenuTab("insights")}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                                activeMsgMenuTab === "insights"
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : "text-slate-400"
                              }`}
                            >
                              Insights
                            </button>
                            <button
                              onClick={() => setActiveMsgMenuTab("privacy")}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                                activeMsgMenuTab === "privacy"
                                  ? "bg-amber-500/20 text-amber-400"
                                  : "text-slate-400"
                              }`}
                            >
                              Privacy
                            </button>
                          </div>

                          {/* TAB 1: REFINEMENT */}
                          {activeMsgMenuTab === "refine" && (
                            <div className="space-y-1">
                              {isMe && (
                                <button
                                  onClick={() => {
                                    setEditingMsgId(msg.id);
                                    setEditingMsgText(msg.text);
                                    setActiveMsgMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800 text-slate-200 text-left"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                                  <span>Silent Edit</span>
                                </button>
                              )}
                              <button
                                onClick={() => handleUnsendMsg(msg.id)}
                                className="w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-rose-500/20 text-rose-300 text-left"
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                                <span>Recall (Unsend)</span>
                              </button>
                              <button
                                onClick={() => handlePolishTone(msg)}
                                className="w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800 text-slate-200 text-left"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                <span>Ollama Tone Polisher</span>
                              </button>
                              <button
                                onClick={() =>
                                  handleTranslateMsg(msg, "Spanish")
                                }
                                className="w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800 text-slate-200 text-left"
                              >
                                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                                <span>Ollama Translate</span>
                              </button>
                            </div>
                          )}

                          {/* TAB 2: ORGANIZATION */}
                          {activeMsgMenuTab === "organize" && (
                            <div className="space-y-1">
                              <button
                                onClick={() => handleTogglePinMsg(msg)}
                                className="w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800 text-slate-200 text-left"
                              >
                                <Pin className="w-3.5 h-3.5 text-cyan-400" />
                                <span>
                                  {pinnedMessage?.id === msg.id
                                    ? "Unpin"
                                    : "Pin to Top"}
                                </span>
                              </button>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(msg.text);
                                  setActiveMsgMenuId(null);
                                  showNotice("Copied Pure Text");
                                }}
                                className="w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800 text-slate-200 text-left"
                              >
                                <Copy className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Copy Text</span>
                              </button>
                            </div>
                          )}

                          {/* TAB 3: INSIGHTS */}
                          {activeMsgMenuTab === "insights" && (
                            <div className="space-y-1">
                              <button
                                onClick={() => handleFactCheckMsg(msg)}
                                className="w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800 text-slate-200 text-left"
                              >
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Ollama AI Fact-Check</span>
                              </button>
                              <div className="p-1.5 rounded-lg bg-slate-950 text-[10px] text-slate-400 font-mono">
                                Delivered:{" "}
                                {new Date(msg.created_at).toLocaleTimeString()}
                              </div>
                            </div>
                          )}

                          {/* TAB 4: PRIVACY */}
                          {activeMsgMenuTab === "privacy" && (
                            <div className="space-y-1">
                              <button
                                onClick={() => handleLockMsg(msg.id)}
                                className="w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800 text-amber-300 text-left"
                              >
                                <Lock className="w-3.5 h-3.5 text-amber-400" />
                                <span>
                                  {lockedMsgIds.includes(msg.id)
                                    ? "Remove Lock"
                                    : "Passcode Lock"}
                                </span>
                              </button>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </React.Fragment>
          );
        })}

        {/* REAL-TIME TYPING INDICATOR (remote user typing / "Nevermind" fade) */}
        <AnimatePresence>
          {remoteUserTyping && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="flex items-start gap-2 pl-1 pr-16"
            >
              <img
                src={activeConv.user.avatar}
                alt={activeConv.user.name}
                className="w-7 h-7 rounded-full object-cover border border-slate-700"
              />
              <div className="p-3 rounded-2xl rounded-bl-none bg-slate-900 border border-slate-800 shadow-xl">
                <div className="flex items-center gap-1.5">
                  <span className="typing-dot w-2 h-2 rounded-full bg-cyan-400" />
                  <span className="typing-dot w-2 h-2 rounded-full bg-cyan-400" />
                  <span className="typing-dot w-2 h-2 rounded-full bg-cyan-400" />
                </div>
              </div>
            </motion.div>
          )}

          {!remoteUserTyping && showNevermind && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ opacity: { duration: 0.8 } }}
              className="flex items-center gap-1.5 pl-1 pr-16 text-xs text-slate-400 italic"
            >
              <img
                src={activeConv.user.avatar}
                alt={activeConv.user.name}
                className="w-6 h-6 rounded-full object-cover border border-slate-700"
              />
              <span>Nevermind</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* 4. BOTTOM INPUT BAR & MENU 1 (+) GLASSMORPHIC DRAWER */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/90 backdrop-blur-xl z-20 shrink-0 space-y-2">
        {/* Reply Bar */}
        {replyingTo && (
          <div className="flex items-center justify-between p-2 px-3 rounded-xl bg-slate-800 text-xs text-slate-200 border-l-2 border-cyan-400">
            <div className="truncate">
              <span className="font-bold text-cyan-300">
                Replying to{" "}
                {replyingTo.is_me ? "yourself" : activeConv.user.name}:{" "}
              </span>
              <span className="truncate opacity-80">{replyingTo.text}</span>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-slate-400 hover:text-white ml-2"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* MENU 1: GLASSMORPHIC ATTACHMENT DRAWER */}
        <AnimatePresence>
          {isAttachmentOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="p-3 bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-2xl space-y-3"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-cyan-300">
                  Dispatch Attachment Drawer
                </span>
                <div className="flex items-center gap-1">
                  {(["docs", "media", "legal", "tools"] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setAttachmentCategory(cat)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold capitalize ${
                        attachmentCategory === cat
                          ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                          : "text-slate-400"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                  <button
                    onClick={() => setIsAttachmentOpen(false)}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* DRAWER BUTTONS */}
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-[11px]">
                {attachmentCategory === "docs" && (
                  <>
                    <button
                      onClick={() => {
                        setIsAttachmentOpen(false);
                        setActiveAttachmentModal("doc");
                      }}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center gap-1.5 hover:border-cyan-500/50 text-slate-200"
                    >
                      <FileText className="w-5 h-5 text-cyan-400" />
                      <span>Document</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsAttachmentOpen(false);
                        setActiveAttachmentModal("spreadsheet");
                      }}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center gap-1.5 hover:border-emerald-500/50 text-slate-200"
                    >
                      <Table className="w-5 h-5 text-emerald-400" />
                      <span>Spreadsheet</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsAttachmentOpen(false);
                        setActiveAttachmentModal("expire");
                      }}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center gap-1.5 hover:border-amber-500/50 text-slate-200"
                    >
                      <Clock className="w-5 h-5 text-amber-400" />
                      <span>Auto-Expire</span>
                    </button>

                    <button
                      onClick={() =>
                        handleDispatchAttachment(
                          "Cloud Drive Backup",
                          "Google Drive Shared Key",
                          "docs",
                        )
                      }
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center gap-1.5 hover:border-indigo-500/50 text-slate-200"
                    >
                      <FolderPlus className="w-5 h-5 text-indigo-400" />
                      <span>Cloud Drive</span>
                    </button>

                    <button
                      onClick={() =>
                        handleDispatchAttachment(
                          "Zip Package",
                          "Archive_Project_2026.zip",
                          "docs",
                        )
                      }
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center gap-1.5 hover:border-purple-500/50 text-slate-200"
                    >
                      <Archive className="w-5 h-5 text-purple-400" />
                      <span>Zip Package</span>
                    </button>
                  </>
                )}

                {attachmentCategory === "media" && (
                  <>
                    <button
                      onClick={() => {
                        mediaInputRef.current?.click();
                        setIsAttachmentOpen(false);
                      }}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center gap-1.5 hover:border-cyan-500/50 text-slate-200"
                    >
                      <ImageIcon className="w-5 h-5 text-cyan-400" />
                      <span>Photo Roll</span>
                    </button>

                    <button
                      onClick={() =>
                        handleDispatchAttachment(
                          "Encrypted Audio Note",
                          "Duration: 01:24",
                          "media",
                        )
                      }
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center gap-1.5 hover:border-amber-500/50 text-slate-200"
                    >
                      <Mic className="w-5 h-5 text-amber-400" />
                      <span>Audio Note</span>
                    </button>

                    <button
                      onClick={() => {
                        mediaInputRef.current?.click();
                        setIsAttachmentOpen(false);
                      }}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center gap-1.5 hover:border-purple-500/50 text-slate-200"
                    >
                      <Film className="w-5 h-5 text-purple-400" />
                      <span>Video Note</span>
                    </button>
                  </>
                )}

                {attachmentCategory === "legal" && (
                  <>
                    <button
                      onClick={() => {
                        setIsAttachmentOpen(false);
                        setActiveAttachmentModal("invoice");
                      }}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center gap-1.5 hover:border-emerald-500/50 text-slate-200"
                    >
                      <DollarSign className="w-5 h-5 text-emerald-400" />
                      <span>Invoice</span>
                    </button>

                    <button
                      onClick={() =>
                        handleDispatchAttachment(
                          "Corporate NDA",
                          "Sign & Return Lock",
                          "legal",
                        )
                      }
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center gap-1.5 hover:border-indigo-500/50 text-slate-200"
                    >
                      <ShieldCheck className="w-5 h-5 text-indigo-400" />
                      <span>Corporate NDA</span>
                    </button>
                  </>
                )}

                {attachmentCategory === "tools" && (
                  <>
                    <button
                      onClick={() => {
                        setIsAttachmentOpen(false);
                        setActiveAttachmentModal("poll");
                      }}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center gap-1.5 hover:border-purple-500/50 text-slate-200"
                    >
                      <Vote className="w-5 h-5 text-purple-400" />
                      <span>Survey Poll</span>
                    </button>

                    <button
                      onClick={() =>
                        handleDispatchAttachment(
                          "Live GPS Pin",
                          "Lat: 37.7749, Lon: -122.4194",
                          "tools",
                        )
                      }
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center gap-1.5 hover:border-rose-500/50 text-slate-200"
                    >
                      <MapPin className="w-5 h-5 text-rose-400" />
                      <span>GPS Pin</span>
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI COMMAND PALETTE (shown when typing "/") */}
        {showAiPromptToolbar && (
          <div className="relative z-30">
            <CommandPalette
              query={commandQuery}
              onSelect={handleCommandSelect}
              onClose={() => setShowAiPromptToolbar(false)}
            />
          </div>
        )}

        {/* INLINE VOICE NOTE RECORDER PANEL (handled inside ChatInputBar) */}

        {/* INPUT CONTROL FIELD */}
        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:flex-nowrap">
          {/* MENU 1 (+) ATTACHMENT DRAWER TOGGLE — opens the new AttachmentHub */}
          <button
            onClick={() => {
              setIsAttachmentOpen(false);
              setIsAttachmentHubOpen(true);
            }}
            className={`p-2.5 rounded-2xl transition-all cursor-pointer ${
              isAttachmentHubOpen
                ? "bg-cyan-500 text-slate-950 rotate-45"
                : "bg-slate-800 text-cyan-400 hover:bg-slate-700"
            }`}
            title="Open Attachment & Media Hub"
          >
            <Plus className="w-5 h-5" />
          </button>

          <input
            ref={mediaInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            disabled={isUploadingMedia}
            onChange={handleMediaFileSelected}
          />

          {/* CREATIVE CANVAS BUTTON */}
          <button
            onClick={() => setIsCanvasOpen(true)}
            className="p-2.5 rounded-2xl bg-slate-800 text-cyan-400 hover:bg-slate-700 transition-all cursor-pointer"
            title="Open Creative Canvas (Sketch / Mind Map / Magic Erase)"
          >
            🎨
          </button>

          {/* BEACON ANCHOR / CAST BUTTON (Instagram-style story ring) */}
          <div className="relative">
            <button
              onClick={() => {
                // If a beacon is already anchored, one tap re-opens the viewer;
                // otherwise open the Beacon creation modal.
                if (anchoredBeacon) {
                  const idx = beacons.findIndex(
                    (b) => b.id === anchoredBeaconId,
                  );
                  openBeaconViewerAt(idx >= 0 ? idx : 0);
                } else {
                  setIsBeaconModalOpen(true);
                }
              }}
              className={`p-2.5 rounded-2xl transition-all cursor-pointer ${
                anchoredBeacon
                  ? "bg-gradient-to-tr from-pink-500 via-rose-500 to-cyan-400 text-white shadow-lg shadow-pink-500/30"
                  : "bg-slate-800 text-pink-400 hover:bg-slate-700"
              }`}
              title={
                anchoredBeacon
                  ? "Open anchored Beacon"
                  : "Cast & anchor a Beacon (ephemeral story)"
              }
            >
              <Radio className="w-5 h-5" />
            </button>

            {/* Anchor Indicator Drop Badge */}
            {anchoredBeacon && (
              <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-pink-500 border-2 border-[#0b101b] flex items-center justify-center shadow-md">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              </span>
            )}
          </div>

          {/* DOCUMENT DEEP-DIVE PDF BUTTON */}
          <button
            onClick={() => pdfInputRef.current?.click()}
            className="p-2.5 rounded-2xl bg-slate-800 text-amber-400 hover:bg-slate-700 transition-all cursor-pointer"
            title="Document Deep-Dive (Parse 100+ page PDF)"
          >
            <FileText className="w-5 h-5 text-amber-400" />
          </button>
          <input
            type="file"
            ref={pdfInputRef}
            accept=".pdf,application/pdf"
            onChange={handlePdfFileChange}
            className="hidden"
          />

          {/* HYMLI AI TOOL SUITE BUTTON */}
          <button
            onClick={() => setIsHymliToolsOpen(true)}
            className={`p-2.5 rounded-2xl transition-all cursor-pointer ${
              isHymliToolsOpen
                ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30"
                : "bg-slate-800 text-indigo-400 hover:bg-slate-700"
            }`}
            title="Open Hymli AI Tool Suite"
          >
            <Bot className="w-5 h-5" />
          </button>

          <ChatInputBar
            activeConv={activeConv}
            currentUser={currentUser}
            onUpdateConversation={onUpdateConversation}
            sendTyping={sendTyping}
            setMessages={setMessages}
            scrollToBottom={scrollToBottom}
            replyingTo={replyingTo}
            setReplyingTo={setReplyingTo}
            editingMessage={editingMessage}
            setEditingMessage={setEditingMessage}
            showAiPromptToolbar={showAiPromptToolbar}
            setShowAiPromptToolbar={setShowAiPromptToolbar}
            isBlocked={isUserBlocked}
          />
        </div>
      </div>

      {/* ADVANCED MESSAGE ACTION SHEET (10 WhatsApp-style actions) */}
      {actionSheetMessage && (
        <MessageActionSheet
          isOpen={Boolean(actionSheetMessage)}
          onClose={closeMessageActionSheet}
          message={actionSheetMessage}
          currentUser={currentUser}
targetUser={activeConv.user}
          isMe={
            actionSheetMessage.is_me ??
            String(actionSheetMessage.sender_id || "") ===
              String(currentUser?.id || "")
          }
          isPinned={actionSheetPinned}
          draftConversations={activeConv ? [activeConv] : []}
          availableContacts={[
            {
              id: activeConv.user.id,
              username: activeConv.user.name,
              full_name: activeConv.user.name,
              avatar_url: activeConv.user.avatar,
            },
          ]}
          onReply={() => {
            setReplyingTo(actionSheetMessage);
            closeMessageActionSheet();
          }}
          onForwardSent={(targetUserIds, count) => {
            chatService
              .forwardMessages(
                [actionSheetMessage.id],
                targetUserIds,
                currentUser.id,
              )
              .then(() => {
                showNotice(`Forwarded to ${count} chats`);
              });
          }}
          onStarred={(collection) => {
            chatService
              .starMessage(actionSheetMessage.id, currentUser.id, collection)
              .then(() => showNotice(`Saved to ${collection}`));
          }}
          onUnstarred={() => {
            chatService
              .unstarMessage(actionSheetMessage.id, currentUser.id)
              .then(() => showNotice("Bookmark removed"));
          }}
          onPinned={(duration) => {
            chatService
              .pinMessage(actionSheetMessage.id, currentUser.id, duration, true)
              .then(() => {
                setPinnedMessage(actionSheetMessage);
                setActionSheetPinned(true);
                showNotice(`Pinned for ${duration}`);
              });
          }}
          onUnpinned={() => {
            chatService
              .pinMessage(
                actionSheetMessage.id,
                currentUser.id,
                "24 Hours",
                false,
              )
              .then(() => {
                setPinnedMessage(null);
                setActionSheetPinned(false);
                showNotice("Message unpinned");
              });
          }}
          onEdited={(newText) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === actionSheetMessage.id
                  ? { ...m, text: newText, is_edited: true }
                  : m,
              ),
            );
            showNotice("Message edited");
          }}
          onEditHistorySaved={(prevText) => {
            chatService
              .saveEditHistory(actionSheetMessage.id, prevText)
              .then(() => {});
          }}
          onReplyPrivately={(targetProfile) => {
            // Start a 1-on-1 with the selected contact (quote context).
            showNotice(`Replying privately to ${targetProfile.full_name}`);
          }}
          onDeleteMessage={handleDeleteMessage}
        />
      )}

      {/* WHATSAPP-STYLE CHAT INFO DRAWER (10 features) */}
      <ChatInfoDrawer
        isOpen={isChatInfoOpen}
        onClose={() => setIsChatInfoOpen(false)}
        contactName={activeConv.user.name}
        contactAvatar={activeConv.user.avatar}
        targetUserId={activeConv.user.id}
        conversationId={activeConv.id}
        currentUserId={currentUser.id}
        messages={messages}
        prefs={chatPrefs}
        onPrefsChange={handleChatPrefsChange}
        onNotice={showNotice}
        onClearHistory={handleClearHistory}
        onOpenGroupManagement={() => {
          setIsChatInfoOpen(false);
          setIsGroupMgmtOpen(true);
        }}
      />

      {/* GROUP MANAGEMENT MATRIX MODAL */}
      <GroupManagementModal
        isOpen={isGroupMgmtOpen}
        onClose={() => setIsGroupMgmtOpen(false)}
        groupName={activeConv.user.name}
        isAdmin={true}
        onNotice={showNotice}
      />

      {/* HYMLI AI TOOL SUITE MODAL */}
      <HymliToolsModal
        isOpen={isHymliToolsOpen}
        onClose={() => setIsHymliToolsOpen(false)}
        currentUser={currentUser}
        onOpenUpgrade={() => {
          setIsHymliToolsOpen(false);
          setIsUpgradeModalOpen(true);
        }}
      />
    </div>
  );
};
