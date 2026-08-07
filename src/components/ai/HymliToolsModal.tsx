import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  ChevronLeft,
  Cpu,
  Bot,
  Sparkles,
  Sliders,
  MessageSquare,
  Brain,
  Volume2,
  Image as ImageIcon,
  Code2,
  FileText,
  Languages,
  BarChart2,
  CheckCircle2,
  Anchor,
  Zap,
  Boxes,
  History,
  Trash2,
  Save,
  Mic,
  Gauge,
  KeyRound,
  RefreshCw,
  ListChecks,
  Forward,
  Globe,
  Eye,
  Rocket,
  Server,
  Palette,
  Wrench,
  Briefcase,
  Coffee,
  Waves,
  Terminal,
  Feather,
  Lock,
  User,
  Plus,
  Camera,
} from "lucide-react";
import { Profile } from "../../types";
import { hymliAiService } from "../../services/hymliAiService";
import { supabase } from "../../lib/supabase";

type ToolsView =
  | "hub"
  | "modelSelection"
  | "tonePersona"
  | "autoReply"
  | "contextMemory"
  | "voiceSynthesis"
  | "imagePreset"
  | "codeRefactor"
  | "summarization"
  | "translation"
  | "usageStats";

interface HymliToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Profile;
  onOpenUpgrade?: () => void;
}

/* ------------------------- Tile Definitions ------------------------- */
interface TileDef {
  key: string;
  label: string;
  desc: string;
  icon: React.ReactNode;
  gradient: string;
}

const TILES: TileDef[] = [
  {
    key: "modelSelection",
    label: "Model Selection",
    desc: "Choose AI engine",
    icon: <Cpu className="w-6 h-6" />,
    gradient:
      "from-indigo-500/20 to-blue-500/10 border-indigo-500/30 text-indigo-400",
  },
  {
    key: "tonePersona",
    label: "Tone & Persona",
    desc: "Adjust AI voice",
    icon: <Sliders className="w-6 h-6" />,
    gradient: "from-cyan-500/20 to-sky-500/10 border-cyan-500/30 text-cyan-400",
  },
  {
    key: "autoReply",
    label: "Auto-Reply Assistant",
    desc: "Smart replies when away",
    icon: <MessageSquare className="w-6 h-6" />,
    gradient:
      "from-emerald-500/20 to-green-500/10 border-emerald-500/30 text-emerald-400",
  },
  {
    key: "contextMemory",
    label: "Context Memory",
    desc: "Manage conversation log",
    icon: <Brain className="w-6 h-6" />,
    gradient:
      "from-purple-500/20 to-violet-500/10 border-purple-500/30 text-purple-400",
  },
  {
    key: "voiceSynthesis",
    label: "Voice Synthesis",
    desc: "TTS voice & speed",
    icon: <Volume2 className="w-6 h-6" />,
    gradient:
      "from-pink-500/20 to-rose-500/10 border-pink-500/30 text-pink-400",
  },
  {
    key: "imagePreset",
    label: "Image Generation",
    desc: "Style & aspect presets",
    icon: <ImageIcon className="w-6 h-6" />,
    gradient:
      "from-amber-500/20 to-yellow-500/10 border-amber-500/30 text-amber-400",
  },
  {
    key: "codeRefactor",
    label: "Code Refactor Tool",
    desc: "Slash commands for code",
    icon: <Code2 className="w-6 h-6" />,
    gradient:
      "from-teal-500/20 to-cyan-500/10 border-teal-500/30 text-teal-400",
  },
  {
    key: "summarization",
    label: "Chat Summarization",
    desc: "Summary prompt settings",
    icon: <FileText className="w-6 h-6" />,
    gradient: "from-blue-500/20 to-sky-500/10 border-blue-500/30 text-blue-400",
  },
  {
    key: "translation",
    label: "Translation Copilot",
    desc: "Auto-translate messages",
    icon: <Languages className="w-6 h-6" />,
    gradient: "from-rose-500/20 to-red-500/10 border-rose-500/30 text-rose-400",
  },
  {
    key: "usageStats",
    label: "Usage & Token Stats",
    desc: "API metrics dashboard",
    icon: <BarChart2 className="w-6 h-6" />,
    gradient:
      "from-slate-500/20 to-zinc-500/10 border-slate-500/30 text-slate-300",
  },
];

/* ------------------------- Sample Data ------------------------- */
const MODELS = [
  {
    id: "hymli-flash",
    name: "Hymli Flash 2.5",
    desc: "Fast & free core engine",
    badge: "FREE",
    color: "text-sky-400",
    icon: <Zap className="w-4 h-4" />,
  },
  {
    id: "hymli-pro",
    name: "Hymli Pro 1.5",
    desc: "Premium reasoning model",
    badge: "PRO",
    color: "text-amber-400",
    icon: <Rocket className="w-4 h-4" />,
  },
  {
    id: "ollama-local",
    name: "Local Ollama Instance",
    desc: "Run offline on your machine",
    badge: "LOCAL",
    color: "text-emerald-400",
    icon: <Server className="w-4 h-4" />,
  },
  {
    id: "custom-api",
    name: "Custom API Key",
    desc: "Bring your own provider key",
    badge: "BYOK",
    color: "text-pink-400",
    icon: <KeyRound className="w-4 h-4" />,
  },
];

const PERSONAS = [
  {
    key: "professional",
    label: "Professional",
    desc: "Formal executive tone",
    icon: <Briefcase className="w-4 h-4 text-indigo-400" />,
  },
  {
    key: "casual",
    label: "Casual",
    desc: "Relaxed, friendly vibe",
    icon: <Coffee className="w-4 h-4 text-amber-400" />,
  },
  {
    key: "nautical",
    label: "Nautical / Anchored",
    desc: "Ocean captain persona",
    icon: <Anchor className="w-4 h-4 text-cyan-400" />,
  },
  {
    key: "technical",
    label: "Technical Developer",
    desc: "Precise, code-savvy",
    icon: <Terminal className="w-4 h-4 text-emerald-400" />,
  },
  {
    key: "creative",
    label: "Creative Scribe",
    desc: "Imaginative storyteller",
    icon: <Feather className="w-4 h-4 text-pink-400" />,
  },
];

const CODE_COMMANDS = [
  {
    key: "explain",
    command: "/explain-code",
    desc: "Explain what this code does",
    sample:
      "Explains the purpose, logic, and flow of the selected code snippet.",
  },
  {
    key: "bugs",
    command: "/fix-bugs",
    desc: "Identify & fix bugs",
    sample: "Scans code for bugs, edge cases, and suggests fixes.",
  },
  {
    key: "types",
    command: "/add-typescript-types",
    desc: "Add TypeScript types",
    sample: "Infers and adds strict TypeScript types & interfaces.",
  },
  {
    key: "hooks",
    command: "/convert-to-hooks",
    desc: "Convert to React hooks",
    sample: "Rewrites class components into modern functional hooks.",
  },
];

const SUMMARY_OPTIONS = [
  {
    key: "unread",
    label: "Summarize Unread Messages",
    desc: "Catch up on missed logs",
    icon: <MessageSquare className="w-4 h-4 text-cyan-400" />,
  },
  {
    key: "action",
    label: "Extract Action Items & Todos",
    desc: "Pull out tasks & next steps",
    icon: <ListChecks className="w-4 h-4 text-rose-400" />,
  },
  {
    key: "bullet",
    label: "Bullet-point Summary",
    desc: "Concise bullet digest",
    icon: <Boxes className="w-4 h-4 text-emerald-400" />,
  },
];

const LANGUAGES = [
  "English",
  "Swahili",
  "Spanish",
  "French",
  "Arabic",
  "German",
  "Portuguese",
  "Hindi",
];

const VOICE_MODELS = [
  { id: "natural-female", name: "Natural Female", desc: "Warm & clear" },
  { id: "natural-male", name: "Natural Male", desc: "Deep & steady" },
  {
    id: "nautical-captain",
    name: "Nautical Captain",
    desc: "Bold & expressive",
  },
  { id: "calm-assistant", name: "Calm Assistant", desc: "Soft & measured" },
];

const IMAGE_STYLES = [
  { key: "photorealistic", label: "Photorealistic", icon: <Camera /> },
  { key: "cyberpunk", label: "Cyberpunk", icon: <Zap /> },
  { key: "anime", label: "Anime", icon: <Palette /> },
];

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

/* ====================================================================== */
/*  MAIN COMPONENT                                                         */
/* ====================================================================== */
export const HymliToolsModal: React.FC<HymliToolsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenUpgrade,
}) => {
  const [view, setView] = useState<ToolsView>("hub");
  const [toast, setToast] = useState<string>("");

  // Model Selection
  const [selectedModel, setSelectedModel] = useState("hymli-flash");
  const [customApiKey, setCustomApiKey] = useState("");
  const [apiKeySaved, setApiKeySaved] = useState(false);

  // Tone & Persona
  const [persona, setPersona] = useState("professional");
  const [personaStrength, setPersonaStrength] = useState(70);

  // Auto-Reply
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
  const [autoReplyTemplate, setAutoReplyTemplate] = useState("");
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [contacts, setContacts] = useState<{ id: string; name: string }[]>([]);

  // Context Memory
  const [contextTokens, setContextTokens] = useState(0);
  const [memoryLog, setMemoryLog] = useState<
    { id: string; snippet: string; tokens: number; time: string }[]
  >([]);

  // Load real contacts from Supabase for the auto-reply whitelist
  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, username");
      if (error || !data) return;
      const list = data
        .filter((p: any) => p.id !== currentUser.id)
        .map((p: any) => ({
          id: p.id,
          name: p.full_name || p.username || "HeyLook User",
        }));
      if (active) setContacts(list);
    })();
    return () => {
      active = false;
    };
  }, [isOpen, currentUser.id]);

  // Voice Synthesis
  const [voiceModel, setVoiceModel] = useState("natural-female");
  const [pitch, setPitch] = useState(1.0);
  const [speechRate, setSpeechRate] = useState(1.0);

  // Image Preset
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [imageStyle, setImageStyle] = useState("photorealistic");
  const [negativePrompt, setNegativePrompt] = useState("");

  // Code Refactor
  const [codeClipboard, setCodeClipboard] = useState("");

  // Summarization
  const [summaryMode, setSummaryMode] = useState("action");

  // Translation
  const [autoTranslate, setAutoTranslate] = useState(false);
  const [targetLang, setTargetLang] = useState("Swahili");
  const [showOriginalOnHover, setShowOriginalOnHover] = useState(true);

  // Usage Stats
  const [dailyRequests, setDailyRequests] = useState(0);
  const [tokenCounter, setTokenCounter] = useState(0);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 1800);
  };

  const closeModal = () => {
    setView("hub");
    onClose();
  };

  const applyModel = () => {
    switch (selectedModel) {
      case "hymli-flash":
        hymliAiService.setModel("gemini-2.5-flash");
        hymliAiService.setProvider("gemini");
        break;
      case "hymli-pro":
        hymliAiService.setModel("claude-3-5-sonnet");
        hymliAiService.setProvider("gemini");
        break;
      case "ollama-local":
        hymliAiService.setModel("llama-3.1-8b");
        hymliAiService.setProvider("ollama");
        break;
      case "custom-api":
      default:
        hymliAiService.setProvider("gemini");
        break;
    }
    showToast("Model updated ✓");
  };

  /* ---------- Render helpers ---------- */
  const renderModelSelection = () => (
    <div className="space-y-4">
      <Header
        title="Model Selection"
        subtitle="Choose your AI engine"
        color="text-indigo-400"
        bg="bg-indigo-500/20 border-indigo-500/30"
        icon={<Cpu className="w-6 h-6" />}
        onBack={() => setView("hub")}
      />

      <div className="space-y-2">
        {MODELS.map((m) => (
          <div key={m.id}>
            <button
              onClick={() => setSelectedModel(m.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${selectedModel === m.id ? "border-indigo-500/60 bg-indigo-500/10" : "border-slate-700 bg-slate-800/50 hover:border-slate-500"}`}
            >
              <span className={`p-2 rounded-lg bg-slate-900 ${m.color}`}>
                {m.icon}
              </span>
              <div className="flex-1 text-left">
                <p className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  {m.name}
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-slate-800 text-slate-400">
                    {m.badge}
                  </span>
                </p>
                <p className="text-[10px] text-slate-500">{m.desc}</p>
              </div>
              {selectedModel === m.id && (
                <CheckCircle2 className="w-4 h-4 text-indigo-400" />
              )}
            </button>
            {selectedModel === m.id && m.id === "custom-api" && (
              <div className="mt-2 pl-9 space-y-2">
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-pink-400" />
                  <input
                    type="password"
                    value={customApiKey}
                    onChange={(e) => {
                      setCustomApiKey(e.target.value);
                      setApiKeySaved(false);
                    }}
                    placeholder="Paste your API key..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:border-pink-500 focus:outline-none"
                  />
                </div>
                <button
                  onClick={() => {
                    setApiKeySaved(true);
                    showToast("API key saved ✓");
                  }}
                  className="px-4 py-2 rounded-xl bg-pink-500/20 border border-pink-500/40 text-pink-300 text-xs font-bold hover:bg-pink-500/30 transition-colors cursor-pointer"
                >
                  Save Key
                </button>
                {apiKeySaved && (
                  <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Key stored securely for
                    this session
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={applyModel}
        className="w-full py-3 rounded-2xl bg-indigo-500 text-white font-extrabold hover:bg-indigo-400 transition-colors cursor-pointer"
      >
        Apply Model
      </button>
    </div>
  );

  const renderTonePersona = () => (
    <div className="space-y-4">
      <Header
        title="Tone & Persona Adjuster"
        subtitle="Shape how Hymli responds"
        color="text-cyan-400"
        bg="bg-cyan-500/20 border-cyan-500/30"
        icon={<Sliders className="w-6 h-6" />}
        onBack={() => setView("hub")}
      />

      <div className="space-y-2">
        {PERSONAS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPersona(p.key)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${persona === p.key ? "border-cyan-500/60 bg-cyan-500/10" : "border-slate-700 bg-slate-800/50 hover:border-slate-500"}`}
          >
            {p.icon}
            <div className="flex-1 text-left">
              <p className="text-xs font-semibold text-slate-200">{p.label}</p>
              <p className="text-[10px] text-slate-500">{p.desc}</p>
            </div>
            {persona === p.key && (
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            )}
          </button>
        ))}
      </div>

      <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-200">
            Persona Strength
          </span>
          <span className="text-xs font-bold text-cyan-400">
            {personaStrength}%
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={personaStrength}
          onChange={(e) => setPersonaStrength(Number(e.target.value))}
          className="w-full accent-cyan-400 cursor-pointer"
        />
        <p className="text-[10px] text-slate-500 mt-1">
          Higher = more exaggerated persona traits
        </p>
      </div>

      <button
        onClick={() =>
          showToast(`Persona set to ${persona} (${personaStrength}%)`)
        }
        className="w-full py-3 rounded-2xl bg-cyan-500 text-slate-950 font-extrabold hover:bg-cyan-400 transition-colors cursor-pointer"
      >
        Apply Persona
      </button>
    </div>
  );

  const renderAutoReply = () => (
    <div className="space-y-4">
      <Header
        title="Auto-Reply Assistant"
        subtitle="Reply automatically when adrift"
        color="text-emerald-400"
        bg="bg-emerald-500/20 border-emerald-500/30"
        icon={<MessageSquare className="w-6 h-6" />}
        onBack={() => setView("hub")}
      />

      <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Anchor className="w-4 h-4 text-emerald-400" />
          <div>
            <p className="text-xs font-semibold text-slate-200">
              Enable when Adrift
            </p>
            <p className="text-[10px] text-slate-500">Auto-reply while away</p>
          </div>
        </div>
        <button
          onClick={() => setAutoReplyEnabled(!autoReplyEnabled)}
          className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${autoReplyEnabled ? "bg-emerald-500" : "bg-slate-700"}`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${autoReplyEnabled ? "left-[22px]" : "left-0.5"}`}
          />
        </button>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-400">
          Custom Auto-Reply Prompt Template
        </label>
        <textarea
          value={autoReplyTemplate}
          onChange={(e) => setAutoReplyTemplate(e.target.value)}
          rows={4}
          className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none resize-none"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400">
          Whitelist Contacts
        </label>
        {contacts.length === 0 ? (
          <p className="text-[11px] text-slate-500 bg-slate-900 border border-slate-800 rounded-xl p-3">
            No other registered users yet. When other people join HeyLook,
            you'll be able to whitelist them here for auto-replies.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {contacts.map((c) => {
              const isIn = whitelist.includes(c.name);
              return (
                <button
                  key={c.id}
                  onClick={() =>
                    setWhitelist(
                      isIn
                        ? whitelist.filter((x) => x !== c.name)
                        : [...whitelist, c.name],
                    )
                  }
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-colors cursor-pointer ${isIn ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-300"}`}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        )}
        <p className="text-[10px] text-slate-500">
          {whitelist.length} contacts whitelisted
        </p>
      </div>

      <button
        onClick={() =>
          showToast(
            autoReplyEnabled ? "Auto-reply enabled ✓" : "Auto-reply saved",
          )
        }
        className="w-full py-3 rounded-2xl bg-emerald-500 text-slate-950 font-extrabold hover:bg-emerald-400 transition-colors cursor-pointer"
      >
        Save Auto-Reply
      </button>
    </div>
  );

  const renderContextMemory = () => (
    <div className="space-y-4">
      <Header
        title="Context Memory Management"
        subtitle="Manage AI conversation memory"
        color="text-purple-400"
        bg="bg-purple-500/20 border-purple-500/30"
        icon={<Brain className="w-6 h-6" />}
        onBack={() => setView("hub")}
      />

      <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-purple-400" />
          <div>
            <p className="text-xs font-semibold text-slate-200">
              Active Context Tokens
            </p>
            <p className="text-[10px] text-slate-500">Current memory usage</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-purple-400">
            {contextTokens.toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-500">/ 32,768 tokens</p>
        </div>
      </div>

      <div className="space-y-2">
        {memoryLog.map((m) => (
          <div
            key={m.id}
            className="p-3 rounded-xl bg-slate-800/50 border border-slate-700"
          >
            <p className="text-xs font-semibold text-slate-200">{m.snippet}</p>
            <p className="text-[10px] text-slate-500 mt-1">
              {m.tokens} tokens • {m.time}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => {
            setContextTokens(0);
            setMemoryLog([]);
            showToast("Conversation memory cleared");
          }}
          className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 font-extrabold hover:bg-rose-500/30 transition-colors cursor-pointer"
        >
          <Trash2 className="w-4 h-4" /> Clear Memory
        </button>
        <button
          onClick={() => showToast("Context snapshot saved ✓")}
          className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-purple-500 text-slate-950 font-extrabold hover:bg-purple-400 transition-colors cursor-pointer"
        >
          <Save className="w-4 h-4" /> Save Snapshot
        </button>
      </div>
    </div>
  );

  const renderVoiceSynthesis = () => (
    <div className="space-y-4">
      <Header
        title="Voice Synthesis Settings"
        subtitle="Configure TTS output"
        color="text-pink-400"
        bg="bg-pink-500/20 border-pink-500/30"
        icon={<Volume2 className="w-6 h-6" />}
        onBack={() => setView("hub")}
      />

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400">
          Select AI Voice Model
        </label>
        {VOICE_MODELS.map((v) => (
          <button
            key={v.id}
            onClick={() => setVoiceModel(v.id)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${voiceModel === v.id ? "border-pink-500/60 bg-pink-500/10" : "border-slate-700 bg-slate-800/50"}`}
          >
            <Mic className="w-4 h-4 text-pink-400" />
            <div className="flex-1 text-left">
              <p className="text-xs font-semibold text-slate-200">{v.name}</p>
              <p className="text-[10px] text-slate-500">{v.desc}</p>
            </div>
            {voiceModel === v.id && (
              <CheckCircle2 className="w-4 h-4 text-pink-400" />
            )}
          </button>
        ))}
      </div>

      <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-200">
              Pitch Adjuster
            </span>
            <span className="text-xs font-bold text-pink-400">
              {pitch.toFixed(1)}x
            </span>
          </div>
          <input
            type="range"
            min={0.5}
            max={2}
            step={0.1}
            value={pitch}
            onChange={(e) => setPitch(Number(e.target.value))}
            className="w-full accent-pink-400 cursor-pointer"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-200">
              Speech Speed Rate
            </span>
            <span className="text-xs font-bold text-pink-400">
              {speechRate.toFixed(1)}x
            </span>
          </div>
          <input
            type="range"
            min={0.8}
            max={1.5}
            step={0.1}
            value={speechRate}
            onChange={(e) => setSpeechRate(Number(e.target.value))}
            className="w-full accent-pink-400 cursor-pointer"
          />
          <p className="text-[10px] text-slate-500 mt-1">
            Ranges from 0.8x (slow) to 1.5x (fast)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() =>
            hymliAiService.speakText(
              "Hello Captain! This is a voice synthesis preview.",
              { pitch, rate: speechRate },
            )
          }
          className="py-3 rounded-2xl bg-pink-500 text-slate-950 font-extrabold hover:bg-pink-400 transition-colors cursor-pointer"
        >
          Test Voice
        </button>
        <button
          onClick={() => hymliAiService.stopSpeaking()}
          className="py-3 rounded-2xl bg-slate-700 text-white font-extrabold hover:bg-slate-600 transition-colors cursor-pointer"
        >
          Stop
        </button>
      </div>
    </div>
  );

  const renderImagePreset = () => (
    <div className="space-y-4">
      <Header
        title="Image Generation Preset"
        subtitle="Configure image output"
        color="text-amber-400"
        bg="bg-amber-500/20 border-amber-500/30"
        icon={<ImageIcon className="w-6 h-6" />}
        onBack={() => setView("hub")}
      />

      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-400">Aspect Ratio</label>
        <div className="flex gap-2">
          {["1:1", "16:9", "9:16"].map((r) => (
            <button
              key={r}
              onClick={() => setAspectRatio(r)}
              className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${aspectRatio === r ? "bg-amber-500/20 border-amber-500/60 text-amber-300" : "bg-slate-800 border-slate-700 text-slate-300"}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400">
          Style Presets
        </label>
        {IMAGE_STYLES.map((s) => (
          <button
            key={s.key}
            onClick={() => setImageStyle(s.key)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${imageStyle === s.key ? "border-amber-500/60 bg-amber-500/10" : "border-slate-700 bg-slate-800/50"}`}
          >
            <span className="p-2 rounded-lg bg-slate-900 text-amber-400">
              {s.icon}
            </span>
            <span className="text-xs font-semibold text-slate-200 capitalize">
              {s.label}
            </span>
            {imageStyle === s.key && (
              <CheckCircle2 className="w-4 h-4 text-amber-400 ml-auto" />
            )}
          </button>
        ))}
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-400">
          Negative Prompts
        </label>
        <textarea
          value={negativePrompt}
          onChange={(e) => setNegativePrompt(e.target.value)}
          rows={3}
          placeholder="e.g. blurry, low quality, watermark, text..."
          className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:border-amber-500 focus:outline-none resize-none"
        />
      </div>

      <button
        onClick={() =>
          showToast(`Preset saved: ${aspectRatio} / ${imageStyle}`)
        }
        className="w-full py-3 rounded-2xl bg-amber-500 text-slate-950 font-extrabold hover:bg-amber-400 transition-colors cursor-pointer"
      >
        Save Preset
      </button>
    </div>
  );

  const renderCodeRefactor = () => (
    <div className="space-y-4">
      <Header
        title="Code Refactor Tool"
        subtitle="AI code action commands"
        color="text-teal-400"
        bg="bg-teal-500/20 border-teal-500/30"
        icon={<Code2 className="w-6 h-6" />}
        onBack={() => setView("hub")}
      />

      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-400">
          Paste Code Snippet
        </label>
        <textarea
          value={codeClipboard}
          onChange={(e) => setCodeClipboard(e.target.value)}
          rows={4}
          placeholder="// Paste your code here..."
          className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:border-teal-500 focus:outline-none resize-none font-mono"
        />
      </div>

      <div className="space-y-2">
        {CODE_COMMANDS.map((c) => (
          <button
            key={c.key}
            onClick={() => showToast(`${c.command} queued`)}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-teal-500/40 transition-all cursor-pointer text-left"
          >
            <span className="p-2 rounded-lg bg-slate-900 text-teal-400">
              <Wrench className="w-4 h-4" />
            </span>
            <div className="flex-1">
              <p className="text-xs font-mono font-bold text-teal-300">
                {c.command}
              </p>
              <p className="text-[10px] text-slate-500">{c.desc}</p>
            </div>
            <ChevronLeft className="w-4 h-4 text-slate-500 rotate-180" />
          </button>
        ))}
      </div>

      <button
        onClick={() => showToast("Code refactor dispatched to Hymli AI")}
        className="w-full py-3 rounded-2xl bg-teal-500 text-slate-950 font-extrabold hover:bg-teal-400 transition-colors cursor-pointer"
      >
        Run Refactor
      </button>
    </div>
  );

  const renderSummarization = () => (
    <div className="space-y-4">
      <Header
        title="Chat Summarization Settings"
        subtitle="Configure summary output"
        color="text-blue-400"
        bg="bg-blue-500/20 border-blue-500/30"
        icon={<FileText className="w-6 h-6" />}
        onBack={() => setView("hub")}
      />

      <div className="space-y-2">
        {SUMMARY_OPTIONS.map((s) => (
          <button
            key={s.key}
            onClick={() => setSummaryMode(s.key)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${summaryMode === s.key ? "border-blue-500/60 bg-blue-500/10" : "border-slate-700 bg-slate-800/50"}`}
          >
            {s.icon}
            <div className="flex-1 text-left">
              <p className="text-xs font-semibold text-slate-200">{s.label}</p>
              <p className="text-[10px] text-slate-500">{s.desc}</p>
            </div>
            {summaryMode === s.key && (
              <CheckCircle2 className="w-4 h-4 text-blue-400" />
            )}
          </button>
        ))}
      </div>

      <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700">
        <p className="text-xs font-semibold text-slate-200 mb-1">
          Prompt Preview
        </p>
        <p className="text-[11px] text-slate-400 font-mono bg-slate-950 rounded-lg p-2.5">
          {summaryMode === "unread" &&
            "Summarize all unread messages in this conversation, highlighting key updates."}
          {summaryMode === "action" &&
            "Extract all action items and todos from this conversation as a checklist."}
          {summaryMode === "bullet" &&
            "Provide a concise bullet-point summary of this entire conversation."}
        </p>
      </div>

      <button
        onClick={() => showToast("Summary settings saved")}
        className="w-full py-3 rounded-2xl bg-blue-500 text-white font-extrabold hover:bg-blue-400 transition-colors cursor-pointer"
      >
        Save Settings
      </button>
    </div>
  );

  const renderTranslation = () => (
    <div className="space-y-4">
      <Header
        title="Language Translation Copilot"
        subtitle="Configure translation behavior"
        color="text-rose-400"
        bg="bg-rose-500/20 border-rose-500/30"
        icon={<Languages className="w-6 h-6" />}
        onBack={() => setView("hub")}
      />

      <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Forward className="w-4 h-4 text-rose-400" />
          <div>
            <p className="text-xs font-semibold text-slate-200">
              Auto-translate incoming messages
            </p>
            <p className="text-[10px] text-slate-500">
              Translate all incoming chats
            </p>
          </div>
        </div>
        <button
          onClick={() => setAutoTranslate(!autoTranslate)}
          className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${autoTranslate ? "bg-rose-500" : "bg-slate-700"}`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${autoTranslate ? "left-[22px]" : "left-0.5"}`}
          />
        </button>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400">
          Select Target Language
        </label>
        <div className="grid grid-cols-2 gap-2">
          {LANGUAGES.map((l) => (
            <button
              key={l}
              onClick={() => setTargetLang(l)}
              className={`p-2.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${targetLang === l ? "bg-rose-500/20 border-rose-500/60 text-rose-300" : "bg-slate-800 border-slate-700 text-slate-300"}`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-rose-400" />
          <div>
            <p className="text-xs font-semibold text-slate-200">
              Show original text on hover
            </p>
            <p className="text-[10px] text-slate-500">
              Hover to reveal source language
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowOriginalOnHover(!showOriginalOnHover)}
          className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${showOriginalOnHover ? "bg-rose-500" : "bg-slate-700"}`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${showOriginalOnHover ? "left-[22px]" : "left-0.5"}`}
          />
        </button>
      </div>

      <button
        onClick={() => showToast(`Translate to ${targetLang} configured`)}
        className="w-full py-3 rounded-2xl bg-rose-500 text-white font-extrabold hover:bg-rose-400 transition-colors cursor-pointer"
      >
        Save Translation Settings
      </button>
    </div>
  );

  const renderUsageStats = () => (
    <div className="space-y-4">
      <Header
        title="Usage & Token Stats"
        subtitle="Monitor API consumption"
        color="text-slate-300"
        bg="bg-slate-500/20 border-slate-500/30"
        icon={<BarChart2 className="w-6 h-6" />}
        onBack={() => setView("hub")}
      />

      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700 text-center">
          <p className="text-2xl font-black text-cyan-400">{dailyRequests}</p>
          <p className="text-[10px] text-slate-500 mt-1">Daily API Requests</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700 text-center">
          <p className="text-2xl font-black text-purple-400">
            {(tokenCounter / 1000).toFixed(1)}
            <span className="text-sm">k</span>
          </p>
          <p className="text-[10px] text-slate-500 mt-1">Tokens Used</p>
        </div>
      </div>

      <div className="space-y-2">
        {[
          { label: "Hymli Flash 2.5", val: 68, color: "bg-sky-400" },
          { label: "Hymli Pro 1.5", val: 22, color: "bg-amber-400" },
          { label: "Local Ollama", val: 10, color: "bg-emerald-400" },
        ].map((b) => (
          <div key={b.label}>
            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
              <span>{b.label}</span>
              <span>{b.val}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
              <div
                className={`h-full ${b.color} rounded-full`}
                style={{ width: `${b.val}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => {
            setTokenCounter(0);
            showToast("Token counter reset ✓");
          }}
          className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-slate-700 text-white font-extrabold hover:bg-slate-600 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" /> Reset Counter
        </button>
        <button
          onClick={() => {
            if (onOpenUpgrade) onOpenUpgrade();
            else showToast("Upgrade modal opened");
          }}
          className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-extrabold hover:opacity-90 transition-opacity cursor-pointer"
        >
          <Rocket className="w-4 h-4" /> Manage Pro
        </button>
      </div>
    </div>
  );

  /* ---------- Hub grid ---------- */
  const renderHub = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-indigo-400 to-pink-500 animate-pulse" />
            Hymli AI Tool Suite
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure your AI copilot & workflow
          </p>
        </div>
        <div className="p-2.5 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
          <Bot className="w-5 h-5" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {TILES.map((t) => (
          <button
            key={t.key}
            onClick={() => setView(t.key as ToolsView)}
            className={`group p-3.5 rounded-2xl bg-gradient-to-br border text-left transition-all hover:scale-[1.03] hover:shadow-xl cursor-pointer ${t.gradient}`}
          >
            <div className="mb-2">{t.icon}</div>
            <p className="text-xs font-bold text-slate-100 group-hover:text-white leading-tight">
              {t.label}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
              {t.desc}
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
            {view === "modelSelection" && renderModelSelection()}
            {view === "tonePersona" && renderTonePersona()}
            {view === "autoReply" && renderAutoReply()}
            {view === "contextMemory" && renderContextMemory()}
            {view === "voiceSynthesis" && renderVoiceSynthesis()}
            {view === "imagePreset" && renderImagePreset()}
            {view === "codeRefactor" && renderCodeRefactor()}
            {view === "summarization" && renderSummarization()}
            {view === "translation" && renderTranslation()}
            {view === "usageStats" && renderUsageStats()}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HymliToolsModal;
