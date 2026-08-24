import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  ChevronLeft,
  Music,
  Star,
  User,
  Send,
  Anchor,
  Link2,
  Share2,
  Grid,
  Layers,
  AudioLines,
  Captions,
  Languages,
  ThumbsDown,
  Ban,
  Flag,
  Settings2,
  Gauge,
  Play,
  Download,
  BarChart3,
  Eye,
  Heart,
  Clock,
  CheckCircle2,
  ExternalLink,
  MessageCircle,
  Copy,
  Film,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { ReelItem } from "../../types";

type MenuView =
  | "hub"
  | "audioInfo"
  | "shareTo"
  | "remix"
  | "captions"
  | "notInterested"
  | "report"
  | "quality"
  | "playback"
  | "saveVideo"
  | "insights";

interface ReelsMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  reel: ReelItem | null;
  currentUserId?: string;
  onUseAudio?: () => void;
  onShare?: (method: string) => void;
}

/* ------------------------- Sample Data ------------------------- */
const SHARE_OPTIONS = [
  {
    k: "Direct Chat Message",
    desc: "Send to a contact",
    icon: <Send className="w-4 h-4 text-cyan-400" />,
  },
  {
    k: "Cast as Beacon",
    desc: "Broadcast to your crew",
    icon: <Anchor className="w-4 h-4 text-rose-400" />,
  },
  {
    k: "Copy Share Link",
    desc: "Copy profile reel link",
    icon: <Link2 className="w-4 h-4 text-indigo-400" />,
  },
  {
    k: "External Apps",
    desc: "Share to other platforms",
    icon: <Share2 className="w-4 h-4 text-emerald-400" />,
  },
];

const NOT_INTERESTED_OPTIONS = [
  {
    label: "Don't show reels from this user",
    icon: <Ban className="w-4 h-4 text-rose-400" />,
  },
  {
    label: "Don't show this audio",
    icon: <Music className="w-4 h-4 text-amber-400" />,
  },
  {
    label: "See fewer like this",
    icon: <ThumbsDown className="w-4 h-4 text-slate-400" />,
  },
];

/* ====================================================================== */
/*  MAIN COMPONENT                                                         */
/* ====================================================================== */
export const ReelsMenuModal: React.FC<ReelsMenuModalProps> = ({
  isOpen,
  onClose,
  reel,
  currentUserId,
  onUseAudio,
  onShare,
}) => {
  const [view, setView] = useState<MenuView>("hub");
  const [toast, setToast] = useState<string>("");

  // Audio Track Info
  const [audioFavorite, setAudioFavorite] = useState(false);

  // Remix / Stitch
  const [remixTool, setRemixTool] = useState<"side" | "sequential" | "audio">(
    "side",
  );

  // Captions
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const [captionLang, setCaptionLang] = useState("Auto-Generated");

  // Not Interested
  const [notInterestedSelected, setNotInterestedSelected] =
    useState<string>("");

  // Report Reel
  const [reportStep, setReportStep] = useState<"list" | "details">("list");
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");

  // Quality Settings
  const [quality, setQuality] = useState("Auto-Adjust");

  // Playback Speed
  const [playbackSpeed, setPlaybackSpeed] = useState("Normal 1.0x");

  // Save Video
  const [saveQuality, setSaveQuality] = useState("HD 1080p");
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloading, setDownloading] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 1800);
  };

  const closeModal = () => {
    setView("hub");
    setReportStep("list");
    setDownloadProgress(0);
    setDownloading(false);
    onClose();
  };

  const handleDownload = () => {
    setDownloading(true);
    setDownloadProgress(0);
    const interval = setInterval(() => {
      setDownloadProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setDownloading(false);
          showToast("Video saved to gallery ✓");
          return 100;
        }
        return p + 10;
      });
    }, 200);
  };

  /* ------------------------- Render helpers ------------------------- */
  const renderAudioInfo = () => (
    <div className="space-y-4">
      <Header
        title="Audio Track Info"
        subtitle="About this sound"
        color="text-amber-400"
        bg="bg-amber-500/20 border-amber-500/30"
        icon={<Music className="w-6 h-6" />}
        onBack={() => setView("hub")}
      />
      <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700 flex items-center gap-3">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
          className="w-14 h-14 rounded-full border-2 border-pink-500 overflow-hidden shrink-0"
        >
          <img
            src={reel?.author.avatar}
            alt="audio"
            className="w-full h-full object-cover"
          />
        </motion.div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-100 truncate">
            {reel?.song_title || "HeyLook Original Audio"}
          </p>
          <p className="text-[10px] text-slate-400">
            Audio • {reel?.author.name}
          </p>
          <p className="text-[10px] text-pink-400 font-semibold mt-0.5">
            42.6k uses
          </p>
        </div>
      </div>
      <div className="space-y-2">
        <button
          onClick={() => {
            onUseAudio?.();
            showToast("Audio selected");
          }}
          className="w-full flex items-center gap-3 p-3 rounded-xl bg-pink-500/10 border border-pink-500/40 hover:bg-pink-500/20 cursor-pointer"
        >
          <AudioLines className="w-4 h-4 text-pink-400" />
          <div className="flex-1 text-left">
            <p className="text-xs font-semibold text-pink-300">
              Use This Audio
            </p>
            <p className="text-[10px] text-slate-500">
              Create a reel with this sound
            </p>
          </div>
        </button>
        <button
          onClick={() => {
            setAudioFavorite(!audioFavorite);
            showToast(
              audioFavorite ? "Removed from favorites" : "Saved to favorites",
            );
          }}
          className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-amber-500/40 cursor-pointer"
        >
          <Star
            className={`w-4 h-4 ${audioFavorite ? "text-amber-400 fill-amber-400" : "text-amber-400"}`}
          />
          <div className="flex-1 text-left">
            <p className="text-xs font-semibold text-slate-200">
              Save Audio to Favorites
            </p>
            <p className="text-[10px] text-slate-500">
              {audioFavorite ? "Saved" : "Add to your audio library"}
            </p>
          </div>
          {audioFavorite && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
        </button>
        <button
          onClick={() => showToast("Opening creator profile")}
          className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-slate-500 cursor-pointer"
        >
          <User className="w-4 h-4 text-indigo-400" />
          <div className="flex-1 text-left">
            <p className="text-xs font-semibold text-slate-200">
              View Original Creator
            </p>
            <p className="text-[10px] text-slate-500">
              @{reel?.author.username}
            </p>
          </div>
        </button>
      </div>
    </div>
  );

  const renderShareTo = () => (
    <div className="space-y-4">
      <Header
        title="Share To..."
        subtitle="Spread this reel"
        color="text-cyan-400"
        bg="bg-cyan-500/20 border-cyan-500/30"
        icon={<Share2 className="w-6 h-6" />}
        onBack={() => setView("hub")}
      />
      <div className="grid grid-cols-2 gap-2">
        {SHARE_OPTIONS.map((opt) => (
          <button
            key={opt.k}
            onClick={() => {
              onShare?.(opt.k);
              showToast(`${opt.k} selected`);
            }}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-800/50 border border-slate-700 hover:border-cyan-500/40 hover:scale-[1.02] transition-all cursor-pointer text-center"
          >
            <span className="p-3 rounded-xl bg-slate-900">{opt.icon}</span>
            <span className="text-[11px] font-bold text-slate-200 leading-tight">
              {opt.k}
            </span>
            <span className="text-[9px] text-slate-500 leading-tight">
              {opt.desc}
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  const renderRemix = () => (
    <div className="space-y-4">
      <Header
        title="Remix / Stitch"
        subtitle="Create with this reel"
        color="text-purple-400"
        bg="bg-purple-500/20 border-purple-500/30"
        icon={<Layers className="w-6 h-6" />}
        onBack={() => setView("hub")}
      />
      <div className="space-y-2">
        {[
          {
            k: "side" as const,
            label: "Side-by-Side Dual",
            desc: "React alongside the original",
            icon: <Grid className="w-4 h-4 text-cyan-400" />,
          },
          {
            k: "sequential" as const,
            label: "Sequenced After Reel",
            desc: "Your video plays after theirs",
            icon: <Layers className="w-4 h-4 text-purple-400" />,
          },
          {
            k: "audio" as const,
            label: "Audio Overlay Only",
            desc: "Use just the original sound",
            icon: <AudioLines className="w-4 h-4 text-pink-400" />,
          },
        ].map((tool) => (
          <button
            key={tool.k}
            onClick={() => setRemixTool(tool.k)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${remixTool === tool.k ? "border-purple-500/60 bg-purple-500/10" : "border-slate-700 bg-slate-800/50"}`}
          >
            {tool.icon}
            <div className="flex-1 text-left">
              <p className="text-xs font-semibold text-slate-200">
                {tool.label}
              </p>
              <p className="text-[10px] text-slate-500">{tool.desc}</p>
            </div>
            {remixTool === tool.k && (
              <CheckCircle2 className="w-4 h-4 text-purple-400" />
            )}
          </button>
        ))}
      </div>
      <button
        onClick={() => showToast("Remix editor opened")}
        className="w-full py-3 rounded-2xl bg-purple-500 text-white font-extrabold hover:bg-purple-400 cursor-pointer"
      >
        Open Editor
      </button>
    </div>
  );

  const renderCaptions = () => (
    <div className="space-y-4">
      <Header
        title="Captions & Subtitles"
        subtitle="Control text overlays"
        color="text-emerald-400"
        bg="bg-emerald-500/20 border-emerald-500/30"
        icon={<Captions className="w-6 h-6" />}
        onBack={() => setView("hub")}
      />
      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/50 border border-slate-700">
        <div>
          <p className="text-xs font-semibold text-slate-200">Captions</p>
          <p className="text-[10px] text-slate-500">
            {captionsEnabled ? "Enabled" : "Disabled"}
          </p>
        </div>
        <button
          onClick={() => setCaptionsEnabled(!captionsEnabled)}
          className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer ${captionsEnabled ? "bg-emerald-500" : "bg-slate-600"}`}
        >
          <div
            className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${captionsEnabled ? "translate-x-5" : ""}`}
          />
        </button>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-bold text-slate-400">Caption Language</p>
        {["Auto-Generated", "English", "French", "Swahili", "Off"].map(
          (lang) => (
            <button
              key={lang}
              onClick={() => {
                setCaptionLang(lang);
                if (lang === "Off") setCaptionsEnabled(false);
                else setCaptionsEnabled(true);
                showToast(`Captions: ${lang}`);
              }}
              className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${captionLang === lang ? "border-emerald-500/60 bg-emerald-500/10" : "border-slate-700 bg-slate-800/50"}`}
            >
              <span className="text-xs font-semibold text-slate-200">
                {lang}
              </span>
              {captionLang === lang && (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              )}
            </button>
          ),
        )}
      </div>
    </div>
  );

  const renderNotInterested = () => (
    <div className="space-y-4">
      <Header
        title="Not Interested"
        subtitle="Tune your feed"
        color="text-slate-400"
        bg="bg-slate-500/20 border-slate-500/30"
        icon={<ThumbsDown className="w-6 h-6" />}
        onBack={() => setView("hub")}
      />
      <div className="space-y-2">
        {NOT_INTERESTED_OPTIONS.map((opt) => (
          <button
            key={opt.label}
            onClick={() => {
              setNotInterestedSelected(opt.label);
              showToast("Feedback recorded");
            }}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${notInterestedSelected === opt.label ? "border-slate-400/60 bg-slate-500/10" : "border-slate-700 bg-slate-800/50"}`}
          >
            {opt.icon}
            <div className="flex-1 text-left">
              <p className="text-xs font-semibold text-slate-200">
                {opt.label}
              </p>
            </div>
            {notInterestedSelected === opt.label && (
              <CheckCircle2 className="w-4 h-4 text-slate-300" />
            )}
          </button>
        ))}
      </div>
    </div>
  );

  const renderReport = () => {
    if (reportStep === "details") {
      return (
        <div className="space-y-4">
          <Header
            title="Report Details"
            subtitle="Add more context"
            color="text-rose-400"
            bg="bg-rose-500/20 border-rose-500/30"
            icon={<Flag className="w-6 h-6" />}
            onBack={() => setReportStep("list")}
          />
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700">
            <p className="text-xs font-semibold text-slate-200">
              Reason: <span className="text-rose-300">{reportReason}</span>
            </p>
          </div>
          <textarea
            value={reportDetails}
            onChange={(e) => setReportDetails(e.target.value)}
            rows={4}
            placeholder="Describe the issue (optional)..."
            className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:border-rose-500 focus:outline-none resize-none"
          />
          <button
            onClick={() => showToast("Report submitted ✓")}
            className="w-full py-3 rounded-2xl bg-rose-500 text-white font-extrabold hover:bg-rose-400 cursor-pointer"
          >
            Submit Report
          </button>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <Header
          title="Report Reel"
          subtitle="Help keep the stream safe"
          color="text-rose-400"
          bg="bg-rose-500/20 border-rose-500/30"
          icon={<Flag className="w-6 h-6" />}
          onBack={() => setView("hub")}
        />
        <div className="space-y-2">
          {[
            { label: "Copyright violation", desc: "Uses unauthorized content" },
            {
              label: "Inappropriate content",
              desc: "Violates community guidelines",
            },
            { label: "Misinformation", desc: "Spreads false information" },
          ].map((r) => (
            <button
              key={r.label}
              onClick={() => {
                setReportReason(r.label);
                setReportStep("details");
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-rose-500/40 cursor-pointer text-left"
            >
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-slate-200">
                  {r.label}
                </p>
                <p className="text-[10px] text-slate-500">{r.desc}</p>
              </div>
              <ChevronLeft className="w-4 h-4 text-slate-500 rotate-180" />
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderQuality = () => (
    <div className="space-y-4">
      <Header
        title="Quality Settings"
        subtitle="Video resolution"
        color="text-teal-400"
        bg="bg-teal-500/20 border-teal-500/30"
        icon={<Settings2 className="w-6 h-6" />}
        onBack={() => setView("hub")}
      />
      <div className="space-y-2">
        {[
          {
            k: "Auto-Adjust",
            desc: "Balanced for your connection",
            icon: <Gauge className="w-4 h-4 text-teal-400" />,
          },
          {
            k: "High Definition 1080p",
            desc: "Best quality, more data",
            icon: <Film className="w-4 h-4 text-indigo-400" />,
          },
          {
            k: "Data Saver 480p",
            desc: "Lower quality, less data",
            icon: <Download className="w-4 h-4 text-emerald-400" />,
          },
        ].map((opt) => (
          <button
            key={opt.k}
            onClick={() => {
              setQuality(opt.k);
              showToast(`Quality: ${opt.k}`);
            }}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${quality === opt.k ? "border-teal-500/60 bg-teal-500/10" : "border-slate-700 bg-slate-800/50"}`}
          >
            {opt.icon}
            <div className="flex-1 text-left">
              <p className="text-xs font-semibold text-slate-200">{opt.k}</p>
              <p className="text-[10px] text-slate-500">{opt.desc}</p>
            </div>
            {quality === opt.k && (
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
            )}
          </button>
        ))}
      </div>
    </div>
  );

  const renderPlayback = () => (
    <div className="space-y-4">
      <Header
        title="Playback Speed"
        subtitle="Control playback rate"
        color="text-cyan-400"
        bg="bg-cyan-500/20 border-cyan-500/30"
        icon={<Play className="w-6 h-6" />}
        onBack={() => setView("hub")}
      />
      <div className="space-y-2">
        {["0.5x", "0.75x", "Normal 1.0x", "1.25x", "1.5x", "2.0x"].map(
          (speed) => (
            <button
              key={speed}
              onClick={() => {
                setPlaybackSpeed(speed);
                showToast(`Speed: ${speed}`);
              }}
              className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${playbackSpeed === speed ? "border-cyan-500/60 bg-cyan-500/10" : "border-slate-700 bg-slate-800/50"}`}
            >
              <span className="text-xs font-semibold text-slate-200">
                {speed}
              </span>
              {playbackSpeed === speed && (
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              )}
            </button>
          ),
        )}
      </div>
    </div>
  );

  const renderSaveVideo = () => (
    <div className="space-y-4">
      <Header
        title="Save Video"
        subtitle="Download to device"
        color="text-emerald-400"
        bg="bg-emerald-500/20 border-emerald-500/30"
        icon={<Download className="w-6 h-6" />}
        onBack={() => setView("hub")}
      />
      <div className="space-y-2">
        <p className="text-xs font-bold text-slate-400">Select Quality</p>
        {["Standard", "HD 1080p", "Original"].map((q) => (
          <button
            key={q}
            onClick={() => setSaveQuality(q)}
            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${saveQuality === q ? "border-emerald-500/60 bg-emerald-500/10" : "border-slate-700 bg-slate-800/50"}`}
          >
            <span className="text-xs font-semibold text-slate-200">{q}</span>
            {saveQuality === q && (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
          </button>
        ))}
      </div>
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="w-full py-3 rounded-2xl bg-emerald-500 text-slate-950 font-extrabold hover:bg-emerald-400 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
      >
        {downloading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        {downloading ? `Saving ${downloadProgress}%...` : "Save to Gallery"}
      </button>
      {downloading && (
        <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
          <div
            className="h-full bg-emerald-400 rounded-full transition-all"
            style={{ width: `${downloadProgress}%` }}
          />
        </div>
      )}
      <p className="text-[10px] text-slate-500 text-center">
        Saved to your device's local gallery.
      </p>
    </div>
  );

  const renderInsights = () => (
    <div className="space-y-4">
      <Header
        title="Insights & Analytics"
        subtitle="Owner-only performance"
        color="text-indigo-400"
        bg="bg-indigo-500/20 border-indigo-500/30"
        icon={<BarChart3 className="w-6 h-6" />}
        onBack={() => setView("hub")}
      />
      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/40 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
        <p className="text-[10px] text-amber-300">
          These insights are only visible to the reel owner.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700 text-center">
          <Eye className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
          <p className="text-2xl font-black text-slate-100">
            {reel?.likes_count || 0}
          </p>
          <p className="text-[10px] text-slate-500">Views</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700 text-center">
          <Heart className="w-5 h-5 text-rose-400 mx-auto mb-1" />
          <p className="text-2xl font-black text-slate-100">
            {reel?.likes_count || 0}
          </p>
          <p className="text-[10px] text-slate-500">Likes</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700 text-center">
          <Share2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
          <p className="text-2xl font-black text-slate-100">
            {reel?.shares_count || 0}
          </p>
          <p className="text-[10px] text-slate-500">Shares</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700 text-center">
          <Clock className="w-5 h-5 text-amber-400 mx-auto mb-1" />
          <p className="text-2xl font-black text-slate-100">24s</p>
          <p className="text-[10px] text-slate-500">Avg Watch Time</p>
        </div>
      </div>
      <div className="space-y-2">
        {[
          { label: "Watch time", val: 68 },
          { label: "Engagement rate", val: 12 },
          { label: "Reach", val: 45 },
        ].map((m) => (
          <div key={m.label}>
            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
              <span>{m.label}</span>
              <span>{m.val}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
              <div
                className="h-full bg-indigo-400 rounded-full"
                style={{ width: `${m.val}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  /* ------------------------- Hub grid ------------------------- */
  const renderHub = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-pink-400 to-cyan-400 animate-pulse" />
            Reel Options
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage, share & configure this reel
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {[
          {
            k: "audioInfo" as const,
            label: "Audio Track Info",
            icon: <Music className="w-5 h-5" />,
            grad: "from-amber-500/20 to-yellow-500/10 border-amber-500/30 text-amber-400",
          },
          {
            k: "shareTo" as const,
            label: "Share To...",
            icon: <Share2 className="w-5 h-5" />,
            grad: "from-cyan-500/20 to-blue-500/10 border-cyan-500/30 text-cyan-400",
          },
          {
            k: "remix" as const,
            label: "Remix / Stitch",
            icon: <Layers className="w-5 h-5" />,
            grad: "from-purple-500/20 to-fuchsia-500/10 border-purple-500/30 text-purple-400",
          },
          {
            k: "captions" as const,
            label: "Captions & Subtitles",
            icon: <Captions className="w-5 h-5" />,
            grad: "from-emerald-500/20 to-green-500/10 border-emerald-500/30 text-emerald-400",
          },
          {
            k: "notInterested" as const,
            label: "Not Interested",
            icon: <ThumbsDown className="w-5 h-5" />,
            grad: "from-slate-500/20 to-zinc-500/10 border-slate-500/30 text-slate-300",
          },
          {
            k: "report" as const,
            label: "Report Reel",
            icon: <Flag className="w-5 h-5" />,
            grad: "from-rose-500/20 to-red-500/10 border-rose-500/30 text-rose-400",
          },
          {
            k: "quality" as const,
            label: "Quality Settings",
            icon: <Settings2 className="w-5 h-5" />,
            grad: "from-teal-500/20 to-cyan-500/10 border-teal-500/30 text-teal-400",
          },
          {
            k: "playback" as const,
            label: "Playback Speed",
            icon: <Play className="w-5 h-5" />,
            grad: "from-indigo-500/20 to-violet-500/10 border-indigo-500/30 text-indigo-400",
          },
          {
            k: "saveVideo" as const,
            label: "Save Video",
            icon: <Download className="w-5 h-5" />,
            grad: "from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400",
          },
          {
            k: "insights" as const,
            label: "Insights & Analytics",
            icon: <BarChart3 className="w-5 h-5" />,
            grad: "from-blue-500/20 to-indigo-500/10 border-blue-500/30 text-blue-400",
          },
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
      {isOpen && reel && (
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
            {view === "audioInfo" && renderAudioInfo()}
            {view === "shareTo" && renderShareTo()}
            {view === "remix" && renderRemix()}
            {view === "captions" && renderCaptions()}
            {view === "notInterested" && renderNotInterested()}
            {view === "report" && renderReport()}
            {view === "quality" && renderQuality()}
            {view === "playback" && renderPlayback()}
            {view === "saveVideo" && renderSaveVideo()}
            {view === "insights" && renderInsights()}
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

export default ReelsMenuModal;
