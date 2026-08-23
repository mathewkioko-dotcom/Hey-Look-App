import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  FileText,
  File,
  FileSpreadsheet,
  FileCode,
  Camera,
  Film,
  Image as ImageIcon,
  Mic,
  AudioLines,
  MapPin,
  User as UserIcon,
  Vote,
  Calendar,
  Radio,
  Sparkles,
  Smile,
  Search,
  Upload,
  Plus,
  Trash2,
  Send,
  Crop,
  RotateCw,
  Type,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Star,
  Clock,
  Bell,
  Zap,
  Music,
  FolderOpen,
  LocateFixed,
  Navigation,
  CheckSquare,
  CheckCircle2,
  Mail,
  Phone,
  Globe,
  Github,
  Hash,
  Link2,
  Lock,
  MessageCircle,
  Pin,
  Timer,
  Wand2,
  Play,
  StopCircle,
  Gift,
  TrendingUp,
} from 'lucide-react';

export type AttachmentDispatchType = "image" | "video" | "voice" | "code" | "doc" | "poll" | "contact" | "event" | "location" | "beacon" | "gif";

export interface AttachmentHubResult {
  type: AttachmentDispatchType;
  title: string;
  detail: string;
  category: string;
  image_url?: string;
  video_url?: string;
  audio_duration?: string;
  code_lang?: string;
  code_content?: string;
  extra?: any;
}

interface AttachmentHubProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (result: AttachmentHubResult) => void;
  currentUser?: { id?: string; full_name?: string; avatar_url?: string; username?: string };
  contactName?: string;
}

/* ------------------------- Sub-Component: Tile ------------------------- */
interface TileDef {
  key: string;
  label: string;
  desc: string;
  icon: React.ReactNode;
  gradient: string;
}

const TILES: TileDef[] = [
  { key: "doc", label: "Document", desc: "PDF, Docs, Sheets, Code", icon: <FileText className="w-6 h-6" />, gradient: "from-cyan-500/20 to-blue-500/10 border-cyan-500/30 text-cyan-400" },
  { key: "camera", label: "Camera/Gallery", desc: "Capture or upload + edit", icon: <Camera className="w-6 h-6" />, gradient: "from-pink-500/20 to-rose-500/10 border-pink-500/30 text-pink-400" },
  { key: "video", label: "Video", desc: "Upload a video clip", icon: <Film className="w-6 h-6" />, gradient: "from-violet-500/20 to-indigo-500/10 border-violet-500/30 text-violet-400" },
  { key: "audio", label: "Audio / Voice", desc: "Record, upload, synth", icon: <Mic className="w-6 h-6" />, gradient: "from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400" },
  { key: "location", label: "Location", desc: "Live / current / nearby", icon: <MapPin className="w-6 h-6" />, gradient: "from-emerald-500/20 to-green-500/10 border-emerald-500/30 text-emerald-400" },
  { key: "contact", label: "Contact Card", desc: "Share a person", icon: <UserIcon className="w-6 h-6" />, gradient: "from-indigo-500/20 to-violet-500/10 border-indigo-500/30 text-indigo-400" },
  { key: "poll", label: "Create Poll", desc: "Votes & consensus", icon: <Vote className="w-6 h-6" />, gradient: "from-purple-500/20 to-fuchsia-500/10 border-purple-500/30 text-purple-400" },
  { key: "event", label: "Event / Schedule", desc: "Calendar invite", icon: <Calendar className="w-6 h-6" />, gradient: "from-blue-500/20 to-cyan-500/10 border-blue-500/30 text-blue-400" },
  { key: "beacon", label: "Send Beacon", desc: "Story / anchor / schedule", icon: <Radio className="w-6 h-6" />, gradient: "from-teal-500/20 to-cyan-500/10 border-teal-500/30 text-teal-400" },
  { key: "code", label: "AI Code Snippet", desc: "TS, Python, SQL", icon: <FileCode className="w-6 h-6" />, gradient: "from-slate-500/20 to-zinc-500/10 border-slate-500/30 text-slate-300" },
  { key: "gif", label: "GIF & Sticker", desc: "GIFs, stickers, AI art", icon: <Smile className="w-6 h-6" />, gradient: "from-yellow-500/20 to-amber-500/10 border-yellow-500/30 text-yellow-400" },
];

/* ------------------------- Sample Data ------------------------- */
const GALLERY_IMAGES = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300",
];

const GIFS = [
  "https://media.giphy.com/media/3o7abldj0b3rx6ZU1W/giphy.gif",
  "https://media.giphy.com/media/26BRuo6sThedmmFGM/giphy.gif",
  "https://media.giphy.com/media/l0HlNaQ6gWfllcjDO/giphy.gif",
  "https://media.giphy.com/media/3o6Zt6ML6BklcajjsA/giphy.gif",
  "https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif",
  "https://media.giphy.com/media/11sBLVxNs7v6WA/giphy.gif",
];

const STICKERS = [
  "https://api.dicebear.com/7.x/bottts/svg?seed=sticker1",
  "https://api.dicebear.com/7.x/bottts/svg?seed=sticker2",
  "https://api.dicebear.com/7.x/bottts/svg?seed=sticker3",
  "https://api.dicebear.com/7.x/bottts/svg?seed=sticker4",
  "https://api.dicebear.com/7.x/bottts/svg?seed=sticker5",
  "https://api.dicebear.com/7.x/bottts/svg?seed=sticker6",
];

const DOC_FILES = [
  { name: "Q3_Nautical_Report.pdf", type: "PDF", size: "4.2 MB", icon: <FileText className="w-5 h-5" />, color: "text-rose-400" },
  { name: "Fleet_Manifest.docx", type: "Docs", size: "1.1 MB", icon: <File className="w-5 h-5" />, color: "text-blue-400" },
  { name: "Revenue_2026.xlsx", type: "Spreadsheet", size: "860 KB", icon: <FileSpreadsheet className="w-5 h-5" />, color: "text-emerald-400" },
  { name: "server_config.ts", type: "Code", size: "12 KB", icon: <FileCode className="w-5 h-5" />, color: "text-amber-400" },
  { name: "Anchor_Checklist.pdf", type: "PDF", size: "320 KB", icon: <FileText className="w-5 h-5" />, color: "text-rose-400" },
  { name: "Harbor_Policy.docx", type: "Docs", size: "2.7 MB", icon: <File className="w-5 h-5" />, color: "text-blue-400" },
];

const CONTACTS = [
  { id: "c1", name: "Sara Chen", phone: "+1 415-555-0132", email: "sara@heylook.app", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100" },
  { id: "c2", name: "Alex Rivera", phone: "+1 212-555-0198", email: "alex@heylook.app", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100" },
  { id: "c3", name: "Maya Okafor", phone: "+44 20 7946 0958", email: "maya@heylook.app", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100" },
  { id: "c4", name: "James Kim", phone: "+82 10-1234-5678", email: "james@heylook.app", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100" },
  { id: "c5", name: "Priya Patel", phone: "+91 98765 43210", email: "priya@heylook.app", avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100" },
];

const AI_STICKERS = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=ai1",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=ai2",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=ai3",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=ai4",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=ai5",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=ai6",
];

/* ====================================================================== */
/*  MAIN COMPONENT                                                         */
/* ====================================================================== */

export const AttachmentHub: React.FC<AttachmentHubProps> = ({
  isOpen,
  onClose,
  onSend,
  currentUser,
  contactName,
}) => {
  const [view, setView] = useState<string>("hub"); // hub | sub-view key
  const fileInputRef = useRef<HTMLInputElement>(null);
    const mediaFileInputRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<string>("");

  // ---------- Document state ----------
  const [docFilter, setDocFilter] = useState<string>("All");
  const [docName, setDocName] = useState("Q3_Nautical_Report.pdf");

  // ---------- Camera / Gallery state ----------
  const [galleryMode, setGalleryMode] = useState<"grid" | "editor">("grid");
  const [selectedImage, setSelectedImage] = useState<string>(GALLERY_IMAGES[0]);
  const [crop, setCrop] = useState(0);
  const [rotate, setRotate] = useState(0);
  const [filterPreset, setFilterPreset] = useState("None");
  const [textOverlay, setTextOverlay] = useState("");

  // ---------- Audio state ----------
  const [audioMode, setAudioMode] = useState<"hub" | "recording">("hub");
  const [audioPreset, setAudioPreset] = useState("Hymli Calm Voice");
  const [recordingSec, setRecordingSec] = useState(0);
  const recTimer = useRef<any>(null);

  // ---------- Location state ----------
  const [locOption, setLocOption] = useState<"live" | "current" | "nearby">("current");
  const [liveDuration, setLiveDuration] = useState("15m");

  // ---------- Contact Card state ----------
  const [selectedContact, setSelectedContact] = useState(CONTACTS[0]);
  const [contactFields, setContactFields] = useState({ phone: true, email: true, social: true });

  // ---------- Poll state ----------
  const [pollQuestion, setPollQuestion] = useState("Where should we dock next?");
  const [pollOptions, setPollOptions] = useState(["Singapore Port", "Rotterdam Hub", "Monaco Harbor"]);
  const [pollMulti, setPollMulti] = useState(false);
  const [pollAnonymous, setPollAnonymous] = useState(false);

  // ---------- Event state ----------
  const [eventTitle, setEventTitle] = useState("Nautical Anchor Meeting");
  const [eventDate, setEventDate] = useState("2026-03-15");
  const [eventTime, setEventTime] = useState("14:30");
  const [eventLocation, setEventLocation] = useState("Harbor View Deck");
  const [eventReminder, setEventReminder] = useState("30 minutes before");
  const [selectedDay, setSelectedDay] = useState(15);

  // ---------- Beacon state ----------
  const [beaconOption, setBeaconOption] = useState<"instant" | "anchor" | "schedule">("instant");
  const [beaconText, setBeaconText] = useState("Setting sail on a new adventure! ⛵");

  // ---------- AI Code state ----------
  const [codeLang, setCodeLang] = useState("TypeScript");
  const [codeContent, setCodeContent] = useState(
`// HeyLook AI snippet
function greetFleet(name: string): string {
  return \`Ahoy, \${name}! ⚓\`;
}
console.log(greetFleet("Captain"));`,
  );

  // ---------- GIF / Sticker state ----------
  const [gifTab, setGifTab] = useState<"gifs" | "stickers" | "ai">("gifs");
  const [gifSearch, setGifSearch] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 1800);
  };

  const resetAll = () => {
    setView("hub");
    setGalleryMode("grid");
    setAudioMode("hub");
  };

  const closeHub = () => {
    resetAll();
    onClose();
  };

  const filteredGifs = GIFS.filter(() => true);
  const filteredStickers = STICKERS.filter(() => true);

  const docFilters = ["All", "PDF", "Docs", "Spreadsheet", "Code"];
  const filteredDocs = DOC_FILES.filter((d) => docFilter === "All" || d.type === docFilter);

  /* ---------- Send helpers ---------- */
  const sendDoc = (file: { name: string; type: string; size: string }) => {
    onSend({
      type: "doc",
      title: `📄 ${file.name}`,
      detail: `${file.type} • ${file.size}`,
      category: "docs",
      extra: { name: file.name, type: file.type, size: file.size },
    });
    showToast(`Sent ${file.name}`);
  };

  const sendEditedImage = () => {
    const transforms: string[] = [];
    if (crop) transforms.push(`crop:${crop}`);
    if (rotate) transforms.push(`rot:${rotate}°`);
    if (filterPreset !== "None") transforms.push(`filter:${filterPreset}`);
    if (textOverlay.trim()) transforms.push(`text:"${textOverlay}"`);
    onSend({
      type: "image",
      title: "📷 Photo",
      detail: transforms.length ? transforms.join(" · ") : "Edited photo",
      category: "media",
      image_url: selectedImage,
      extra: { crop, rotate, filter: filterPreset, text: textOverlay },
    });
    showToast("Photo sent!");
  };

  const handleMediaFile = (event: React.ChangeEvent<HTMLInputElement>, type: "image" | "video") => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      showToast("Media must be smaller than 50MB");
      return;
    }
    onSend({
      type,
      title: type === "video" ? "Video" : "Photo",
      detail: file.name,
      category: "media",
      extra: { file },
    });
    closeHub();
  };

  const sendAudio = (detail: string, duration?: string) => {
    onSend({
      type: "voice",
      title: "🎤 Voice Note",
      detail,
      category: "media",
      audio_duration: duration || "0:12",
    });
    showToast("Voice note sent!");
  };

  const sendLocation = () => {
    const desc =
      locOption === "live"
        ? `📍 Live location • ${liveDuration}`
        : locOption === "nearby"
          ? "📍 Nearby places shared"
          : "📍 Current location";
    onSend({
      type: "location",
      title: desc,
      detail:
        locOption === "live"
          ? "Share real-time GPS"
          : locOption === "nearby"
            ? "List of nearby places"
            : "Lat 37.7749, Lon -122.4194",
      category: "tools",
      extra: { option: locOption, liveDuration: locOption === "live" ? liveDuration : undefined },
    });
    showToast("Location shared");
  };

  const sendContactCard = () => {
    const fields: string[] = [];
    if (contactFields.phone) fields.push(selectedContact.phone);
    if (contactFields.email) fields.push(selectedContact.email);
    if (contactFields.social) fields.push("@heylook");
    onSend({
      type: "contact",
      title: `👤 ${selectedContact.name}`,
      detail: fields.join(" · ") || "Contact card",
      category: "tools",
      extra: { contact: selectedContact, fields: contactFields },
    });
    showToast(`Shared ${selectedContact.name}`);
  };

  const sendPoll = () => {
    onSend({
      type: "poll",
      title: `📊 ${pollQuestion}`,
      detail: `${pollOptions.length} options${pollMulti ? " • Multiple answers" : ""}${pollAnonymous ? " • Anonymous" : ""}`,
      category: "tools",
      extra: { question: pollQuestion, options: pollOptions, multi: pollMulti, anonymous: pollAnonymous },
    });
    showToast("Poll created!");
  };

  const sendEvent = () => {
    onSend({
      type: "event",
      title: `📅 ${eventTitle}`,
      detail: `${eventDate} ${eventTime} • ${eventLocation} • Reminder ${eventReminder}`,
      category: "tools",
      extra: { title: eventTitle, date: eventDate, time: eventTime, location: eventLocation, reminder: eventReminder },
    });
    showToast("Event sent!");
  };

  const sendBeacon = () => {
    const desc =
      beaconOption === "instant"
        ? "⚡ Cast Instant Story"
        : beaconOption === "anchor"
          ? "⚓ Anchor to Chat Header"
          : "⏰ Schedule Beacon Release";
    onSend({
      type: "beacon",
      title: desc,
      detail: beaconText,
      category: "tools",
      extra: { option: beaconOption, text: beaconText },
    });
    showToast("Beacon dispatched!");
  };

  const sendCode = () => {
    onSend({
      type: "code",
      title: `</> ${codeLang} snippet`,
      detail: "AI-formatted & ready to run",
      category: "code",
      code_lang: codeLang.toLowerCase(),
      code_content: codeContent,
    });
    showToast("Code snippet sent!");
  };

  const sendGif = (url: string, kind: string) => {
    onSend({
      type: "gif",
      title: kind === "gifs" ? "GIF" : kind === "stickers" ? "Sticker" : "AI Sticker",
      detail: "Animated",
      category: "media",
      image_url: url,
      extra: { kind },
    });
    showToast(kind === "gifs" ? "GIF sent!" : "Sticker sent!");
  };

  /* ---------- Render: Document sub-view ---------- */
  const renderDoc = () => (
    <div className="space-y-4">
      <Header title="Document Attachment" subtitle="Browse, filter & send files securely" color="text-cyan-400" bg="bg-cyan-500/20 border-cyan-500/30" icon={<FileText className="w-6 h-6" />} onBack={() => setView("hub")} />
      <button onClick={() => { fileInputRef.current?.click(); showToast("File browser opened"); }} className="w-full border-2 border-dashed border-slate-700 rounded-2xl p-6 text-center hover:border-cyan-500/50 transition-colors cursor-pointer bg-slate-950/50">
        <FolderOpen className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
        <p className="text-sm font-semibold text-slate-200">Browse files or drag & drop</p>
        <p className="text-xs text-slate-500 mt-1">PDF, DOCX, XLSX, ZIP, code up to 50MB</p>
        <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => { if (e.target.files?.[0]) { sendDoc({ name: e.target.files[0].name, type: e.target.files[0].type.split("/")[1]?.toUpperCase() || "File", size: `${(e.target.files[0].size / 1024 / 1024).toFixed(1)} MB` }); closeHub(); } }} />
      </button>
      <div>
        <p className="text-xs font-bold text-slate-400 mb-2">Filter by type</p>
        <div className="flex flex-wrap gap-2">
          {docFilters.map((f) => (
            <button key={f} onClick={() => setDocFilter(f)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${docFilter === f ? "bg-cyan-500 text-slate-950" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}>{f}</button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
        {filteredDocs.map((f) => (
          <button key={f.name} onClick={() => { sendDoc(f); closeHub(); }} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-cyan-500/40 hover:bg-slate-800 transition-all cursor-pointer text-left">
            <span className={f.color}>{f.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">{f.name}</p>
              <p className="text-[10px] text-slate-500">{f.type} • {f.size}</p>
            </div>
            <Send className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );

  /* ---------- Render: Camera/Gallery + editor ---------- */
  const renderCamera = () => {
    if (galleryMode === "grid") {
      return (
        <div className="space-y-4">
          <Header title="Camera / Gallery" subtitle="Pick a photo, then edit it" color="text-pink-400" bg="bg-pink-500/20 border-pink-500/30" icon={<Camera className="w-6 h-6" />} onBack={() => setView("hub")} />
          <button onClick={() => { showToast("Camera opened"); }} className="w-full border-2 border-dashed border-slate-700 rounded-2xl p-4 text-center hover:border-pink-500/50 transition-colors cursor-pointer bg-slate-950/50">
            <Camera className="w-7 h-7 text-pink-400 mx-auto mb-1" />
            <p className="text-xs font-semibold text-slate-200">Take a photo</p>
          </button>
          <button onClick={() => mediaFileInputRef.current?.click()} className="w-full border-2 border-dashed border-slate-700 rounded-2xl p-4 text-center hover:border-pink-500/50 transition-colors cursor-pointer bg-slate-950/50">
            <Upload className="w-7 h-7 text-pink-400 mx-auto mb-1" />
            <p className="text-xs font-semibold text-slate-200">Upload a photo</p>
            <p className="text-[10px] text-slate-500 mt-1">JPG, PNG, WEBP up to 50MB</p>
          </button>
          <input ref={mediaFileInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => handleMediaFile(event, "image")} />
          <div className="grid grid-cols-4 gap-2">
            {GALLERY_IMAGES.map((img, i) => (
              <button key={i} onClick={() => { setSelectedImage(img); setGalleryMode("editor"); }} className="aspect-square rounded-xl overflow-hidden border border-slate-700 hover:border-pink-500/60 hover:scale-105 transition-all cursor-pointer">
                <img src={img} alt={`gallery-${i}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <Header title="Image Editor" subtitle="Crop, rotate, filter & text" color="text-pink-400" bg="bg-pink-500/20 border-pink-500/30" icon={<SlidersHorizontal className="w-6 h-6" />} onBack={() => setGalleryMode("grid")} />
        <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 flex items-center justify-center" style={{ transform: `rotate(${rotate}deg)` }}>
          <img src={selectedImage} alt="editing" className="w-full h-48 object-cover" />
          {textOverlay && (
            <span className="absolute inset-0 flex items-center justify-center text-white font-extrabold text-xl drop-shadow-lg pointer-events-none" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}>{textOverlay}</span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Crop className="w-3 h-3" /> Crop {crop}%</label>
            <input type="range" min={0} max={50} value={crop} onChange={(e) => setCrop(Number(e.target.value))} className="w-full accent-pink-400" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><RotateCw className="w-3 h-3" /> Rotate {rotate}°</label>
            <input type="range" min={0} max={360} step={15} value={rotate} onChange={(e) => setRotate(Number(e.target.value))} className="w-full accent-pink-400" />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><SlidersHorizontal className="w-3 h-3" /> Filter Preset</label>
          <div className="flex flex-wrap gap-1.5">
            {["None", "Vivid", "Mono", "Noir", "Warm", "Cool", "Vintage"].map((p) => (
              <button key={p} onClick={() => setFilterPreset(p)} className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer ${filterPreset === p ? "bg-pink-500 text-white" : "bg-slate-800 text-slate-300"}`}>{p}</button>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Type className="w-3 h-3" /> Text Overlay</label>
          <input type="text" value={textOverlay} onChange={(e) => setTextOverlay(e.target.value)} placeholder="Add caption text..." className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-pink-500 focus:outline-none" />
        </div>
        <button onClick={() => { sendEditedImage(); closeHub(); }} className="w-full py-3 rounded-2xl bg-pink-500 text-white font-extrabold hover:bg-pink-400 transition-colors shadow-lg shadow-pink-500/20 flex items-center justify-center gap-2 cursor-pointer">
          <Send className="w-4 h-4" /> Send Photo
        </button>
      </div>
    );
  };

  const renderVideo = () => (
    <div className="space-y-4">
      <Header title="Video Attachment" subtitle="Upload a clip to this chat" color="text-violet-400" bg="bg-violet-500/20 border-violet-500/30" icon={<Film className="w-6 h-6" />} onBack={() => setView("hub")} />
      <button onClick={() => mediaFileInputRef.current?.click()} className="w-full border-2 border-dashed border-violet-500/40 rounded-2xl p-8 text-center hover:bg-violet-500/10 transition-colors cursor-pointer bg-slate-950/50">
        <Film className="w-9 h-9 text-violet-400 mx-auto mb-2" />
        <p className="text-sm font-semibold text-slate-200">Choose a video</p>
        <p className="text-xs text-slate-500 mt-1">MP4, MOV, WEBM up to 50MB</p>
      </button>
      <input ref={mediaFileInputRef} type="file" accept="video/*" className="hidden" onChange={(event) => handleMediaFile(event, "video")} />
    </div>
  );
  /* ---------- Render: Audio sub-view ---------- */
  const renderAudio = () => {
    if (audioMode === "recording") {
      return (
        <div className="space-y-4">
          <Header title="Recording..." subtitle={`${recordingSec}s elapsed`} color="text-amber-400" bg="bg-amber-500/20 border-amber-500/30" icon={<AudioLines className="w-6 h-6" />} onBack={() => setAudioMode("hub")} />
          <div className="flex items-center justify-center py-8">
            <div className="w-24 h-24 rounded-full bg-amber-500/20 border-4 border-amber-500 flex items-center justify-center animate-pulse">
              <Mic className="w-10 h-10 text-amber-400" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => { if (recTimer.current) clearInterval(recTimer.current); setAudioMode("hub"); setRecordingSec(0); }} className="flex-1 py-3 rounded-2xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 cursor-pointer">Cancel</button>
            <button onClick={() => { if (recTimer.current) clearInterval(recTimer.current); sendAudio(`Recorded ${recordingSec}s live`, `0:${String(recordingSec).padStart(2, "0")}`); setAudioMode("hub"); setRecordingSec(0); closeHub(); }} className="flex-1 py-3 rounded-2xl bg-amber-500 text-slate-950 font-extrabold hover:bg-amber-400 cursor-pointer">Send Recording</button>
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <Header title="Audio / Voice Note" subtitle="Record, upload, or synth" color="text-amber-400" bg="bg-amber-500/20 border-amber-500/30" icon={<Mic className="w-6 h-6" />} onBack={() => setView("hub")} />
        <button onClick={() => { setAudioMode("recording"); recTimer.current = setInterval(() => setRecordingSec((s) => s + 1), 1000); }} className="w-full border-2 border-dashed border-amber-500/40 rounded-2xl p-6 text-center hover:bg-amber-500/10 transition-colors cursor-pointer bg-slate-950/50">
          <Mic className="w-8 h-8 text-amber-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-200">Record Live</p>
          <p className="text-xs text-slate-500 mt-1">Tap to start a new voice note</p>
        </button>
        <button onClick={() => showToast("File upload opened")} className="w-full border-2 border-dashed border-slate-700 rounded-2xl p-6 text-center hover:border-amber-500/50 transition-colors cursor-pointer bg-slate-950/50">
          <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-200">Upload Audio File</p>
          <p className="text-xs text-slate-500 mt-1">MP3, WAV, M4A up to 25MB</p>
        </button>
        <div>
          <p className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-amber-400" /> Hymli Voice Synth Presets</p>
          <div className="space-y-2">
            {["Hymli Calm Voice", "Nautical Captain", "Harbor Whisper", "Deep Sea Narrator"].map((p) => (
              <button key={p} onClick={() => { setAudioPreset(p); showToast(`${p} selected`); }} className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${audioPreset === p ? "border-amber-500/60 bg-amber-500/10" : "border-slate-700 bg-slate-800/50 hover:border-slate-500"}`}>
                <span className="flex items-center gap-2 text-xs font-semibold text-slate-200"><AudioLines className="w-4 h-4 text-amber-400" /> {p}</span>
                {audioPreset === p && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => { sendAudio(`Hymli Synth: ${audioPreset}`, "0:08"); closeHub(); }} className="w-full py-3 rounded-2xl bg-amber-500 text-slate-950 font-extrabold hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20 cursor-pointer">
          Generate & Send
        </button>
      </div>
    );
  };

  /* ---------- Render: Location sub-view ---------- */
  const renderLocation = () => (
    <div className="space-y-4">
      <Header title="Location Sharing" subtitle="Share your position" color="text-emerald-400" bg="bg-emerald-500/20 border-emerald-500/30" icon={<MapPin className="w-6 h-6" />} onBack={() => setView("hub")} />
      <div className="rounded-2xl overflow-hidden border border-slate-700 h-44 relative bg-slate-900">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-full bg-[radial-gradient(circle_at_30%_40%,rgba(16,185,129,0.15),transparent_60%),radial-gradient(circle_at_70%_60%,rgba(16,185,129,0.1),transparent_50%)] border border-slate-800 rounded-2xl m-2 flex items-center justify-center">
            <div className="relative">
              <MapPin className="w-10 h-10 text-emerald-400 animate-bounce" />
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <p className="absolute bottom-3 text-[10px] text-slate-500 font-mono">37.7749° N, 122.4194° W</p>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-bold text-slate-400">Choose option</p>
        <button onClick={() => setLocOption("live")} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${locOption === "live" ? "border-emerald-500/60 bg-emerald-500/10" : "border-slate-700 bg-slate-800/50"}`}>
          <LocateFixed className="w-4 h-4 text-emerald-400" />
          <div className="flex-1 text-left">
            <p className="text-xs font-semibold text-slate-200">Share Live Location</p>
            <p className="text-[10px] text-slate-500">Real-time GPS tracking</p>
          </div>
        </button>
        {locOption === "live" && (
          <div className="flex gap-2 pl-10">
            {["15m", "1h", "8h"].map((d) => (
              <button key={d} onClick={() => setLiveDuration(d)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer ${liveDuration === d ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-300"}`}>{d}</button>
            ))}
          </div>
        )}
        <button onClick={() => setLocOption("current")} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${locOption === "current" ? "border-emerald-500/60 bg-emerald-500/10" : "border-slate-700 bg-slate-800/50"}`}>
          <Navigation className="w-4 h-4 text-emerald-400" />
          <div className="flex-1 text-left">
            <p className="text-xs font-semibold text-slate-200">Send Current Location</p>
            <p className="text-[10px] text-slate-500">Static pin drop</p>
          </div>
        </button>
        <button onClick={() => setLocOption("nearby")} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${locOption === "nearby" ? "border-emerald-500/60 bg-emerald-500/10" : "border-slate-700 bg-slate-800/50"}`}>
          <Search className="w-4 h-4 text-emerald-400" />
          <div className="flex-1 text-left">
            <p className="text-xs font-semibold text-slate-200">Search Nearby Places</p>
            <p className="text-[10px] text-slate-500">Restaurants, ports, marinas</p>
          </div>
        </button>
      </div>
      <button onClick={() => { sendLocation(); closeHub(); }} className="w-full py-3 rounded-2xl bg-emerald-500 text-slate-950 font-extrabold hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20 cursor-pointer">
        Share Location
      </button>
    </div>
  );

  /* ---------- Render: Contact Card sub-view ---------- */
  const renderContact = () => (
    <div className="space-y-4">
      <Header title="Contact Card" subtitle="Share a person's details" color="text-indigo-400" bg="bg-indigo-500/20 border-indigo-500/30" icon={<UserIcon className="w-6 h-6" />} onBack={() => setView("hub")} />
      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
        {CONTACTS.map((c) => (
          <button key={c.id} onClick={() => setSelectedContact(c)} className={`w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${selectedContact.id === c.id ? "border-indigo-500/60 bg-indigo-500/10" : "border-slate-700 bg-slate-800/50 hover:border-slate-500"}`}>
            <img src={c.avatar} alt={c.name} className="w-9 h-9 rounded-full object-cover" />
            <div className="flex-1 text-left">
              <p className="text-xs font-semibold text-slate-200">{c.name}</p>
              <p className="text-[10px] text-slate-500">{c.phone}</p>
            </div>
            {selectedContact.id === c.id && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
          </button>
        ))}
      </div>
      <div>
        <p className="text-xs font-bold text-slate-400 mb-2">Include fields</p>
        <div className="space-y-2">
          {[
            { key: "phone" as const, label: "Phone Number", icon: <Phone className="w-3.5 h-3.5" /> },
            { key: "email" as const, label: "Email Address", icon: <Mail className="w-3.5 h-3.5" /> },
            { key: "social" as const, label: "Social Handles", icon: <Globe className="w-3.5 h-3.5" /> },
          ].map((f) => (
            <label key={f.key} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/50 border border-slate-700 cursor-pointer">
              <span className="text-indigo-400">{f.icon}</span>
              <span className="flex-1 text-xs font-semibold text-slate-200">{f.label}</span>
              <input type="checkbox" checked={contactFields[f.key]} onChange={() => setContactFields({ ...contactFields, [f.key]: !contactFields[f.key] })} className="w-4 h-4 accent-indigo-500" />
            </label>
          ))}
        </div>
      </div>
      <button onClick={() => { sendContactCard(); closeHub(); }} className="w-full py-3 rounded-2xl bg-indigo-500 text-white font-extrabold hover:bg-indigo-400 transition-colors shadow-lg shadow-indigo-500/20 cursor-pointer">
        Send Contact Card
      </button>
    </div>
  );

  /* ---------- Render: Poll sub-view ---------- */
  const renderPoll = () => (
    <div className="space-y-4">
      <Header title="Create Poll" subtitle="Ask the fleet" color="text-purple-400" bg="bg-purple-500/20 border-purple-500/30" icon={<Vote className="w-6 h-6" />} onBack={() => setView("hub")} />
      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-400">Poll Question</label>
        <input type="text" value={pollQuestion} onChange={(e) => setPollQuestion(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-semibold text-purple-300 focus:border-purple-500 focus:outline-none" />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400">Options</label>
        {pollOptions.map((opt, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <input type="text" value={opt} onChange={(e) => { const newOpts = [...pollOptions]; newOpts[idx] = e.target.value; setPollOptions(newOpts); }} className="flex-1 p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:border-purple-500 focus:outline-none" />
            {pollOptions.length > 2 && (
              <button onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))} className="p-2 text-rose-400 hover:text-rose-300 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
            )}
          </div>
        ))}
        <button onClick={() => setPollOptions([...pollOptions, `Option ${pollOptions.length + 1}`])} className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs text-purple-300 flex items-center gap-1 hover:bg-slate-700 cursor-pointer"><Plus className="w-3.5 h-3.5" /> Add Option</button>
      </div>
      <div className="space-y-2">
        <label className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700 cursor-pointer">
          <span className="text-xs font-semibold text-slate-200">Allow Multiple Answers</span>
          <input type="checkbox" checked={pollMulti} onChange={() => setPollMulti(!pollMulti)} className="w-4 h-4 accent-purple-500" />
        </label>
        <label className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700 cursor-pointer">
          <span className="text-xs font-semibold text-slate-200">Anonymous Voting</span>
          <input type="checkbox" checked={pollAnonymous} onChange={() => setPollAnonymous(!pollAnonymous)} className="w-4 h-4 accent-purple-500" />
        </label>
      </div>
      <button onClick={() => { sendPoll(); closeHub(); }} className="w-full py-3 rounded-2xl bg-purple-500 text-white font-extrabold hover:bg-purple-400 transition-colors shadow-lg shadow-purple-500/20 cursor-pointer">
        Send Poll
      </button>
    </div>
  );

  /* ---------- Render: Event sub-view ---------- */
  const renderEvent = () => (
    <div className="space-y-4">
      <Header title="Event / Schedule" subtitle="Plan & invite" color="text-blue-400" bg="bg-blue-500/20 border-blue-500/30" icon={<Calendar className="w-6 h-6" />} onBack={() => setView("hub")} />
      <div className="rounded-2xl border border-slate-700 bg-slate-900 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-300">March 2026</span>
          <div className="flex gap-1">
            <button className="p-1 text-slate-400 hover:text-white cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
            <button className="p-1 text-slate-400 hover:text-white cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-bold text-slate-500 mb-1">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <span key={i}>{d}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
            <button key={d} onClick={() => setSelectedDay(d)} className={`aspect-square rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${selectedDay === d ? "bg-blue-500 text-white" : "text-slate-400 hover:bg-slate-800"}`}>{d}</button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400">Date</label>
          <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:border-blue-500 focus:outline-none" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400">Time</label>
          <input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:border-blue-500 focus:outline-none" />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-slate-400">Event Title</label>
        <input type="text" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-blue-300 font-semibold focus:border-blue-500 focus:outline-none" />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-slate-400">Location</label>
        <input type="text" value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:border-blue-500 focus:outline-none" />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Bell className="w-3 h-3" /> Reminder Alert</label>
        <div className="flex gap-1.5">
          {["5 min before", "30 minutes before", "1 hour before", "1 day before"].map((r) => (
            <button key={r} onClick={() => setEventReminder(r)} className={`px-2 py-1 rounded-lg text-[9px] font-bold cursor-pointer ${eventReminder === r ? "bg-blue-500 text-white" : "bg-slate-800 text-slate-300"}`}>{r.replace(" before", "")}</button>
          ))}
        </div>
      </div>
      <button onClick={() => { sendEvent(); closeHub(); }} className="w-full py-3 rounded-2xl bg-blue-500 text-white font-extrabold hover:bg-blue-400 transition-colors shadow-lg shadow-blue-500/20 cursor-pointer">
        Send Event
      </button>
    </div>
  );

  /* ---------- Render: Beacon sub-view ---------- */
  const renderBeacon = () => (
    <div className="space-y-4">
      <Header title="Send Beacon" subtitle="Broadcast to the stream" color="text-teal-400" bg="bg-teal-500/20 border-teal-500/30" icon={<Radio className="w-6 h-6" />} onBack={() => setView("hub")} />
      <div className="space-y-2">
        <button onClick={() => setBeaconOption("instant")} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${beaconOption === "instant" ? "border-teal-500/60 bg-teal-500/10" : "border-slate-700 bg-slate-800/50"}`}>
          <Zap className="w-4 h-4 text-teal-400" />
          <div className="flex-1 text-left">
            <p className="text-xs font-semibold text-slate-200">Cast Instant Story</p>
            <p className="text-[10px] text-slate-500">Broadcast now</p>
          </div>
        </button>
        <button onClick={() => setBeaconOption("anchor")} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${beaconOption === "anchor" ? "border-teal-500/60 bg-teal-500/10" : "border-slate-700 bg-slate-800/50"}`}>
          <AnchorIcon className="w-4 h-4 text-teal-400" />
          <div className="flex-1 text-left">
            <p className="text-xs font-semibold text-slate-200">Anchor to Chat Header</p>
            <p className="text-[10px] text-slate-500">Pin as a persistent banner</p>
          </div>
        </button>
        <button onClick={() => setBeaconOption("schedule")} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${beaconOption === "schedule" ? "border-teal-500/60 bg-teal-500/10" : "border-slate-700 bg-slate-800/50"}`}>
          <Clock className="w-4 h-4 text-teal-400" />
          <div className="flex-1 text-left">
            <p className="text-xs font-semibold text-slate-200">Schedule Beacon Release</p>
            <p className="text-[10px] text-slate-500">Set a future broadcast time</p>
          </div>
        </button>
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-slate-400">Beacon Message</label>
        <textarea value={beaconText} onChange={(e) => setBeaconText(e.target.value)} rows={3} className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-teal-200 focus:border-teal-500 focus:outline-none resize-none" />
      </div>
      {beaconOption === "schedule" && (
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400">Release Time</label>
          <input type="datetime-local" className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:border-teal-500 focus:outline-none" />
        </div>
      )}
      <button onClick={() => { sendBeacon(); closeHub(); }} className="w-full py-3 rounded-2xl bg-teal-500 text-slate-950 font-extrabold hover:bg-teal-400 transition-colors shadow-lg shadow-teal-500/20 cursor-pointer">
        Dispatch Beacon
      </button>
    </div>
  );

  /* ---------- Render: AI Code sub-view ---------- */
  const renderCode = () => (
    <div className="space-y-4">
      <Header title="AI Code Snippet" subtitle="Write, format & send" color="text-slate-300" bg="bg-slate-500/20 border-slate-500/30" icon={<FileCode className="w-6 h-6" />} onBack={() => setView("hub")} />
      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-400">Language</label>
        <div className="flex gap-2">
          {["TypeScript", "Python", "SQL"].map((l) => (
            <button key={l} onClick={() => { setCodeLang(l); if (l === "Python") setCodeContent("def greet_fleet(name: str) -> str:\n    return f\"Ahoy, {name}! ⚓\"\n\nprint(greet_fleet(\"Captain\"))"); if (l === "SQL") setCodeContent("SELECT u.username, COUNT(m.id) AS msg_count\nFROM profiles u\nJOIN messages m ON m.sender_id = u.id\nGROUP BY u.username\nORDER BY msg_count DESC;"); }} className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${codeLang === l ? "bg-slate-200 text-slate-900" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}>{l}</button>
          ))}
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-400 flex items-center gap-1"><Wand2 className="w-3.5 h-3.5 text-slate-300" /> Code Editor</label>
        <div className="rounded-xl overflow-hidden border border-slate-700 bg-[#0d1117]">
          <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 border-b border-slate-800">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="ml-2 text-[10px] text-slate-500 font-mono">{codeLang.toLowerCase()}.txt</span>
          </div>
          <textarea value={codeContent} onChange={(e) => setCodeContent(e.target.value)} rows={7} spellCheck={false} className="w-full p-3 bg-transparent text-xs font-mono text-emerald-300 focus:outline-none resize-none" />
        </div>
      </div>
      <button onClick={() => { showToast("Auto-formatted ✓"); }} className="w-full py-2.5 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold hover:bg-slate-700 transition-colors cursor-pointer flex items-center justify-center gap-2">
        <Sparkles className="w-4 h-4 text-slate-300" /> Auto-Format
      </button>
      <button onClick={() => { sendCode(); closeHub(); }} className="w-full py-3 rounded-2xl bg-slate-200 text-slate-900 font-extrabold hover:bg-white transition-colors shadow-lg cursor-pointer">
        Send Code Snippet
      </button>
    </div>
  );

  /* ---------- Render: GIF & Sticker sub-view ---------- */
  const renderGif = () => {
    const currentItems = gifTab === "gifs" ? filteredGifs : gifTab === "stickers" ? filteredStickers : AI_STICKERS;
    const getLabel = () => (gifTab === "gifs" ? "GIFs" : gifTab === "stickers" ? "Custom Stickers" : "Hymli AI Generated");
    return (
      <div className="space-y-4">
        <Header title="GIF & Sticker Hub" subtitle="Spice up the chat" color="text-yellow-400" bg="bg-yellow-500/20 border-yellow-500/30" icon={<Smile className="w-6 h-6" />} onBack={() => setView("hub")} />
        <div className="flex gap-2">
          {([
            { key: "gifs" as const, label: "GIFs", icon: <Gift className="w-3.5 h-3.5" /> },
            { key: "stickers" as const, label: "Stickers", icon: <Smile className="w-3.5 h-3.5" /> },
            { key: "ai" as const, label: "AI Generated", icon: <Sparkles className="w-3.5 h-3.5" /> },
          ]).map((t) => (
            <button key={t.key} onClick={() => setGifTab(t.key)} className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-[11px] font-bold transition-colors cursor-pointer ${gifTab === t.key ? "bg-yellow-500 text-slate-950" : "bg-slate-800 text-slate-300"}`}>{t.icon} {t.label}</button>
          ))}
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={gifSearch} onChange={(e) => setGifSearch(e.target.value)} placeholder={`Search ${getLabel()}...`} className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-yellow-500 focus:outline-none" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["Trending", "Happy", "Reactions", "Animals", "Nautical"].map((c) => (
            <button key={c} className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer">{c}</button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
          {currentItems.map((url, i) => (
            <button key={i} onClick={() => { sendGif(url, gifTab); closeHub(); }} className="aspect-square rounded-xl overflow-hidden border border-slate-700 hover:border-yellow-500/60 hover:scale-105 transition-all cursor-pointer bg-slate-800">
              {gifTab === "gifs" ? (
                <img src={url} alt={`gif-${i}`} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-2">
                  <img src={url} alt={`sticker-${i}`} className="w-full h-full object-contain" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  };

  /* ---------- Render: Hub grid ---------- */
  const renderHub = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-cyan-400 to-pink-500 animate-pulse" />
            Attachment Hub
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Pick what to send to {contactName || "your contact"}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {TILES.map((t) => (
          <button
            key={t.key}
            onClick={() => setView(t.key)}
            className={`group p-3.5 rounded-2xl bg-gradient-to-br border text-left transition-all hover:scale-[1.03] hover:shadow-xl cursor-pointer ${t.gradient}`}
          >
            <div className="mb-2">{t.icon}</div>
            <p className="text-xs font-bold text-slate-100 group-hover:text-white leading-tight">{t.label}</p>
            <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">{t.desc}</p>
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
          onClick={closeHub}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg max-h-[85vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl text-slate-100 relative"
          >
            {/* Close button */}
            <button onClick={closeHub} className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white z-10 cursor-pointer">
              <X className="w-5 h-5" />
            </button>

            {/* Toast */}
            <AnimatePresence>
              {toast && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-extrabold shadow-lg"
                >
                  {toast}
                </motion.div>
              )}
            </AnimatePresence>

            {view === "hub" && renderHub()}
            {view === "doc" && renderDoc()}
            {view === "camera" && renderCamera()}
            {view === "video" && renderVideo()}
            {view === "audio" && renderAudio()}
            {view === "location" && renderLocation()}
            {view === "contact" && renderContact()}
            {view === "poll" && renderPoll()}
            {view === "event" && renderEvent()}
            {view === "beacon" && renderBeacon()}
            {view === "code" && renderCode()}
            {view === "gif" && renderGif()}
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
    <button onClick={onBack} className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white cursor-pointer shrink-0">
      <ChevronLeft className="w-5 h-5" />
    </button>
    <div className={`p-3 rounded-2xl border ${bg} ${color}`}>{icon}</div>
    <div>
      <h4 className="font-bold text-white text-sm leading-tight">{title}</h4>
      <p className="text-[11px] text-slate-400">{subtitle}</p>
    </div>
  </div>
);

/* ------------------------- Helper: Anchor icon ------------------------- */
const AnchorIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="5" r="3" />
    <line x1="12" y1="22" x2="12" y2="8" />
    <path d="M5 12H2a10 10 0 0 0 20 0h-3" />
  </svg>
);

export default AttachmentHub;

