import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
} from 'lucide-react';

import { Conversation, ChatMessage, Profile, MessageDeliveryStatus } from '../types';
import { MessageStatus } from './MessageStatus';
import { usePresence } from '../hooks/usePresence';
import { chatService, filterVanishingMessages } from '../services/chatService';
import { ollamaService } from '../services/ollamaService';
import { hymliAiService, HYMLI_AI_BOT_ID } from '../services/hymliAiService';
import { AVAILABLE_MODELS, checkModelAccess, ModelOption } from '../services/aiRouterService';
import { UpgradeModal } from './UpgradeModal';
import { InteractiveCanvas } from './canvas/InteractiveCanvas';
import { useSubscription } from '../hooks/useSubscription';
import { parseDocumentContent } from '../lib/plugins/documentDeepDive';
import { CodeBlock } from './chat/CodeBlock';
import { MindMapViewer } from './chat/MindMapViewer';
import { InstagramGridPlanner } from './chat/InstagramGridPlanner';
import { ExpenseChartWidget } from './chat/ExpenseChartWidget';
import { VoiceNoteSummaryWidget } from './chat/VoiceNoteSummaryWidget';
import { StoryPollWidget } from './chat/StoryPollWidget';
import { DMGhostwriterWidget } from './chat/DMGhostwriterWidget';
import { SkillCourseWidget } from './chat/SkillCourseWidget';
import { FactCheckWidget } from './chat/FactCheckWidget';
import { WorkoutWidget } from './chat/WorkoutWidget';
import { MealPlannerWidget } from './chat/MealPlannerWidget';
import { CodeAuditWidget } from './chat/CodeAuditWidget';
import { TravelPlannerWidget } from './chat/TravelPlannerWidget';
import { ResumeOptimizerWidget } from './chat/ResumeOptimizerWidget';
import { MeetingNotesWidget } from './chat/MeetingNotesWidget';
import { VocabBuilderWidget } from './chat/VocabBuilderWidget';
import { ContractAnalyzerWidget } from './chat/ContractAnalyzerWidget';
import { TechStackEstimatorWidget } from './chat/TechStackEstimatorWidget';
import { InterviewPrepWidget } from './chat/InterviewPrepWidget';
import { PRReviewerWidget } from './chat/PRReviewerWidget';
import { SqlBuilderWidget } from './chat/SqlBuilderWidget';
import { PortfolioRebalancerWidget } from './chat/PortfolioRebalancerWidget';
import { RoadmapPlannerWidget } from './chat/RoadmapPlannerWidget';
import { SupportTicketWidget } from './chat/SupportTicketWidget';
import { PaperSummarizerWidget } from './chat/PaperSummarizerWidget';
import { InvoiceWidget } from './chat/InvoiceWidget';

import { useWebRTCCall } from '../hooks/useWebRTCCall';
import { CallOverlay } from './CallOverlay';
import { formatNauticalPresence } from '../utils/formatTime';
import { AttachmentModals } from './chat/AttachmentModals';
import { RoomModals } from './chat/RoomModals';
import { ProfileCardModal } from './chat/ProfileCardModal';

interface ChatViewProps {
  activeConv: Conversation;
  currentUser: Profile;
  isDark: boolean;
  onBack?: () => void;
  onUpdateConversation?: (convId: string, lastMsg: string, newMsg?: ChatMessage, cleared?: boolean) => void;
}

// Helper: Format Date Labels for Inline Dividers & Sticky Floating Badge
const getMessageDateLabel = (dateString: string): string => {
  if (!dateString) return '';
  const messageDate = new Date(dateString);
  const now = new Date();

  const msgZero = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
  const nowZero = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffTime = nowZero.getTime() - msgZero.getTime();
  const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays > 1 && diffDays < 7) {
    return messageDate.toLocaleDateString([], { weekday: 'long' });
  }

  const day = String(messageDate.getDate()).padStart(2, '0');
  const month = String(messageDate.getMonth() + 1).padStart(2, '0');
  const year = messageDate.getFullYear();
  return `${day}/${month}/${year}`;
};

// Helper: Render Message Content with Code Blocks & WebAssembly Code Interpreter & Mind Maps
const renderMessageTextWithCodeBlocks = (text: string) => {
  if (!text) return null;
  const codeBlockRegex = /```([a-zA-Z0-9_\s-]*)\n([\s\S]*?)```/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex, match.index),
      });
    }

    parts.push({
      type: 'code',
      language: (match[1] || 'python').trim(),
      content: match[2],
    });

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.substring(lastIndex),
    });
  }

  if (parts.length === 0) {
    return <p className="leading-relaxed whitespace-pre-wrap">{text}</p>;
  }

  return (
    <div className="space-y-2">
      {parts.map((part, idx) => {
        if (part.type === 'code') {
          const langLower = part.language.toLowerCase();
          if (langLower.includes('paper-summarizer') || langLower.includes('papersummarizer') || langLower.includes('paper-summary')) {
            try {
              const paperData = JSON.parse(part.content.trim());
              if (paperData && (paperData.title || Array.isArray(paperData.keyFindings))) {
                return <PaperSummarizerWidget key={idx} data={paperData} />;
              }
            } catch (e) {
              console.error('[ChatView] Failed to parse paper-summarizer JSON:', e);
            }
          }
          if (langLower.includes('invoice-generator') || langLower.includes('invoicegenerator') || langLower.includes('invoice')) {
            try {
              const invoiceData = JSON.parse(part.content.trim());
              if (invoiceData && (invoiceData.invoiceNumber || invoiceData.clientName || Array.isArray(invoiceData.items))) {
                return <InvoiceWidget key={idx} invoice={invoiceData} />;
              }
            } catch (e) {
              console.error('[ChatView] Failed to parse invoice-generator JSON:', e);
            }
          }
          if (langLower.includes('sql-builder') || langLower.includes('sqlbuilder')) {
            try {
              const sqlData = JSON.parse(part.content.trim());
              if (sqlData && (sqlData.queryName || sqlData.sql)) {
                return <SqlBuilderWidget key={idx} query={sqlData} />;
              }
            } catch (e) {
              console.error('[ChatView] Failed to parse sql-builder JSON:', e);
            }
          }
          if (langLower.includes('portfolio-rebalancer') || langLower.includes('portfoliorebalancer')) {
            try {
              const portfolioData = JSON.parse(part.content.trim());
              if (portfolioData && (portfolioData.portfolioName || Array.isArray(portfolioData.items))) {
                return <PortfolioRebalancerWidget key={idx} portfolio={portfolioData} />;
              }
            } catch (e) {
              console.error('[ChatView] Failed to parse portfolio-rebalancer JSON:', e);
            }
          }
          if (langLower.includes('roadmap-planner') || langLower.includes('roadmapplanner')) {
            try {
              const roadmapData = JSON.parse(part.content.trim());
              if (roadmapData && (roadmapData.projectName || Array.isArray(roadmapData.items))) {
                return <RoadmapPlannerWidget key={idx} data={roadmapData} />;
              }
            } catch (e) {
              console.error('[ChatView] Failed to parse roadmap-planner JSON:', e);
            }
          }
          if (langLower.includes('support-ticket') || langLower.includes('supportticket')) {
            try {
              const ticketData = JSON.parse(part.content.trim());
              if (ticketData && (ticketData.ticketId || ticketData.customerName)) {
                return <SupportTicketWidget key={idx} ticket={ticketData} />;
              }
            } catch (e) {
              console.error('[ChatView] Failed to parse support-ticket JSON:', e);
            }
          }
          if (langLower.includes('interview-prep') || langLower.includes('interviewprep')) {
            try {
              const prepData = JSON.parse(part.content.trim());
              if (prepData && (prepData.targetRole || Array.isArray(prepData.questions))) {
                return <InterviewPrepWidget key={idx} prep={prepData} />;
              }
            } catch (e) {
              console.error('[ChatView] Failed to parse interview-prep JSON:', e);
            }
          }
          if (langLower.includes('pr-reviewer') || langLower.includes('prreviewer') || langLower.includes('pr-review')) {
            try {
              const reviewData = JSON.parse(part.content.trim());
              if (reviewData && (reviewData.prTitle || Array.isArray(reviewData.files))) {
                return <PRReviewerWidget key={idx} review={reviewData} />;
              }
            } catch (e) {
              console.error('[ChatView] Failed to parse pr-reviewer JSON:', e);
            }
          }
          if (langLower.includes('contract-analyzer') || langLower.includes('contractanalyzer')) {
            try {
              const analysisData = JSON.parse(part.content.trim());
              if (analysisData && (analysisData.documentTitle || Array.isArray(analysisData.risks))) {
                return <ContractAnalyzerWidget key={idx} analysis={analysisData} />;
              }
            } catch (e) {
              console.error('[ChatView] Failed to parse contract-analyzer JSON:', e);
            }
          }
          if (langLower.includes('techstack-estimator') || langLower.includes('techstackestimator') || langLower.includes('tech-stack')) {
            try {
              const estimateData = JSON.parse(part.content.trim());
              if (estimateData && (estimateData.projectName || Array.isArray(estimateData.breakdown))) {
                return <TechStackEstimatorWidget key={idx} estimate={estimateData} />;
              }
            } catch (e) {
              console.error('[ChatView] Failed to parse techstack-estimator JSON:', e);
            }
          }
          if (langLower.includes('meeting-notes') || langLower.includes('meetingnotes')) {
            try {
              const notesData = JSON.parse(part.content.trim());
              if (notesData && (notesData.title || Array.isArray(notesData.actionItems))) {
                return <MeetingNotesWidget key={idx} notes={notesData} />;
              }
            } catch (e) {
              console.error('[ChatView] Failed to parse meeting-notes JSON:', e);
            }
          }
          if (langLower.includes('vocab-builder') || langLower.includes('vocabbuilder')) {
            try {
              const vocabData = JSON.parse(part.content.trim());
              if (vocabData && (vocabData.targetLanguage || Array.isArray(vocabData.words))) {
                return <VocabBuilderWidget key={idx} data={vocabData} />;
              }
            } catch (e) {
              console.error('[ChatView] Failed to parse vocab-builder JSON:', e);
            }
          }
          if (langLower.includes('travel-plan') || langLower.includes('travelplan')) {
            try {
              const travelData = JSON.parse(part.content.trim());
              if (travelData && (travelData.destination || Array.isArray(travelData.days))) {
                return <TravelPlannerWidget key={idx} plan={travelData} />;
              }
            } catch (e) {
              console.error('[ChatView] Failed to parse travel-plan JSON:', e);
            }
          }
          if (langLower.includes('resume-optimize') || langLower.includes('resumeoptimize')) {
            try {
              const resumeData = JSON.parse(part.content.trim());
              if (resumeData && (resumeData.jobTitle || Array.isArray(resumeData.missingKeywords))) {
                return <ResumeOptimizerWidget key={idx} data={resumeData} />;
              }
            } catch (e) {
              console.error('[ChatView] Failed to parse resume-optimize JSON:', e);
            }
          }
          if (langLower.includes('meal-plan') || langLower.includes('mealplan')) {
            try {
              const mealData = JSON.parse(part.content.trim());
              if (mealData && (mealData.dayTitle || Array.isArray(mealData.meals))) {
                return <MealPlannerWidget key={idx} plan={mealData} />;
              }
            } catch (e) {
              console.error('[ChatView] Failed to parse meal-plan JSON:', e);
            }
          }
          if (langLower.includes('code-audit') || langLower.includes('codeaudit')) {
            try {
              const auditData = JSON.parse(part.content.trim());
              if (auditData && Array.isArray(auditData.issues)) {
                return <CodeAuditWidget key={idx} audit={auditData} />;
              }
            } catch (e) {
              console.error('[ChatView] Failed to parse code-audit JSON:', e);
            }
          }
          if (langLower.includes('workout-plan') || langLower.includes('workoutplan')) {
            try {
              const planData = JSON.parse(part.content.trim());
              if (planData && (planData.title || Array.isArray(planData.exercises))) {
                return <WorkoutWidget key={idx} plan={planData} />;
              }
            } catch (e) {
              console.error('[ChatView] Failed to parse workout-plan JSON:', e);
            }
          }
          if (langLower.includes('fact-check') || langLower.includes('factcheck')) {
            try {
              const factData = JSON.parse(part.content.trim());
              if (factData && factData.claim) {
                return <FactCheckWidget key={idx} fact={factData} />;
              }
            } catch (e) {
              console.error('[ChatView] Failed to parse fact-check JSON:', e);
            }
          }
          if (langLower.includes('dm-ghostwriter')) {
            try {
              const ghostwriterData = JSON.parse(part.content.trim());
              if (ghostwriterData && Array.isArray(ghostwriterData.replies)) {
                return <DMGhostwriterWidget key={idx} data={ghostwriterData} />;
              }
            } catch (e) {
              console.error('[ChatView] Failed to parse dm-ghostwriter JSON:', e);
            }
          }
          if (langLower.includes('skill-course')) {
            try {
              const courseData = JSON.parse(part.content.trim());
              if (courseData && courseData.courseTitle) {
                return <SkillCourseWidget key={idx} course={courseData} />;
              }
            } catch (e) {
              console.error('[ChatView] Failed to parse skill-course JSON:', e);
            }
          }
          if (langLower.includes('voice-summary')) {
            try {
              const voiceData = JSON.parse(part.content.trim());
              if (voiceData && Array.isArray(voiceData.bulletSummary)) {
                return <VoiceNoteSummaryWidget key={idx} summary={voiceData} />;
              }
            } catch (e) {
              console.error('[ChatView] Failed to parse voice summary JSON:', e);
            }
          }
          if (langLower.includes('story-poll')) {
            try {
              const pollData = JSON.parse(part.content.trim());
              if (pollData && pollData.question) {
                return <StoryPollWidget key={idx} poll={pollData} />;
              }
            } catch (e) {
              console.error('[ChatView] Failed to parse story poll JSON:', e);
            }
          }
          if (langLower.includes('expense-log')) {
            try {
              const expenseData = JSON.parse(part.content.trim());
              if (expenseData && expenseData.total !== undefined && Array.isArray(expenseData.items)) {
                return <ExpenseChartWidget key={idx} summary={expenseData} />;
              }
            } catch (e) {
              console.error('[ChatView] Failed to parse expense JSON:', e);
            }
          }
          if (langLower.includes('ig-grid')) {
            try {
              const postsData = JSON.parse(part.content.trim());
              if (Array.isArray(postsData)) {
                return <InstagramGridPlanner key={idx} posts={postsData} />;
              }
            } catch (e) {
              console.error('[ChatView] Failed to parse ig-grid JSON:', e);
            }
          }
          if (langLower.startsWith('mermaid') || part.content.trim().startsWith('mindmap') || part.content.trim().startsWith('graph')) {
            return <MindMapViewer key={idx} chartDefinition={part.content} />;
          }
          return <CodeBlock key={idx} code={part.content} language={part.language} />;
        }
        return (
          <p key={idx} className="leading-relaxed whitespace-pre-wrap">
            {part.content}
          </p>
        );
      })}
    </div>
  );
};

export const ChatView: React.FC<ChatViewProps> = ({
  activeConv,
  currentUser,
  isDark,
  onBack,
  onUpdateConversation,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(activeConv.messages || []);
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [vanishSeconds, setVanishSeconds] = useState<number | null>(null);

  // MENU 1: Attachment Drawer State
  const [isAttachmentOpen, setIsAttachmentOpen] = useState(false);
  const [attachmentCategory, setAttachmentCategory] = useState<'docs' | 'media' | 'legal' | 'tools'>('docs');
  const [activeAttachmentModal, setActiveAttachmentModal] = useState<string | null>(null);

  // MENU 2: Message Contextual Actions Popover State
  const [activeMsgMenuId, setActiveMsgMenuId] = useState<string | null>(null);
  const [activeMsgMenuTab, setActiveMsgMenuTab] = useState<'refine' | 'organize' | 'insights' | 'privacy'>('refine');
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editingMsgText, setEditingMsgText] = useState<string>('');
  const [pinnedMessage, setPinnedMessage] = useState<ChatMessage | null>(null);
  const [lockedMsgIds, setLockedMsgIds] = useState<string[]>([]);
  const [unlockedMsgIds, setUnlockedMsgIds] = useState<string[]>([]);
  const [passcodeModalMsgId, setPasscodeModalMsgId] = useState<string | null>(null);
  const [passcodeInput, setPasscodeInput] = useState<string>('');
  const [blurredMsgIds, setBlurredMsgIds] = useState<string[]>([]);

  // MENU 3: Room Settings Slide-Out Sidebar State
  const [isRoomMenuOpen, setIsRoomMenuOpen] = useState(false);
  const [activeRoomMenuTab, setActiveRoomMenuTab] = useState<'security' | 'efficiency' | 'visual' | 'automations'>('security');
  const [activeRoomModal, setActiveRoomModal] = useState<'barcode' | 'assets' | 'transcript' | 'crm' | 'devices' | null>(null);
  const [isRoomLocked, setIsRoomLocked] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isWatermarkActive, setIsWatermarkActive] = useState(false);
  const [isSummarizerOpen, setIsSummarizerOpen] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [roomNotification, setRoomNotification] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [presentationFont, setPresentationFont] = useState(false);
  const [compactRows, setCompactRows] = useState(false);
  const [moodWallpaper, setMoodWallpaper] = useState<'default' | 'nautical' | 'midnight' | 'cyberpunk'>('default');
  const [autoReplyBot, setAutoReplyBot] = useState(false);
  const [voiceAutoTranscribe, setVoiceAutoTranscribe] = useState(true);
  const [lowDataMode, setLowDataMode] = useState(false);

  // MENU 4: Header User Profile Card Modal State
  const [isUserProfileModalOpen, setIsUserProfileModalOpen] = useState(false);
  const [isVipPriority, setIsVipPriority] = useState(false);
  const [languageOverride, setLanguageOverride] = useState('English (US)');

  // Model Selector & Subscription Upgrade Modal States
  const [selectedModelId, setSelectedModelId] = useState<string>('gemini-2.5-flash');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState<boolean>(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState<boolean>(false);
  const [upgradeTargetModelId, setUpgradeTargetModelId] = useState<string>('claude-3-5-sonnet');
  const [isCanvasOpen, setIsCanvasOpen] = useState<boolean>(false);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);

  const handlePdfFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      showNotice(`Analyzing ${file.name} (Parsing PDF text)...`);
      const extractedText = await parseDocumentContent(file);
      const pageMatches = extractedText.match(/--- Page \d+ ---/g);
      const pages = pageMatches ? pageMatches.length : 1;

      showNotice(`Successfully parsed ${file.name} (${pages} pages). Transmitting to AI...`);

      // Format document prompt for Hymli AI
      const docPrompt = `[Document Deep-Dive: ${file.name} - ${pages} Pages]\n${extractedText.slice(0, 15000)}\n\nPlease analyze this document and summarize key insights.`;
      
      hymliAiService.askHymli(docPrompt, currentUser.id, activeConv.id);
    } catch (err: any) {
      showNotice(`PDF Error: ${err?.message || 'Failed to parse document'}`);
    } finally {
      if (e.target) e.target.value = '';
    }
  };


  const { isSubscribed } = useSubscription();

  useEffect(() => {
    if (isSubscribed && upgradeTargetModelId) {
      setSelectedModelId(upgradeTargetModelId);
      hymliAiService.setModel(upgradeTargetModelId);
      showNotice(`Payment confirmed! Active AI Model switched to ${upgradeTargetModelId}`);
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
  const [aiPromptInput, setAiPromptInput] = useState('');
  const [msgReactions, setMsgReactions] = useState<Record<string, string[]>>({});
  const [reactionPickerMsgId, setReactionPickerMsgId] = useState<string | null>(null);

  // Search & Jump to Message States
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);

  // Floating Sticky Scroll Date State
  const [floatingDate, setFloatingDate] = useState<string>('Today');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Network & WebRTC Hook
  const [pingMs, setPingMs] = useState<number>(42);
  const webrtc = useWebRTCCall(currentUser);
  const { isUserOnline } = usePresence(currentUser.id);

  const targetUserOnline = isUserOnline(activeConv.user.id);
  const targetLastSeen = activeConv.user.last_seen || activeConv.user.last_anchored;

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const showNotice = (msg: string) => {
    setRoomNotification(msg);
    setTimeout(() => {
      setRoomNotification(null);
    }, 3800);
  };

  // Subscribe to Supabase Messages
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const loadMessages = async () => {
      const fetched = await chatService.fetchMessages(currentUser.id, activeConv.user.id);
      if (fetched && fetched.length > 0) {
        setMessages(fetched);
      } else if (activeConv.messages && activeConv.messages.length > 0) {
        const formatted = activeConv.messages.map((m) => ({
          ...m,
          status: (typeof m.status === 'number' ? m.status : m.is_me ? 1 : 3) as MessageDeliveryStatus,
        }));
        setMessages(filterVanishingMessages(formatted));
      }
    };

    loadMessages();

    unsubscribe = chatService.subscribeToMessages(
      currentUser.id,
      activeConv.user.id,
      (newMsg) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          const updated = [...prev, newMsg];
          return filterVanishingMessages(updated);
        });
        if (onUpdateConversation) {
          onUpdateConversation(activeConv.id, newMsg.text, newMsg);
        }
      },
      (updatedMsg) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === updatedMsg.id ? { ...m, status: updatedMsg.status } : m))
        );
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser.id, activeConv.user.id, activeConv.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  // Scroll Observer for Floating Date Badge
  const handleScroll = () => {
    if (!chatScrollRef.current) return;
    const dateElements = chatScrollRef.current.querySelectorAll('[data-date-label]');
    let currentVisibleLabel = '';

    for (const el of Array.from(dateElements)) {
      const htmlEl = el as HTMLElement;
      const rect = htmlEl.getBoundingClientRect();
      if (rect.top <= 180) {
        currentVisibleLabel = htmlEl.getAttribute('data-date-label') || '';
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
                prev.map((m) => (m.id === msg.id ? { ...m, status: 3 } : m))
              );
              observer.disconnect();
              observerMap.current.delete(msg.id);
            }
          });
        },
        { threshold: 0.5 }
      );

      observer.observe(node);
      observerMap.current.set(msg.id, observer);
    },
    [currentUser.id]
  );

  useEffect(() => {
    const pingInterval = setInterval(() => {
      setPingMs(Math.floor(25 + Math.random() * 45));
    }, 4000);
    return () => clearInterval(pingInterval);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);

    if (val.startsWith('/')) {
      setShowAiPromptToolbar(true);
    } else if (showAiPromptToolbar && !val.startsWith('/')) {
      setShowAiPromptToolbar(false);
    }
  };

  // Send Message Handler
  const handleSendMessage = async (customType?: 'text' | 'image' | 'voice', imagePayloadUrl?: string) => {
    if (!inputText.trim() && !imagePayloadUrl) return;

    const burnAtTimestamp = vanishSeconds
      ? new Date(Date.now() + vanishSeconds * 1000).toISOString()
      : undefined;

    const msgData = {
      sender_id: currentUser.id,
      receiver_id: activeConv.user.id,
      text: inputText.trim() || (customType === 'image' ? 'Sent encrypted media stream' : ''),
      type: customType || (imagePayloadUrl ? 'image' : 'text'),
      image_url: imagePayloadUrl,
      created_at: new Date().toISOString(),
      burn_at: burnAtTimestamp,
      reply_to_id: replyingTo?.id,
      reply_preview: replyingTo
        ? {
            id: replyingTo.id,
            text: replyingTo.text,
            sender_name: replyingTo.is_me ? currentUser.full_name : activeConv.user.name,
          }
        : undefined,
    };

    const newMsg = await chatService.sendMessage(msgData);
    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
    setReplyingTo(null);
    setShowAiPromptToolbar(false);

    if (onUpdateConversation) {
      onUpdateConversation(activeConv.id, newMsg.text, newMsg);
    }

    // Hymli AI Assistant Thread Auto-Response Engine
    const isHymliThread =
      activeConv.user.id === HYMLI_AI_BOT_ID ||
      activeConv.user.name === 'Hymli AI' ||
      activeConv.id.toLowerCase().includes('hymli');

    if (isHymliThread) {
      setTimeout(async () => {
        try {
          const hymliReply = await hymliAiService.askHymli(
            newMsg.text,
            currentUser.id,
            activeConv.id,
            false
          );
          const botMsgData = {
            sender_id: activeConv.user.id,
            receiver_id: currentUser.id,
            text: hymliReply,
            created_at: new Date().toISOString(),
          };
          const botReply = await chatService.sendMessage(botMsgData);
          setMessages((prev) => [...prev, botReply]);
          if (onUpdateConversation) {
            onUpdateConversation(activeConv.id, hymliReply, botReply);
          }
        } catch (e) {
          console.warn('[ChatView] Hymli AI response generation error:', e);
        }
      }, 400);
    } else if (autoReplyBot) {
      setTimeout(async () => {
        const botMsgData = {
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
  const handleDispatchAttachment = async (title: string, detail: string, cat: string, extraData?: any) => {
    setIsAttachmentOpen(false);
    const attachmentText = `📎 [${cat.toUpperCase()}] ${title}\n▸ ${detail}`;
    const msgData = {
      sender_id: currentUser.id,
      receiver_id: activeConv.user.id,
      text: attachmentText,
      created_at: new Date().toISOString(),
      metadata: { attachmentData: extraData }
    };
    const newMsg = await chatService.sendMessage(msgData);
    setMessages((prev) => [...prev, newMsg]);
    showNotice(`Dispatched ${title}`);
  };

  // Silent Edit
  const handleSaveSilentEdit = (msgId: string) => {
    if (!editingMsgText.trim()) return;
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, text: editingMsgText, is_edited: true } : m))
    );
    setEditingMsgId(null);
    showNotice('Message Silently Edited');
  };

  // Recall / Unsend Message
  const handleUnsendMsg = async (msgId: string) => {
    await chatService.deleteMessage(msgId);
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
    setActiveMsgMenuId(null);
    showNotice('Message Recalled & Unsent');
  };

  // AI Tone Polisher with Real Ollama Integration + Clean Metadata Storage
  const handlePolishTone = async (msg: ChatMessage) => {
    setActiveMsgMenuId(null);
    showNotice('Polishing Tone via Ollama AI...');
    const res = await ollamaService.generateTonePolish(msg.text, 'Executive');

    setMessages((prev) =>
      prev.map((m) =>
        m.id === msg.id
          ? {
              ...m,
              metadata: {
                ...m.metadata,
                polishedText: res.result,
                tone: 'Executive',
              },
            }
          : m
      )
    );

    if (res.isOffline) {
      showNotice(res.error || "Ollama offline. Run OLLAMA_ORIGINS='*' ollama serve");
    } else {
      showNotice('Tone Polished Successfully');
    }
  };

  // Instant Translation with Real Ollama Integration + Clean Metadata Storage
  const handleTranslateMsg = async (msg: ChatMessage, targetLang = 'Spanish') => {
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
          : m
      )
    );

    if (res.isOffline) {
      showNotice(res.error || "Ollama offline. Run OLLAMA_ORIGINS='*' ollama serve");
    } else {
      showNotice(`Translated to ${targetLang}`);
    }
  };

  // AI Fact Check with Real Ollama Integration + Clean Metadata Storage
  const handleFactCheckMsg = async (msg: ChatMessage) => {
    setActiveMsgMenuId(null);
    showNotice('Fact-checking via Ollama AI...');
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
          : m
      )
    );

    if (res.isOffline) {
      showNotice(res.error || "Ollama offline. Run OLLAMA_ORIGINS='*' ollama serve");
    } else {
      showNotice('Fact-check Complete');
    }
  };

  // Generate AI Milestone Summary with Real Ollama Integration
  const handleGenerateAiSummary = async () => {
    setIsRoomMenuOpen(false);
    setIsSummarizerOpen(true);
    setAiSummary('Analyzing chat history via Ollama AI...');

    const msgList = messages.map((m) => `${m.is_me ? currentUser.full_name : activeConv.user.name}: ${m.text}`);
    const res = await ollamaService.summarizeChat(msgList);

    setAiSummary(res.result);
    if (res.isOffline) {
      showNotice(res.error || "Ollama offline. Run OLLAMA_ORIGINS='*' ollama serve");
    }
  };

  // Toggle Pin Message
  const handleTogglePinMsg = (msg: ChatMessage) => {
    if (pinnedMessage?.id === msg.id) {
      setPinnedMessage(null);
      showNotice('Message Unpinned');
    } else {
      setPinnedMessage(msg);
      showNotice('Message Pinned to Top');
    }
    setActiveMsgMenuId(null);
  };

  // Passcode Lock Toggle
  const handleLockMsg = (msgId: string) => {
    if (lockedMsgIds.includes(msgId)) {
      setLockedMsgIds((prev) => prev.filter((id) => id !== msgId));
      showNotice('Passcode Lock Removed');
    } else {
      setLockedMsgIds((prev) => [...prev, msgId]);
      showNotice('Passcode Lock Enabled (PIN: 1234)');
    }
    setActiveMsgMenuId(null);
  };

  const handleUnlockPasscode = () => {
    if (passcodeInput === '1234' && passcodeModalMsgId) {
      setUnlockedMsgIds((prev) => [...prev, passcodeModalMsgId]);
      setPasscodeModalMsgId(null);
      setPasscodeInput('');
      showNotice('Message Unlocked');
    } else {
      showNotice('Incorrect Passcode (Use 1234)');
    }
  };

  // Clear Chat History
  const handleClearHistory = async () => {
    await chatService.clearHistory(currentUser.id, activeConv.user.id);
    setMessages([]);
    setIsRoomMenuOpen(false);
    showNotice('Chat Canvas Cleared');
    if (onUpdateConversation) {
      onUpdateConversation(activeConv.id, '', undefined, true);
    }
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
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
      showNotice('🔊 Reading Message Aloud');
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

  // Wallpaper Styles
  const getWallpaperStyle = () => {
    switch (moodWallpaper) {
      case 'nautical':
        return 'bg-gradient-to-b from-slate-950 via-cyan-950/40 to-slate-950';
      case 'midnight':
        return 'bg-gradient-to-b from-slate-950 via-indigo-950/40 to-slate-950';
      case 'cyberpunk':
        return 'bg-gradient-to-b from-slate-950 via-purple-950/40 to-slate-950';
      default:
        return 'bg-slate-950/60';
    }
  };

  return (
    <div className={`flex-1 flex flex-col h-full ${getWallpaperStyle()} relative overflow-hidden select-none`}>
      {/* WebRTC Call Overlay */}
      {(webrtc.callState !== 'idle' || webrtc.incomingCall) && (
        <CallOverlay
          activeCall={webrtc.callState !== 'idle' ? { user: webrtc.targetUser || activeConv.user, type: webrtc.callType } : null}
          callDuration={webrtc.callDuration}
          isMuted={webrtc.isMuted}
          isVideoOff={webrtc.isCameraOff}
          localStream={webrtc.localStream}
          remoteStream={webrtc.remoteStream}
          onEndCall={webrtc.endCall}
          onToggleMute={webrtc.toggleMute}
          onToggleVideo={webrtc.toggleCamera}
        />
      )}

      {/* Attachment Modals */}
      <AttachmentModals
        type={activeAttachmentModal}
        onClose={() => setActiveAttachmentModal(null)}
        onDispatch={handleDispatchAttachment}
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
        isVip={isVipPriority}
        onToggleVip={() => {
          setIsVipPriority(!isVipPriority);
          showNotice(isVipPriority ? 'VIP Priority Removed' : 'VIP Gold Priority Enabled');
        }}
        languageOverride={languageOverride}
        onChangeLanguage={(lang) => setLanguageOverride(lang)}
        onNotice={showNotice}
      />

      {/* M-Pesa Subscription & AI Model Upgrade Modal */}
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        userEmail={currentUser.username ? `${currentUser.username}@hymli.com` : 'user@hymli.com'}
        userId={currentUser.id}
        selectedModelId={upgradeTargetModelId}
        onSuccessUnlock={(unlockedModelId) => {
          setSelectedModelId(unlockedModelId);
          hymliAiService.setModel(unlockedModelId);
          const modelObj = AVAILABLE_MODELS.find((m) => m.id === unlockedModelId);
          showNotice(`Model Unlocked & Switched to ${modelObj?.name || unlockedModelId}`);
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
                  activeConv.id
                );
              }}
              onSaveCanvas={() => {
                showNotice('Canvas exported as PNG');
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
              CONFIDENTIAL • {currentUser.full_name.toUpperCase()} • E2EE WATERMARK
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
            <span className="font-bold">{selectedMsgIds.length} Messages Selected</span>
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
        <div className="p-3 px-4 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-xl flex flex-col gap-2 z-20 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {onBack && (
                <button
                  onClick={onBack}
                  className="md:hidden p-2 rounded-xl text-slate-400 hover:bg-slate-800 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}

              {/* User Avatar - Clicking opens MENU 4 User Profile Card */}
              <div
                onClick={() => setIsUserProfileModalOpen(true)}
                className="relative cursor-pointer group"
                title="View User Profile Card"
              >
                <img
                  src={activeConv.user.avatar}
                  alt={activeConv.user.name}
                  className={`w-10 h-10 rounded-full object-cover border-2 transition-all ${
                    isVipPriority
                      ? 'border-amber-400 ring-2 ring-amber-400/50 scale-105'
                      : 'border-white/20 group-hover:border-cyan-400'
                  }`}
                />
                <span
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0b101b] ${
                    targetUserOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                  }`}
                />
              </div>

              {/* Name & Dynamic Nautical Presence */}
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3
                    onClick={() => setIsUserProfileModalOpen(true)}
                    className="font-bold text-sm sm:text-base text-slate-100 hover:text-cyan-300 cursor-pointer transition-colors"
                  >
                    {activeConv.user.name}
                  </h3>
                  {isVipPriority && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      VIP
                    </span>
                  )}

                  {/* Model Selector Header Dropdown */}
                  <div className="relative z-30">
                    <button
                      onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                      className="px-2.5 py-0.5 rounded-lg bg-slate-800/90 hover:bg-slate-800 border border-cyan-500/30 text-[11px] text-cyan-300 font-semibold flex items-center gap-1.5 hover:border-cyan-400 transition cursor-pointer shadow-sm"
                      title="Select Active AI Model & Fleet Tier"
                    >
                      <Sparkles className="w-3 h-3 text-cyan-400 fill-cyan-400/30 shrink-0" />
                      <span className="truncate max-w-[120px] sm:max-w-[170px]">
                        {AVAILABLE_MODELS.find((m) => m.id === selectedModelId)?.name || 'Hymli AI Core'}
                      </span>
                      <ChevronDown
                        className={`w-3 h-3 text-cyan-400 transition-transform duration-200 ${
                          isModelDropdownOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {isModelDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1.5 w-72 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl">
                        <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 mb-1 flex items-center justify-between">
                          <span>Active Fleet AI Model</span>
                          <span className="text-cyan-400 font-mono">M-Pesa Tier</span>
                        </div>
                        <div className="space-y-1">
                          {AVAILABLE_MODELS.map((model) => {
                            const isActive = selectedModelId === model.id;
                            return (
                              <button
                                key={model.id}
                                onClick={() => handleSelectModel(model)}
                                className={`w-full text-left px-3 py-2 rounded-xl transition flex items-center justify-between gap-2 cursor-pointer ${
                                  isActive
                                    ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-200 font-bold'
                                    : 'hover:bg-slate-800/80 text-slate-200'
                                }`}
                              >
                                <div className="flex flex-col gap-0.5">
                                  <div className="text-xs font-semibold flex items-center gap-1.5">
                                    <span>{model.name}</span>
                                    {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    {model.isFree ? '100% Free • Unlimited' : `${model.priceLabel} • High Reasoning`}
                                  </div>
                                </div>
                                <div className="shrink-0">
                                  {model.isFree ? (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                      FREE
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                      <Lock className="w-2.5 h-2.5" /> {model.priceLabel}
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {targetUserOnline ? (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="font-semibold">🟢 Anchored</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mt-0.5">
                      <span>{formatNauticalPresence(false, targetLastSeen)}</span>
                    </div>
                  )}

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 flex items-center gap-1">
                    <Activity className="w-3 h-3 text-cyan-400" />
                    <span>Harmonious 98%</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsCanvasOpen(true)}
                className="p-2 rounded-xl text-slate-300 hover:text-cyan-400 hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1"
                title="Interactive Multimodal Canvas (Sketch / Mind Map / Magic Erase)"
              >
                <Palette className="w-4 h-4 text-cyan-400" />
              </button>

              <button
                onClick={() => webrtc.startCall(activeConv.user, 'audio')}
                className="p-2 rounded-xl text-slate-300 hover:text-cyan-400 hover:bg-slate-800 transition-colors cursor-pointer"
                title="Voice Call"
              >
                <Phone className="w-4 h-4" />
              </button>


              <button
                onClick={() => webrtc.startCall(activeConv.user, 'video')}
                className="p-2 rounded-xl text-slate-300 hover:text-indigo-400 hover:bg-slate-800 transition-colors cursor-pointer"
                title="Video Call"
              >
                <Video className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsSearching(!isSearching)}
                className="p-2 rounded-xl text-slate-300 hover:text-cyan-400 hover:bg-slate-800 transition-colors cursor-pointer"
                title="Search Messages"
              >
                <Search className="w-4 h-4" />
              </button>

              {/* MENU 3: Top-Right Room Settings Toggle */}
              <button
                onClick={() => setIsRoomMenuOpen(!isRoomMenuOpen)}
                className="p-2 rounded-xl text-slate-300 hover:text-cyan-400 hover:bg-slate-800 transition-colors cursor-pointer"
                title="Room Controls & Security"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search Bar Dropdown */}
          <AnimatePresence>
            {isSearching && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-2 border-t border-slate-800/80 flex items-center gap-2"
              >
                <div className="flex-1 relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Deep search transcript..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:outline-none text-slate-100"
                  />
                </div>
                <button
                  onClick={() => {
                    setIsSearching(false);
                    setSearchQuery('');
                  }}
                  className="p-1.5 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pinned Message Bar */}
          {pinnedMessage && (
            <div className="flex items-center justify-between p-2 px-3 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-xs">
              <div className="flex items-center gap-2 truncate">
                <Pin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="font-bold text-cyan-300 shrink-0">Pinned:</span>
                <span className="text-slate-200 truncate">{pinnedMessage.text}</span>
              </div>
              <button
                onClick={() => setPinnedMessage(null)}
                className="text-slate-400 hover:text-white shrink-0 ml-2"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* MENU 3: SLIDE-OUT ROOM CONTROLS SIDEBAR */}
      <AnimatePresence>
        {isRoomMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="absolute top-0 right-0 bottom-0 w-80 bg-slate-900 border-l border-slate-800 shadow-2xl z-40 p-4 flex flex-col gap-4 text-xs overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-sm text-white">Room Controls & Security</h3>
              </div>
              <button
                onClick={() => setIsRoomMenuOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Menu 3 Category Tabs */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <button
                onClick={() => setActiveRoomMenuTab('security')}
                className={`px-2 py-1 rounded-lg font-bold ${
                  activeRoomMenuTab === 'security' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'
                }`}
              >
                Security
              </button>
              <button
                onClick={() => setActiveRoomMenuTab('efficiency')}
                className={`px-2 py-1 rounded-lg font-bold ${
                  activeRoomMenuTab === 'efficiency' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400'
                }`}
              >
                Efficiency
              </button>
              <button
                onClick={() => setActiveRoomMenuTab('visual')}
                className={`px-2 py-1 rounded-lg font-bold ${
                  activeRoomMenuTab === 'visual' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400'
                }`}
              >
                Visual
              </button>
              <button
                onClick={() => setActiveRoomMenuTab('automations')}
                className={`px-2 py-1 rounded-lg font-bold ${
                  activeRoomMenuTab === 'automations' ? 'bg-purple-500/20 text-purple-300' : 'text-slate-400'
                }`}
              >
                Auto
              </button>
            </div>

            {/* SECURITY CONTROLS */}
            {activeRoomMenuTab === 'security' && (
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setIsRoomLocked(!isRoomLocked);
                    showNotice(isRoomLocked ? 'Room Unlocked' : 'Room Lockdown Engaged');
                  }}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-slate-200 hover:border-cyan-500/50"
                >
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-rose-400" />
                    <span>Room Lockdown State</span>
                  </div>
                  <span className={`font-bold ${isRoomLocked ? 'text-rose-400' : 'text-slate-500'}`}>
                    {isRoomLocked ? 'ON' : 'OFF'}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setIsWatermarkActive(!isWatermarkActive);
                    showNotice(isWatermarkActive ? 'Watermark Disabled' : 'Watermark Leak Shield Active');
                  }}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-slate-200 hover:border-cyan-500/50"
                >
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    <span>Watermark Leak Shield</span>
                  </div>
                  <span className={`font-bold ${isWatermarkActive ? 'text-cyan-400' : 'text-slate-500'}`}>
                    {isWatermarkActive ? 'ON' : 'OFF'}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setIsRoomMenuOpen(false);
                    setActiveRoomModal('barcode');
                  }}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-slate-200 hover:border-cyan-500/50"
                >
                  <QrCode className="w-4 h-4 text-emerald-400" />
                  <span>Cryptographic Security Barcode</span>
                </button>

                <button
                  onClick={handleClearHistory}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-rose-300 hover:border-rose-500/50"
                >
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  <span>Clear Chat Canvas</span>
                </button>
              </div>
            )}

            {/* EFFICIENCY CONTROLS */}
            {activeRoomMenuTab === 'efficiency' && (
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setIsRoomMenuOpen(false);
                    setActiveRoomModal('transcript');
                  }}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-slate-200 hover:border-indigo-500/50"
                >
                  <Download className="w-4 h-4 text-indigo-400" />
                  <span>Export PDF Transcript</span>
                </button>

                <button
                  onClick={() => {
                    setIsRoomMenuOpen(false);
                    setActiveRoomModal('assets');
                  }}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-slate-200 hover:border-indigo-500/50"
                >
                  <FolderPlus className="w-4 h-4 text-amber-400" />
                  <span>Shared Asset Vault</span>
                </button>

                <button
                  onClick={handleGenerateAiSummary}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-slate-200 hover:border-indigo-500/50"
                >
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Ollama AI Milestone Summary</span>
                </button>
              </div>
            )}

            {/* VISUAL CONTROLS */}
            {activeRoomMenuTab === 'visual' && (
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setFocusMode(!focusMode);
                    showNotice(focusMode ? 'Focus Mode Disabled' : 'Focus Mode Enabled');
                  }}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-slate-200"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>Focus Canvas Mode</span>
                  </div>
                  <span className={`font-bold ${focusMode ? 'text-amber-400' : 'text-slate-500'}`}>
                    {focusMode ? 'ON' : 'OFF'}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setPresentationFont(!presentationFont);
                    showNotice(presentationFont ? 'Sans Font Active' : 'Serif Font Active');
                  }}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-slate-200"
                >
                  <div className="flex items-center gap-2">
                    <Type className="w-4 h-4 text-cyan-400" />
                    <span>Presentation Serif Typography</span>
                  </div>
                  <span className={`font-bold ${presentationFont ? 'text-cyan-400' : 'text-slate-500'}`}>
                    {presentationFont ? 'ON' : 'OFF'}
                  </span>
                </button>

                <button
                  onClick={() => {
                    const wallpapers: ('default' | 'nautical' | 'midnight' | 'cyberpunk')[] = ['default', 'nautical', 'midnight', 'cyberpunk'];
                    const nextWP = wallpapers[(wallpapers.indexOf(moodWallpaper) + 1) % wallpapers.length];
                    setMoodWallpaper(nextWP);
                    showNotice(`Wallpaper: ${nextWP.toUpperCase()}`);
                  }}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-slate-200"
                >
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-purple-400" />
                    <span>Mood Wallpaper Theme</span>
                  </div>
                  <span className="font-bold text-purple-300 uppercase">{moodWallpaper}</span>
                </button>
              </div>
            )}

            {/* AUTOMATIONS */}
            {activeRoomMenuTab === 'automations' && (
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setAutoReplyBot(!autoReplyBot);
                    showNotice(autoReplyBot ? 'Auto-Reply Disabled' : 'Auto-Reply Bot Active');
                  }}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-slate-200"
                >
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-indigo-400" />
                    <span>Auto-Reply Bot</span>
                  </div>
                  <span className={`font-bold ${autoReplyBot ? 'text-indigo-400' : 'text-slate-500'}`}>
                    {autoReplyBot ? 'ON' : 'OFF'}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setIsRoomMenuOpen(false);
                    setActiveRoomModal('crm');
                  }}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-slate-200 hover:border-purple-500/50"
                >
                  <Briefcase className="w-4 h-4 text-emerald-400" />
                  <span>CRM Deal Status Pipeline</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

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
                  <h3 className="font-bold text-lg text-white">Ollama AI Executive Summary</h3>
                  <p className="text-xs text-slate-400">Synthesized key points from transcript</p>
                </div>
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                {aiSummary || 'Synthesizing...'}
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
        className={`flex-1 p-4 overflow-y-auto ${compactRows ? 'space-y-2' : 'space-y-4'} relative pb-28`}
      >
        <div className="text-center my-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider bg-slate-900/90 border border-slate-800 text-cyan-400">
            <Lock className="w-3 h-3 text-cyan-400" />
            E2EE Nautical Encrypted Stream
          </span>
        </div>

        {messages.map((msg, index) => {
          const msgDateLabel = getMessageDateLabel(msg.created_at);
          const prevMsgDateLabel = index > 0 ? getMessageDateLabel(messages[index - 1].created_at) : null;
          const showDateDivider = msgDateLabel !== prevMsgDateLabel;
          const isHighlighted = highlightedMsgId === msg.id;
          const isMenuOpen = activeMsgMenuId === msg.id;
          const isPasscodeLocked = lockedMsgIds.includes(msg.id) && !unlockedMsgIds.includes(msg.id);
          const isBlurred = blurredMsgIds.includes(msg.id);
          const reactions = msgReactions[msg.id] || [];

          return (
            <React.Fragment key={msg.id}>
              {/* Date Divider */}
              {showDateDivider && (
                <div data-date-label={msgDateLabel} className="flex justify-center my-3">
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-slate-900/80 border border-slate-800 text-slate-400 uppercase tracking-wider">
                    {msgDateLabel}
                  </span>
                </div>
              )}

              <div
                id={`msg-${msg.id}`}
                ref={(node) => observeMessageRef(node, msg)}
                onDoubleClick={() => handleDoubleTap(msg.id)}
                className={`flex flex-col ${msg.is_me ? 'items-end' : 'items-start'} group transition-all duration-300 relative ${
                  isHighlighted ? 'scale-105 ring-2 ring-cyan-400 rounded-2xl p-1' : ''
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
                      msg.is_me
                        ? 'bg-indigo-950/60 border-cyan-400 text-indigo-200'
                        : 'bg-slate-800/80 border-indigo-400 text-slate-300'
                    }`}
                  >
                    <span className="font-bold text-cyan-300">{msg.reply_preview.sender_name}: </span>
                    <span className="truncate">{msg.reply_preview.text}</span>
                  </div>
                )}

                {/* Message Bubble Container */}
                {msg.type === 'call_log' ? (
                  <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs font-mono">
                    {msg.call_info?.status === 'missed' ? (
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
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="relative flex items-center gap-1 max-w-[85%] sm:max-w-md">
                    {/* MENU 2: Message Contextual Menu Button */}
                    <button
                      onClick={() => setActiveMsgMenuId(isMenuOpen ? null : msg.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white transition-opacity cursor-pointer shrink-0"
                      title="Message Actions & Insights"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>

                    <div
                      className={`relative w-full ${compactRows ? 'p-2.5' : 'p-3.5'} rounded-2xl text-sm shadow-xl transition-all ${
                        presentationFont ? 'font-serif' : ''
                      } ${
                        msg.is_me
                          ? 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-cyan-700 text-white rounded-br-none'
                          : 'bg-slate-900 text-slate-100 rounded-bl-none border border-slate-800'
                      } ${isBlurred ? 'filter blur-sm hover:filter-none transition-all' : ''}`}
                    >
                      {/* Passcode Lock Shroud */}
                      {isPasscodeLocked ? (
                        <div
                          onClick={() => setPasscodeModalMsgId(msg.id)}
                          className="p-4 bg-slate-950/90 rounded-xl border border-amber-500/40 flex flex-col items-center gap-2 cursor-pointer text-center"
                        >
                          <Lock className="w-6 h-6 text-amber-400 animate-bounce" />
                          <span className="text-xs font-bold text-amber-300">Protected Message Bubble</span>
                          <span className="text-[10px] text-slate-400">Click to enter passcode (Try 1234)</span>
                        </div>
                      ) : (
                        <>
                          {/* Image Attachment */}
                          {msg.image_url && (
                            <div className="relative mb-2 rounded-xl overflow-hidden border border-white/10 group/img">
                              <img
                                src={msg.image_url}
                                alt="Encrypted attachment"
                                className="w-full max-h-60 object-cover"
                              />
                              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-[10px] text-cyan-300 font-mono flex items-center gap-1 shadow-lg">
                                <Lock className="w-3 h-3 text-cyan-400" />
                                <span>Encrypted Stream</span>
                              </div>
                            </div>
                          )}

                          {/* Inline Silent Editing Form */}
                          {editingMsgId === msg.id ? (
                            <div className="space-y-2">
                              <textarea
                                value={editingMsgText}
                                onChange={(e) => setEditingMsgText(e.target.value)}
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
                              {/* Raw Message Text or Polished Text with Code Block Execution */}
                              {renderMessageTextWithCodeBlocks(msg.metadata?.polishedText || msg.text)}

                              {/* Separate Overlay: Translation */}
                              {msg.metadata?.translation && (
                                <div className="mt-2 p-2 rounded-xl bg-slate-950/80 border border-indigo-500/40 text-xs text-indigo-200 flex flex-col gap-1">
                                  <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-400">
                                    <Globe className="w-3 h-3" />
                                    <span>{msg.metadata.translatedLang || 'Spanish'} Translation</span>
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
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>

                            {msg.is_me && (
                              <MessageStatus
                                status={msg.status}
                                isRead={msg.is_read}
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
                          {['👍', '❤️', '🔥', '👏', '🚀', '😂'].map((emoji) => (
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
                            msg.is_me ? 'right-0' : 'left-0'
                          } z-50 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 space-y-2 text-xs`}
                        >
                          {/* Menu 2 Category Tabs */}
                          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                            <button
                              onClick={() => setActiveMsgMenuTab('refine')}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                                activeMsgMenuTab === 'refine' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400'
                              }`}
                            >
                              Refine
                            </button>
                            <button
                              onClick={() => setActiveMsgMenuTab('organize')}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                                activeMsgMenuTab === 'organize' ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400'
                              }`}
                            >
                              Organize
                            </button>
                            <button
                              onClick={() => setActiveMsgMenuTab('insights')}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                                activeMsgMenuTab === 'insights' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400'
                              }`}
                            >
                              Insights
                            </button>
                            <button
                              onClick={() => setActiveMsgMenuTab('privacy')}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                                activeMsgMenuTab === 'privacy' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400'
                              }`}
                            >
                              Privacy
                            </button>
                          </div>

                          {/* TAB 1: REFINEMENT */}
                          {activeMsgMenuTab === 'refine' && (
                            <div className="space-y-1">
                              {msg.is_me && (
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
                                onClick={() => handleTranslateMsg(msg, 'Spanish')}
                                className="w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800 text-slate-200 text-left"
                              >
                                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                                <span>Ollama Translate</span>
                              </button>
                            </div>
                          )}

                          {/* TAB 2: ORGANIZATION */}
                          {activeMsgMenuTab === 'organize' && (
                            <div className="space-y-1">
                              <button
                                onClick={() => handleTogglePinMsg(msg)}
                                className="w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800 text-slate-200 text-left"
                              >
                                <Pin className="w-3.5 h-3.5 text-cyan-400" />
                                <span>{pinnedMessage?.id === msg.id ? 'Unpin' : 'Pin to Top'}</span>
                              </button>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(msg.text);
                                  setActiveMsgMenuId(null);
                                  showNotice('Copied Pure Text');
                                }}
                                className="w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800 text-slate-200 text-left"
                              >
                                <Copy className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Copy Text</span>
                              </button>
                            </div>
                          )}

                          {/* TAB 3: INSIGHTS */}
                          {activeMsgMenuTab === 'insights' && (
                            <div className="space-y-1">
                              <button
                                onClick={() => handleFactCheckMsg(msg)}
                                className="w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800 text-slate-200 text-left"
                              >
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Ollama AI Fact-Check</span>
                              </button>
                              <div className="p-1.5 rounded-lg bg-slate-950 text-[10px] text-slate-400 font-mono">
                                Delivered: {new Date(msg.created_at).toLocaleTimeString()}
                              </div>
                            </div>
                          )}

                          {/* TAB 4: PRIVACY */}
                          {activeMsgMenuTab === 'privacy' && (
                            <div className="space-y-1">
                              <button
                                onClick={() => handleLockMsg(msg.id)}
                                className="w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800 text-amber-300 text-left"
                              >
                                <Lock className="w-3.5 h-3.5 text-amber-400" />
                                <span>{lockedMsgIds.includes(msg.id) ? 'Remove Lock' : 'Passcode Lock'}</span>
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

        <div ref={messagesEndRef} />
      </div>

      {/* 4. BOTTOM INPUT BAR & MENU 1 (+) GLASSMORPHIC DRAWER */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/90 backdrop-blur-xl z-20 shrink-0 space-y-2">
        {/* Reply Bar */}
        {replyingTo && (
          <div className="flex items-center justify-between p-2 px-3 rounded-xl bg-slate-800 text-xs text-slate-200 border-l-2 border-cyan-400">
            <div className="truncate">
              <span className="font-bold text-cyan-300">Replying to {replyingTo.is_me ? 'yourself' : activeConv.user.name}: </span>
              <span className="truncate opacity-80">{replyingTo.text}</span>
            </div>
            <button onClick={() => setReplyingTo(null)} className="text-slate-400 hover:text-white ml-2">
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
                <span className="text-xs font-bold text-cyan-300">Dispatch Attachment Drawer</span>
                <div className="flex items-center gap-1">
                  {(['docs', 'media', 'legal', 'tools'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setAttachmentCategory(cat)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold capitalize ${
                        attachmentCategory === cat ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                  <button onClick={() => setIsAttachmentOpen(false)} className="p-1 text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* DRAWER BUTTONS */}
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-[11px]">
                {attachmentCategory === 'docs' && (
                  <>
                    <button
                      onClick={() => {
                        setIsAttachmentOpen(false);
                        setActiveAttachmentModal('doc');
                      }}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center gap-1.5 hover:border-cyan-500/50 text-slate-200"
                    >
                      <FileText className="w-5 h-5 text-cyan-400" />
                      <span>Document</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsAttachmentOpen(false);
                        setActiveAttachmentModal('spreadsheet');
                      }}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center gap-1.5 hover:border-emerald-500/50 text-slate-200"
                    >
                      <Table className="w-5 h-5 text-emerald-400" />
                      <span>Spreadsheet</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsAttachmentOpen(false);
                        setActiveAttachmentModal('expire');
                      }}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center gap-1.5 hover:border-amber-500/50 text-slate-200"
                    >
                      <Clock className="w-5 h-5 text-amber-400" />
                      <span>Auto-Expire</span>
                    </button>

                    <button
                      onClick={() => handleDispatchAttachment('Cloud Drive Backup', 'Google Drive Shared Key', 'docs')}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center gap-1.5 hover:border-indigo-500/50 text-slate-200"
                    >
                      <FolderPlus className="w-5 h-5 text-indigo-400" />
                      <span>Cloud Drive</span>
                    </button>

                    <button
                      onClick={() => handleDispatchAttachment('Zip Package', 'Archive_Project_2026.zip', 'docs')}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center gap-1.5 hover:border-purple-500/50 text-slate-200"
                    >
                      <Archive className="w-5 h-5 text-purple-400" />
                      <span>Zip Package</span>
                    </button>
                  </>
                )}

                {attachmentCategory === 'media' && (
                  <>
                    <button
                      onClick={() => {
                        handleSendMessage('image', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80');
                        setIsAttachmentOpen(false);
                      }}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center gap-1.5 hover:border-cyan-500/50 text-slate-200"
                    >
                      <ImageIcon className="w-5 h-5 text-cyan-400" />
                      <span>Photo Roll</span>
                    </button>

                    <button
                      onClick={() => handleDispatchAttachment('Encrypted Audio Note', 'Duration: 01:24', 'media')}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center gap-1.5 hover:border-amber-500/50 text-slate-200"
                    >
                      <Mic className="w-5 h-5 text-amber-400" />
                      <span>Audio Note</span>
                    </button>

                    <button
                      onClick={() => handleDispatchAttachment('Video Stream', '1080p Nautical Log', 'media')}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center gap-1.5 hover:border-purple-500/50 text-slate-200"
                    >
                      <Film className="w-5 h-5 text-purple-400" />
                      <span>Video Note</span>
                    </button>
                  </>
                )}

                {attachmentCategory === 'legal' && (
                  <>
                    <button
                      onClick={() => {
                        setIsAttachmentOpen(false);
                        setActiveAttachmentModal('invoice');
                      }}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center gap-1.5 hover:border-emerald-500/50 text-slate-200"
                    >
                      <DollarSign className="w-5 h-5 text-emerald-400" />
                      <span>Invoice</span>
                    </button>

                    <button
                      onClick={() => handleDispatchAttachment('Corporate NDA', 'Sign & Return Lock', 'legal')}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center gap-1.5 hover:border-indigo-500/50 text-slate-200"
                    >
                      <ShieldCheck className="w-5 h-5 text-indigo-400" />
                      <span>Corporate NDA</span>
                    </button>
                  </>
                )}

                {attachmentCategory === 'tools' && (
                  <>
                    <button
                      onClick={() => {
                        setIsAttachmentOpen(false);
                        setActiveAttachmentModal('poll');
                      }}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center gap-1.5 hover:border-purple-500/50 text-slate-200"
                    >
                      <Vote className="w-5 h-5 text-purple-400" />
                      <span>Survey Poll</span>
                    </button>

                    <button
                      onClick={() => handleDispatchAttachment('Live GPS Pin', 'Lat: 37.7749, Lon: -122.4194', 'tools')}
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

        {/* INPUT CONTROL FIELD */}
        <div className="flex items-center gap-2">
          {/* MENU 1 (+) ATTACHMENT DRAWER TOGGLE */}
          <button
            onClick={() => setIsAttachmentOpen(!isAttachmentOpen)}
            className={`p-2.5 rounded-2xl transition-all cursor-pointer ${
              isAttachmentOpen ? 'bg-cyan-500 text-slate-950 rotate-45' : 'bg-slate-800 text-cyan-400 hover:bg-slate-700'
            }`}
            title="Dispatch Attachment Drawer"
          >
            <Plus className="w-5 h-5" />
          </button>

          {/* CREATIVE CANVAS BUTTON */}
          <button
            onClick={() => setIsCanvasOpen(true)}
            className="p-2.5 rounded-2xl bg-slate-800 text-cyan-400 hover:bg-slate-700 transition-all cursor-pointer"
            title="Open Creative Canvas (Sketch / Mind Map / Magic Erase)"
          >
            🎨
          </button>

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

          <input
            type="text"
            placeholder="Type encrypted message or / for AI prompts..."
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            className="flex-1 p-2.5 px-4 rounded-2xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:outline-none text-sm text-slate-100 placeholder-slate-500"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim()}
            className="p-2.5 rounded-2xl bg-cyan-500 text-slate-950 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20 font-bold"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
