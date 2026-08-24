import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  ChevronLeft,
  Users,
  Globe,
  Contact,
  Star,
  EyeOff,
  List,
  Search,
  MessageCircle,
  ShieldOff,
  Reply,
  Archive,
  FolderArchive,
  Download,
  Timer,
  Hourglass,
  Gauge,
  Plus,
  BarChart3,
  ListChecks,
  HelpCircle,
  TimerReset,
  MapPin,
  Music,
  Scissors,
  Trash2,
  Camera,
  Image,
  Megaphone,
  Target,
  Clock,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import { Beacon } from "../../types";

type ControlView =
  | "hub"
  | "audience"
  | "viewers"
  | "replies"
  | "autoArchive"
  | "anchorDuration"
  | "interactive"
  | "music"
  | "delete"
  | "saveToCamera"
  | "promote";

interface BeaconControlsProps {
  isOpen: boolean;
  onClose: () => void;
  beacon: Beacon | null;
}

/* ------------------------- Sample Data ------------------------- */
const VIEWERS = [
  { id: "v1", name: "Sara Chen", handle: "@sara_design", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100", online: true },
  { id: "v2", name: "Alex Rivera", handle: "@alex_rivera", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100", online: true },
  { id: "v3", name: "Maya Okafor", handle: "@maya_okafor", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100", online: false },
  { id: "v4", name: "Zeel Ventures", handle: "@zeel_ventures", avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100", online: true },
];

const ANSWER_OPTIONS = [
  { k: "everyone", label: "Allow Replies from Everyone", desc: "Any viewer can reply", icon: <Globe className="w-4 h-4 text-cyan-400" /> },
  { k: "contacts", label: "Contacts Only", desc: "Only your contacts can reply", icon: <Contact className="w-4 h-4 text-emerald-400" /> },
  { k: "off", label: "Turn Off Replies", desc: "Disable replies entirely", icon: <ShieldOff className="w-4 h-4 text-rose-400" /> },
];

/* ====================================================================== */
/*  MAIN COMPONENT                                                         */
/* ====================================================================== */
export const BeaconControls: React.FC<BeaconControlsProps> = ({
  isOpen,
  onClose,
  beacon,
}) => {
  const [view, setView] = useState<ControlView>("hub");
  const [toast, setToast] = useState<string>("");

  // Beacon Audience
  const [audience, setAudience] = useState("Public");
  const [hideFrom, setHideFrom] = useState<string[]>([]);

  // Viewer list
  const [viewerSearch, setViewerSearch] = useState("");
  const [viewerMenu, setViewerMenu] = useState<string | null>(null);
  const [hiddenViewers, setHiddenViewers] = useState<string[]>([]);

  // Replies
  const [replySetting, setReplySetting] = useState("everyone");

  // Auto-Archive
  const [autoArchive, setAutoArchive] = useState(true);

  // Anchor Duration
  const [anchorDuration, setAnchorDuration] = useState("24 Hours");
  const [customAnchorHours, setCustomAnchorHours] = useState(3);

  // Interactive elements
  const [interactiveWidget, setInteractiveWidget] = useState<string>("");

  // Music overlay
  const [musicSearch, setMusicSearch] = useState("");
  const [selectedTrack, setSelectedTrack] = useState("");
  const [trimSeconds, setTrimSeconds] = useState(15);

  // Delete
  const [alsoDeleteArchive, setAlsoDeleteArchive] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Promote / Boost
  const [promoStep, setPromoStep] = useState<"audience" | "duration" | "goal">("audience");
  const [promoAudience, setPromoAudience] = useState("Close Friends");
  const [promoDuration, setPromoDuration] = useState("3 Days");
  const [promoGoal, setPromoGoal] = useState("More Views");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 1800);
  };

  const closeModal = () => {
    setView("hub");
    setViewerMenu(null);
    setDeleting(false);
    onClose();
  };

  const filteredViewers = VIEWERS.filter((v) =>
    v.name.toLowerCase().includes(viewerSearch.toLowerCase()) ||
    v.handle.toLowerCase().includes(viewerSearch.toLowerCase())
  );

  const SAMPLE_TRACKS = [
    { title: "Horizon Lines", artist: "Nova Reef", len: "2:34", uses: "12.4k" },
    { title: "Deep Current", artist: "Mara Waves", len: "3:01", uses: "8.9k" },
    { title: "Salt & Sun", artist: "Coastline", len: "2:12", uses: "21.7k" },
    { title: "Anchored", artist: "Harbor Lights", len: "3:45", uses: "5.2k" },
  ].filter((t) =>
    t.title.toLowerCase().includes(musicSearch.toLowerCase()) ||
    t.artist.toLowerCase().includes(musicSearch.toLowerCase())
  );

  /* ------------------------- Render helpers ------------------------- */
  const renderAudience = () => (
    <div className="space-y-4">
      <Header title="Beacon Audience" subtitle="Who can see this beacon" color="text-cyan-400" bg="bg-cyan-500/20 border-cyan-500/30" icon={<Users className="w-6 h-6" />} onBack={() => setView("hub")} />
      <div className="space-y-2">
        {[
          { k: "Public", desc: "Visible to everyone", icon: <Globe className="w-4 h-4 text-cyan-400" /> },
          { k: "Contacts Only", desc: "Only your contacts", icon: <Contact className="w-4 h-4 text-emerald-400" /> },
          { k: "The Manifest", desc: "A select circle", icon: <Star className="w-4 h-4 text-amber-400" /> },
          { k: "Hide Beacon From...", desc: "Exclude specific people", icon: <EyeOff className="w-4 h-4 text-rose-400" /> },
        ].map((opt) => (
          <button key={opt.k} onClick={() => { setAudience(opt.k); showToast(`Audience: ${opt.k}`); }} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${audience === opt.k ? "border-cyan-500/60 bg-cyan-500/10" : "border-slate-700 bg-slate-800/50"}`}>
            {opt.icon}
            <div className="flex-1 text-left">
              <p className="text-xs font-semibold text-slate-200">{opt.k}</p>
              <p className="text-[10px] text-slate-500">{opt.desc}</p>
            </div>
            {audience === opt.k && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
          </button>
        ))}
      </div>
      {audience === "Hide Beacon From..." && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-400">Select people to hide from</p>
          {VIEWERS.map((v) => (
            <button key={v.id} onClick={() => setHideFrom(prev => prev.includes(v.name) ? prev.filter(x => x !== v.name) : [...prev, v.name])} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${hideFrom.includes(v.name) ? "border-rose-500/60 bg-rose-500/10" : "border-slate-700 bg-slate-800/50"}`}>
              <img src={v.avatar} alt={v.name} className="w-8 h-8 rounded-full object-cover" />
              <div className="flex-1 text-left">
                <p className="text-xs font-semibold text-slate-200">{v.name}</p>
                <p className="text-[10px] text-slate-500">{v.handle}</p>
              </div>
              {hideFrom.includes(v.name) && <CheckCircle2 className="w-4 h-4 text-rose-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const renderViewers = () => (
    <div className="space-y-4">
      <Header title="Beacon Viewer List" subtitle="Who viewed this beacon" color="text-indigo-400" bg="bg-indigo-500/20 border-indigo-500/30" icon={<List className="w-6 h-6" />} onBack={() => setView("hub")} />
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="text" value={viewerSearch} onChange={(e) => setViewerSearch(e.target.value)} placeholder="Search viewers..." className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-indigo-500 focus:outline-none" />
      </div>
      <div className="space-y-2">
        {filteredViewers.map((v) => (
          <div key={v.id} className="p-3 rounded-xl bg-slate-800/50 border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img src={v.avatar} alt={v.name} className="w-10 h-10 rounded-full object-cover" />
                {v.online && <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900" />}
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-200">{v.name}</p>
                <p className="text-[10px] text-slate-500">{v.handle} • {v.online ? "Online" : "Away"}</p>
              </div>
              <button onClick={() => setViewerMenu(viewerMenu === v.id ? null : v.id)} className="p-2 rounded-full bg-slate-900 text-slate-400 hover:text-white cursor-pointer">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            {viewerMenu === v.id && (
              <div className="mt-2 pt-2 border-t border-slate-700 space-y-2">
                <button onClick={() => showToast(`Messaging ${v.name}`)} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 text-xs text-slate-200 hover:bg-slate-700 cursor-pointer">
                  <MessageCircle className="w-3.5 h-3.5 text-cyan-400" /> Direct Message
                </button>
                <button onClick={() => { setHiddenViewers(prev => prev.includes(v.id) ? prev : [...prev, v.id]); showToast(`Hiding future beacons from ${v.name}`); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 text-xs text-rose-300 hover:bg-slate-700 cursor-pointer">
                  <EyeOff className="w-3.5 h-3.5" /> Hide Future Beacons
                </button>
              </div>
            )}
          </div>
        ))}
        {filteredViewers.length === 0 && <p className="text-xs text-slate-500 text-center py-4">No viewers found.</p>}
      </div>
    </div>
  );

  const renderReplies = () => (
    <div className="space-y-4">
      <Header title="Replies & Reactions Settings" subtitle="Control engagement" color="text-emerald-400" bg="bg-emerald-500/20 border-emerald-500/30" icon={<Reply className="w-6 h-6" />} onBack={() => setView("hub")} />
      <div className="space-y-2">
        {ANSWER_OPTIONS.map((opt) => (
          <button key={opt.k} onClick={() => { setReplySetting(opt.k); showToast(opt.label); }} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${replySetting === opt.k ? "border-emerald-500/60 bg-emerald-500/10" : "border-slate-700 bg-slate-800/50"}`}>
            {opt.icon}
            <div className="flex-1 text-left">
              <p className="text-xs font-semibold text-slate-200">{opt.label}</p>
              <p className="text-[10px] text-slate-500">{opt.desc}</p>
            </div>
            {replySetting === opt.k && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          </button>
        ))}
      </div>
    </div>
  );

  const renderAutoArchive = () => (
    <div className="space-y-4">
      <Header title="Auto-Archive Settings" subtitle="Save beacons after expiry" color="text-purple-400" bg="bg-purple-500/20 border-purple-500/30" icon={<Archive className="w-6 h-6" />} onBack={() => setView("hub")} />
      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/50 border border-slate-700">
        <div>
          <p className="text-xs font-semibold text-slate-200">Auto-Archive</p>
          <p className="text-[10px] text-slate-500">{autoArchive ? "On" : "Off"}</p>
        </div>
        <button onClick={() => setAutoArchive(!autoArchive)} className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer ${autoArchive ? "bg-purple-500" : "bg-slate-600"}`}>
          <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${autoArchive ? "translate-x-5" : ""}`} />
        </button>
      </div>
      <div className="space-y-2">
        <button onClick={() => showToast("Opening archived beacons")} className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-purple-500/40 cursor-pointer">
          <FolderArchive className="w-4 h-4 text-purple-400" />
          <div className="flex-1 text-left">
            <p className="text-xs font-semibold text-slate-200">View Archived Beacons</p>
            <p className="text-[10px] text-slate-500">Browse your saved highlights</p>
          </div>
        </button>
        <button onClick={() => showToast("Archive export started")} className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-purple-500/40 cursor-pointer">
          <Download className="w-4 h-4 text-cyan-400" />
          <div className="flex-1 text-left">
            <p className="text-xs font-semibold text-slate-200">Export Archive</p>
            <p className="text-[10px] text-slate-500">Download all archived beacons</p>
          </div>
        </button>
      </div>
    </div>
  );

  const renderAnchorDuration = () => (
    <div className="space-y-4">
      <Header title="Anchor Duration" subtitle="How long this beacon stays" color="text-amber-400" bg="bg-amber-500/20 border-amber-500/30" icon={<Timer className="w-6 h-6" />} onBack={() => setView("hub")} />
      <div className="space-y-2">
        {["1 Hour", "12 Hours", "24 Hours", "Custom Anchor Time"].map((d) => (
          <button key={d} onClick={() => { setAnchorDuration(d); showToast(`Duration: ${d}`); }} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${anchorDuration === d ? "border-amber-500/60 bg-amber-500/10" : "border-slate-700 bg-slate-800/50"}`}>
            {d === "1 Hour" ? <Hourglass className="w-4 h-4 text-emerald-400" /> : d === "12 Hours" ? <Clock className="w-4 h-4 text-cyan-400" /> : d === "24 Hours" ? <Timer className="w-4 h-4 text-amber-400" /> : <Gauge className="w-4 h-4 text-indigo-400" />}
            <div className="flex-1 text-left">
              <p className="text-xs font-semibold text-slate-200">{d}</p>
            </div>
            {anchorDuration === d && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
          </button>
        ))}
      </div>
      {anchorDuration === "Custom Anchor Time" && (
        <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700 flex items-center gap-3">
          <span className="text-xs text-slate-300 font-semibold">Hours:</span>
          <input type="number" min="1" value={customAnchorHours} onChange={(e) => setCustomAnchorHours(Math.max(1, Number(e.target.value) || 1))} className="w-20 p-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-500" />
        </div>
      )}
    </div>
  );

  const renderInteractive = () => (
    <div className="space-y-4">
      <Header title="Add Interactive Element" subtitle="Boost engagement" color="text-pink-400" bg="bg-pink-500/20 border-pink-500/30" icon={<Plus className="w-6 h-6" />} onBack={() => setView("hub")} />
      <div className="grid grid-cols-2 gap-2">
        {[
          { k: "Poll", icon: <BarChart3 className="w-5 h-5 text-cyan-400" /> },
{ k: "Question Box", icon: <HelpCircle className="w-5 h-5 text-amber-400" /> },
          { k: "Countdown Timer", icon: <TimerReset className="w-5 h-5 text-rose-400" /> },
          { k: "Location Sticker", icon: <MapPin className="w-5 h-5 text-emerald-400" /> },
        ].map((w) => (
          <button key={w.k} onClick={() => { setInteractiveWidget(w.k); showToast(`${w.k} added`); }} className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all cursor-pointer ${interactiveWidget === w.k ? "border-pink-500/60 bg-pink-500/10" : "border-slate-700 bg-slate-800/50 hover:border-pink-500/40"}`}>
            {w.icon}
            <span className="text-[11px] font-bold text-slate-200">{w.k}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const renderMusic = () => (
    <div className="space-y-4">
      <Header title="Beacon Music Overlay" subtitle="Add a soundtrack" color="text-rose-400" bg="bg-rose-500/20 border-rose-500/30" icon={<Music className="w-6 h-6" />} onBack={() => setView("hub")} />
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="text" value={musicSearch} onChange={(e) => setMusicSearch(e.target.value)} placeholder="Search audio library..." className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-rose-500 focus:outline-none" />
      </div>
      <div className="space-y-2">
        {SAMPLE_TRACKS.map((t) => (
          <button key={t.title} onClick={() => { setSelectedTrack(t.title); showToast(`Selected ${t.title}`); }} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${selectedTrack === t.title ? "border-rose-500/60 bg-rose-500/10" : "border-slate-700 bg-slate-800/50"}`}>
            <span className="p-2 rounded-lg bg-slate-900 text-rose-400"><Music className="w-4 h-4" /></span>
            <div className="flex-1 text-left">
              <p className="text-xs font-semibold text-slate-200">{t.title}</p>
              <p className="text-[10px] text-slate-500">{t.artist} • {t.len} • {t.uses} uses</p>
            </div>
            {selectedTrack === t.title && <CheckCircle2 className="w-4 h-4 text-rose-400" />}
          </button>
        ))}
      </div>
      {selectedTrack && (
        <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-200 flex items-center gap-1.5"><Scissors className="w-3.5 h-3.5 text-rose-400" /> Snippet Trimmer</p>
            <span className="text-xs font-bold text-rose-400">{trimSeconds}s</span>
          </div>
          <input type="range" min="5" max="30" value={trimSeconds} onChange={(e) => setTrimSeconds(Number(e.target.value))} className="w-full accent-rose-500 cursor-pointer" />
          <div className="flex justify-between text-[10px] text-slate-500"><span>5s</span><span>15s</span><span>30s</span></div>
          <button onClick={() => showToast(`Trimmed ${trimSeconds}s of audio`)} className="w-full py-2.5 rounded-xl bg-rose-500 text-white font-bold text-xs hover:bg-rose-400 cursor-pointer">Apply {trimSeconds}s Snippet</button>
        </div>
      )}
    </div>
  );

  const renderDelete = () => (
    <div className="space-y-4">
      <Header title="Delete Beacon" subtitle="This cannot be undone" color="text-rose-400" bg="bg-rose-500/20 border-rose-500/30" icon={<Trash2 className="w-6 h-6" />} onBack={() => setView("hub")} />
      <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/40 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
        <p className="text-xs text-rose-300 leading-relaxed">Deleting this beacon will permanently remove it and its comments, likes, and reactions from the harbor.</p>
      </div>
      <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700 cursor-pointer">
        <input type="checkbox" checked={alsoDeleteArchive} onChange={(e) => setAlsoDeleteArchive(e.target.checked)} className="rounded border-slate-600 text-rose-500 focus:ring-0" />
        <span className="text-xs font-semibold text-slate-200">Also delete from highlight archive</span>
      </label>
      <button onClick={() => { setDeleting(true); setTimeout(() => { setDeleting(false); showToast("Beacon deleted"); }, 1200); }} disabled={deleting} className="w-full py-3 rounded-2xl bg-rose-500 text-white font-extrabold hover:bg-rose-400 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer">
        {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        {deleting ? "Deleting..." : "Delete Beacon"}
      </button>
    </div>
  );

  const renderSaveToCamera = () => (
    <div className="space-y-4">
      <Header title="Save to Camera Roll" subtitle="Download to your device" color="text-emerald-400" bg="bg-emerald-500/20 border-emerald-500/30" icon={<Camera className="w-6 h-6" />} onBack={() => setView("hub")} />
      <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700 flex items-center gap-3">
        <span className="p-3 rounded-xl bg-slate-900 text-emerald-400"><Image className="w-5 h-5" /></span>
        <div>
          <p className="text-xs font-bold text-slate-200">Save this beacon</p>
          <p className="text-[10px] text-slate-500">Saves the current beacon to your device gallery</p>
        </div>
      </div>
      <button onClick={() => showToast("Saved to Camera Roll ✓")} className="w-full py-3 rounded-2xl bg-emerald-500 text-slate-950 font-extrabold hover:bg-emerald-400 flex items-center justify-center gap-2 cursor-pointer">
        <Camera className="w-4 h-4" /> Save to Camera Roll
      </button>
    </div>
  );

  const renderPromote = () => (
    <div className="space-y-4">
      <Header title="Promote / Boost Beacon" subtitle="Reach more viewers" color="text-amber-400" bg="bg-amber-500/20 border-amber-500/30" icon={<Megaphone className="w-6 h-6" />} onBack={() => setView("hub")} />
      <div className="flex gap-1.5">
        {(["audience", "duration", "goal"] as const).map((step, i) => (
          <button key={step} onClick={() => setPromoStep(step)} className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase transition-colors cursor-pointer ${promoStep === step ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-slate-400"}`}>
            {i + 1}. {step}
          </button>
        ))}
      </div>
      {promoStep === "audience" && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-400">Select Target Audience</p>
          {["Close Friends", "Contacts", "Everyone", "Custom Audience"].map((a) => (
            <button key={a} onClick={() => setPromoAudience(a)} className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${promoAudience === a ? "border-amber-500/60 bg-amber-500/10" : "border-slate-700 bg-slate-800/50"}`}>
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-2"><Target className="w-3.5 h-3.5 text-amber-400" /> {a}</span>
              {promoAudience === a && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
            </button>
          ))}
        </div>
      )}
      {promoStep === "duration" && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-400">Boost Duration</p>
          {["1 Day", "3 Days", "7 Days"].map((d) => (
            <button key={d} onClick={() => setPromoDuration(d)} className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${promoDuration === d ? "border-amber-500/60 bg-amber-500/10" : "border-slate-700 bg-slate-800/50"}`}>
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-amber-400" /> {d}</span>
              {promoDuration === d && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
            </button>
          ))}
        </div>
      )}
      {promoStep === "goal" && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-400">Campaign Goal</p>
          {["More Views", "More Replies", "More Profile Visits"].map((g) => (
            <button key={g} onClick={() => setPromoGoal(g)} className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${promoGoal === g ? "border-amber-500/60 bg-amber-500/10" : "border-slate-700 bg-slate-800/50"}`}>
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-2"><BarChart3 className="w-3.5 h-3.5 text-amber-400" /> {g}</span>
              {promoGoal === g && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
            </button>
          ))}
        </div>
      )}
      <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700 flex items-center justify-between text-xs">
        <span className="text-slate-400">Estimated reach:</span>
        <span className="font-bold text-amber-400">+2,400 harbor members</span>
      </div>
      <button onClick={() => showToast("Boost campaign launched 🚀")} className="w-full py-3 rounded-2xl bg-amber-500 text-slate-950 font-extrabold hover:bg-amber-400 cursor-pointer">Launch Boost</button>
    </div>
  );

  /* ------------------------- Hub grid ------------------------- */
  const renderHub = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-cyan-400 to-pink-500 animate-pulse" />
            Beacon Controls
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Manage this live beacon</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {[
          { k: "audience" as const, label: "Beacon Audience", icon: <Users className="w-5 h-5" />, grad: "from-cyan-500/20 to-blue-500/10 border-cyan-500/30 text-cyan-400" },
          { k: "viewers" as const, label: "Beacon Viewer List", icon: <List className="w-5 h-5" />, grad: "from-indigo-500/20 to-violet-500/10 border-indigo-500/30 text-indigo-400" },
          { k: "replies" as const, label: "Replies & Reactions", icon: <Reply className="w-5 h-5" />, grad: "from-emerald-500/20 to-green-500/10 border-emerald-500/30 text-emerald-400" },
          { k: "autoArchive" as const, label: "Auto-Archive Settings", icon: <Archive className="w-5 h-5" />, grad: "from-purple-500/20 to-fuchsia-500/10 border-purple-500/30 text-purple-400" },
          { k: "anchorDuration" as const, label: "Anchor Duration", icon: <Timer className="w-5 h-5" />, grad: "from-amber-500/20 to-yellow-500/10 border-amber-500/30 text-amber-400" },
          { k: "interactive" as const, label: "Add Interactive Element", icon: <Plus className="w-5 h-5" />, grad: "from-pink-500/20 to-rose-500/10 border-pink-500/30 text-pink-400" },
          { k: "music" as const, label: "Beacon Music Overlay", icon: <Music className="w-5 h-5" />, grad: "from-rose-500/20 to-red-500/10 border-rose-500/30 text-rose-400" },
          { k: "delete" as const, label: "Delete Beacon", icon: <Trash2 className="w-5 h-5" />, grad: "from-red-500/20 to-rose-600/10 border-red-500/30 text-red-400" },
          { k: "saveToCamera" as const, label: "Save to Camera Roll", icon: <Camera className="w-5 h-5" />, grad: "from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400" },
          { k: "promote" as const, label: "Promote / Boost Beacon", icon: <Megaphone className="w-5 h-5" />, grad: "from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400" },
        ].map((tile) => (
          <button key={tile.k} onClick={() => setView(tile.k)} className={`group p-3.5 rounded-2xl bg-gradient-to-br border text-left transition-all hover:scale-[1.03] hover:shadow-xl cursor-pointer ${tile.grad}`}>
            <div className="mb-2">{tile.icon}</div>
            <p className="text-[11px] font-bold text-slate-100 group-hover:text-white leading-tight">{tile.label}</p>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && beacon && (
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
            <button onClick={closeModal} className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white z-10 cursor-pointer">
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
            {view === "audience" && renderAudience()}
            {view === "viewers" && renderViewers()}
            {view === "replies" && renderReplies()}
            {view === "autoArchive" && renderAutoArchive()}
            {view === "anchorDuration" && renderAnchorDuration()}
            {view === "interactive" && renderInteractive()}
            {view === "music" && renderMusic()}
            {view === "delete" && renderDelete()}
            {view === "saveToCamera" && renderSaveToCamera()}
            {view === "promote" && renderPromote()}
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

export default BeaconControls;
