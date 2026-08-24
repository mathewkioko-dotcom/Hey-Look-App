import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  ChevronLeft,
  User,
  Type,
  AlignLeft,
  AtSign,
  Radio,
  Anchor,
  Timer,
  QrCode,
  ScanLine,
  Link2,
  Copy,
  MonitorSmartphone,
  Link as LinkIcon,
  LogOut,
  Star,
  Film,
  Bookmark,
  Database,
  Wifi,
  Download,
  Sun,
  Moon,
  Palette,
  Droplets,
  Languages,
  CalendarDays,
  Clock,
  HelpCircle,
  Search,
  AlertTriangle,
  FileText,
  Activity,
  Repeat,
  Plus,
  CheckCircle2,
  Smartphone,
  Laptop,
  Globe,
  Camera,
  Upload,
  Phone,
} from "lucide-react";
import { Profile, OAuthProvider, NauticalPresenceState } from "../../types";
import { feedService } from "../../services/feedService";
import { supabase } from "../../lib/supabase";

type SettingsView =
  | "hub"
  | "editProfile"
  | "accountStatus"
  | "qrCode"
  | "linkedDevices"
  | "savedItems"
  | "dataStorage"
  | "themeAppearance"
  | "languageRegion"
  | "helpSupport"
  | "accountSwitcher";

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Profile;
  onUpdateProfile: (updated: Partial<Profile>) => void;
  isDark: boolean;
  onToggleTheme: () => void;
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
  { key: "editProfile", label: "Edit Profile", desc: "Avatar, name, bio, handle", icon: <User className="w-6 h-6" />, gradient: "from-cyan-500/20 to-blue-500/10 border-cyan-500/30 text-cyan-400" },
  { key: "accountStatus", label: "Account Status", desc: "Presence & custom status", icon: <Radio className="w-6 h-6" />, gradient: "from-emerald-500/20 to-green-500/10 border-emerald-500/30 text-emerald-400" },
  { key: "qrCode", label: "QR Code & Link", desc: "Scan, share profile link", icon: <QrCode className="w-6 h-6" />, gradient: "from-indigo-500/20 to-violet-500/10 border-indigo-500/30 text-indigo-400" },
  { key: "linkedDevices", label: "Linked Devices", desc: "Manage web sessions", icon: <MonitorSmartphone className="w-6 h-6" />, gradient: "from-purple-500/20 to-fuchsia-500/10 border-purple-500/30 text-purple-400" },
  { key: "savedItems", label: "Saved Items", desc: "Starred, reels, beacons", icon: <Bookmark className="w-6 h-6" />, gradient: "from-pink-500/20 to-rose-500/10 border-pink-500/30 text-pink-400" },
  { key: "dataStorage", label: "Data & Storage", desc: "Usage analytics", icon: <Database className="w-6 h-6" />, gradient: "from-teal-500/20 to-cyan-500/10 border-teal-500/30 text-teal-400" },
  { key: "themeAppearance", label: "Theme & Appearance", desc: "Dark, light, accent", icon: <Palette className="w-6 h-6" />, gradient: "from-amber-500/20 to-yellow-500/10 border-amber-500/30 text-amber-400" },
  { key: "languageRegion", label: "Language & Region", desc: "Locale, time format", icon: <Languages className="w-6 h-6" />, gradient: "from-blue-500/20 to-sky-500/10 border-blue-500/30 text-blue-400" },
  { key: "helpSupport", label: "Help & Support", desc: "FAQ, report, diagnostics", icon: <HelpCircle className="w-6 h-6" />, gradient: "from-slate-500/20 to-zinc-500/10 border-slate-500/30 text-slate-300" },
  { key: "accountSwitcher", label: "Account Switcher", desc: "Add & switch accounts", icon: <Repeat className="w-6 h-6" />, gradient: "from-rose-500/20 to-red-500/10 border-rose-500/30 text-rose-400" },
];

/* ------------------------- Sample Data ------------------------- */
const LINKED_DEVICES = [
  { id: "d1", name: "MacBook Pro", type: "Laptop", location: "Nairobi, KE", lastActive: "Active now", icon: <Laptop className="w-4 h-4" /> },
  { id: "d2", name: "iPhone 15", type: "Smartphone", location: "Nairobi, KE", lastActive: "2h ago", icon: <Smartphone className="w-4 h-4" /> },
  { id: "d3", name: "Chrome on Windows", type: "Web Session", location: "Barcelona, ES", lastActive: "Yesterday", icon: <Globe className="w-4 h-4" /> },
];

const SAVED_ITEMS = [
  { key: "messages", label: "Starred Messages", count: 24, icon: <Star className="w-5 h-5" />, color: "text-amber-400" },
  { key: "reels", label: "Saved Reels", count: 18, icon: <Film className="w-5 h-5" />, color: "text-pink-400" },
  { key: "beacons", label: "Anchored Beacons", count: 9, icon: <Anchor className="w-5 h-5" />, color: "text-cyan-400" },
];

const STARRED_MESSAGES = [
  { id: "m1", sender: "Sara Chen", text: "The anchor is set for Monday's fleet meeting at 10am ⚓", time: "Mon" },
  { id: "m2", sender: "Alex Rivera", text: "Please review the Q3 nautical report before the review.", time: "Sun" },
  { id: "m3", sender: "Maya Okafor", text: "Shipped the new harbor update to staging 🚢", time: "Sat" },
];

const SAVED_REELS = [
  { id: "r1", title: "Sunset over Sydney Harbor", views: "12.4k", thumb: "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=200" },
  { id: "r2", title: "Dock walk at dawn", views: "8.1k", thumb: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200" },
  { id: "r3", title: "Wave crashing timelapse", views: "21.7k", thumb: "https://images.unsplash.com/photo-1506863530036-1efeddceb993?w=200" },
];

const ANCHORED_BEACONS = [
  { id: "b1", title: "Setting sail on a new adventure! ⛵", time: "2d ago", views: 142 },
  { id: "b2", title: "Harbor party this Friday 🎉", time: "5d ago", views: 98 },
  { id: "b3", title: "New fleet decal drop 🔥", time: "1w ago", views: 210 },
];

const FAQ_ITEMS = [
  { q: "How do I create a poll?", a: "Open a chat, tap the + button, select Create Poll, add options, and send." },
  { q: "What do the nautical statuses mean?", a: "In Focus = active, Adrift = away, Last Anchored = last seen timestamp." },
  { q: "How do vanishing messages work?", a: "Messages with a burn_at timestamp are auto-deleted by the pg_cron purge job." },
];

/* ====================================================================== */
/*  MAIN COMPONENT                                                         */
/* ====================================================================== */
export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateProfile,
  isDark,
  onToggleTheme,
}) => {
  const [view, setView] = useState<SettingsView>("hub");
  const [toast, setToast] = useState<string>("");

  // Edit Profile state
  const [editSub, setEditSub] = useState<"list" | "avatar" | "name" | "bio" | "handle" | "phone">("list");
  const [avatarInput, setAvatarInput] = useState(currentUser.avatar_url || "");
  const [avatarZoom, setAvatarZoom] = useState(1);
  const [avatarFilter, setAvatarFilter] = useState("none");
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const deviceInputRef = useRef<HTMLInputElement>(null);
  const [nameInput, setNameInput] = useState(currentUser.full_name || "");
  const [bioInput, setBioInput] = useState(currentUser.bio || "");
  const [handleInput, setHandleInput] = useState(currentUser.username || "");
  const [phoneInput, setPhoneInput] = useState(currentUser.phone_number || "");

  // Account Status
  const [statusOption, setStatusOption] = useState<"focus" | "adrift" | "custom" | "timer">("focus");
  const [customStatusText, setCustomStatusText] = useState("In Focus");
  const [autoClear, setAutoClear] = useState("1 hour");

  // QR Code
  const [qrTab, setQrTab] = useState<"mine" | "scan">("mine");

  // Linked Devices
  const [devices, setDevices] = useState(LINKED_DEVICES);

  // Saved Items
  const [savedFolder, setSavedFolder] = useState<"messages" | "reels" | "beacons">("messages");

  // Data & Storage
  const [dataSub, setDataSub] = useState<"overview" | "storage" | "network" | "download">("overview");
  const [autoDownload, setAutoDownload] = useState("Wifi Only");

  // Theme
  const [themeSub, setThemeSub] = useState<"list" | "dark" | "light" | "nautical" | "custom">("list");
  const [accentColor, setAccentColor] = useState("#06b6d4");

  // Language
  const [langSub, setLangSub] = useState<"list" | "language" | "week" | "time">("list");
  const [appLanguage, setAppLanguage] = useState("English (US)");
  const [firstDay, setFirstDay] = useState("Sunday");
  const [timeFormat, setTimeFormat] = useState("12h");

  // Help
  const [helpView, setHelpView] = useState<"list" | "faq" | "report" | "terms" | "diagnostics">("list");
  const [faqSearch, setFaqSearch] = useState("");

  // Account Switcher
  const [accounts] = useState([
    { id: "a1", name: currentUser.full_name, handle: `@${currentUser.username}`, avatar: currentUser.avatar_url, active: true, provider: "email" },
    { id: "a2", name: "Sara Chen Studio", handle: "@sara_design", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100", active: false, provider: "google" },
    { id: "a3", name: "Zeel Ventures", handle: "@zeel_ventures", avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100", active: false, provider: "google" },
  ]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 1800);
  };

  const closeModal = () => {
    setView("hub");
    setEditSub("list");
    setThemeSub("list");
    setLangSub("list");
    setHelpView("list");
    onClose();
  };

  const handleGoogleSignIn = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}` },
      });
      if (error) {
        showToast(`OAuth notice: ${error.message}`);
      } else if (data?.url) {
        window.location.href = data.url;
      } else {
        showToast("Google sign-in initiated");
      }
    } catch (err: any) {
      showToast(`Auth notice: ${err?.message || "Connection initiated"}`);
    }
  };

  const saveProfile = async (updates: Partial<Profile>) => {
    onUpdateProfile(updates);
    const saved = await feedService.updateProfile(currentUser.id, updates);
    showToast(saved ? "Profile saved ✓" : "Profile could not be saved");
  };

  const handleAvatarFile = async (file?: File) => {
    if (!file || !file.type.startsWith("image/")) {
      showToast("Please choose an image file");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      showToast("Image must be smaller than 8 MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setAvatarInput(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const saveAvatarWithEdits = async () => {
    if (!avatarInput) return;
    if (!avatarInput.startsWith("data:image/")) {
      await saveProfile({ avatar_url: avatarInput });
      return;
    }
    try {
      const image = new Image();
      image.src = avatarInput;
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = reject;
      });
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 512;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas unavailable");
      const scale = Math.max(canvas.width / image.width, canvas.height / image.height) * avatarZoom;
      const width = image.width * scale;
      const height = image.height * scale;
      const filterMap: Record<string, string> = {
        none: "none",
        vivid: "saturate(1.45) contrast(1.08)",
        noir: "grayscale(1) contrast(1.25)",
        warm: "sepia(.25) saturate(1.25)",
        cool: "hue-rotate(18deg) saturate(1.15)",
      };
      context.filter = filterMap[avatarFilter] || "none";
      context.drawImage(image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Could not process image")), "image/jpeg", 0.9));
      const path = `avatars/${currentUser.id}/${Date.now()}.jpg`;
      const { error } = await supabase.storage.from("chat-media").upload(path, blob, { upsert: false, contentType: "image/jpeg" });
      if (error) throw error;
      const { data } = supabase.storage.from("chat-media").getPublicUrl(path);
      await saveProfile({ avatar_url: data.publicUrl });
      setAvatarInput(data.publicUrl);
      showToast("Avatar updated");
    } catch (error: any) {
      showToast(`Avatar upload failed: ${error?.message || "Try again"}`);
    }
  };

  /* ---------- Render helpers ---------- */
  const renderEditProfile = () => {
    if (editSub !== "list") {
      const back = () => setEditSub("list");
      if (editSub === "avatar") {
        return (
          <div className="space-y-4">
            <Header title="Change Avatar" subtitle="Update your profile picture" color="text-cyan-400" bg="bg-cyan-500/20 border-cyan-500/30" icon={<User className="w-6 h-6" />} onBack={back} />
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-cyan-500/40 shadow-xl">
                <img src={avatarInput || currentUser.avatar_url} alt="avatar" className="w-full h-full object-cover" style={{ transform: `scale(${avatarZoom})`, filter: avatarFilter === "noir" ? "grayscale(1) contrast(1.25)" : avatarFilter === "vivid" ? "saturate(1.45) contrast(1.08)" : avatarFilter === "warm" ? "sepia(.25) saturate(1.25)" : avatarFilter === "cool" ? "hue-rotate(18deg) saturate(1.15)" : "none" }} />
              </div>
              <label className="w-full text-xs font-bold text-slate-400">Crop / Zoom: {avatarZoom.toFixed(1)}x</label>
              <input type="range" min="1" max="2.5" step="0.1" value={avatarZoom} onChange={(e) => setAvatarZoom(Number(e.target.value))} className="w-full accent-cyan-500" />
              <div className="w-full space-y-1">
                <label className="text-xs font-bold text-slate-400">Hymli AI Filters</label>
                <div className="flex flex-wrap gap-2">{[["none", "Original"], ["vivid", "Vivid"], ["noir", "Noir"], ["warm", "Warm"], ["cool", "Cool"]].map(([value, label]) => <button key={value} type="button" onClick={() => setAvatarFilter(value)} className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border ${avatarFilter === value ? "border-cyan-400 bg-cyan-500/20 text-cyan-300" : "border-slate-700 text-slate-400"}`}>{label}</button>)}</div>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-800 border border-slate-700 hover:border-cyan-500/50 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-cyan-400" />
                  Take Photo
                </button>
                <button
                  type="button"
                  onClick={() => deviceInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-800 border border-slate-700 hover:border-cyan-500/50 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-cyan-400" />
                  Upload from Device
                </button>
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  className="hidden"
                  onChange={(e) => {
                    void handleAvatarFile(e.target.files?.[0]);
                    e.currentTarget.value = "";
                  }}
                />
                <input
                  ref={deviceInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    void handleAvatarFile(e.target.files?.[0]);
                    e.currentTarget.value = "";
                  }}
                />
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {["https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200", "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200", "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200"].map((url) => (
                  <button key={url} onClick={() => setAvatarInput(url)} className={`w-14 h-14 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${avatarInput === url ? "border-cyan-400 scale-110" : "border-slate-700 hover:border-slate-500"}`}>
                    <img src={url} alt="preset" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
              <input type="text" value={avatarInput} onChange={(e) => setAvatarInput(e.target.value)} placeholder="Paste image URL..." className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none" />
            </div>
            <button onClick={() => { void saveAvatarWithEdits(); }} className="w-full py-3 rounded-2xl bg-cyan-500 text-slate-950 font-extrabold hover:bg-cyan-400 transition-colors cursor-pointer">Save Avatar</button>
          </div>
        );
      }
      if (editSub === "name") {
        return (
          <div className="space-y-4">
            <Header title="Edit Name" subtitle="What should people call you?" color="text-cyan-400" bg="bg-cyan-500/20 border-cyan-500/30" icon={<Type className="w-6 h-6" />} onBack={back} />
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400">Full Name</label>
              <input type="text" value={nameInput} onChange={(e) => setNameInput(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none" />
            </div>
            <button onClick={() => { saveProfile({ full_name: nameInput }); }} className="w-full py-3 rounded-2xl bg-cyan-500 text-slate-950 font-extrabold hover:bg-cyan-400 transition-colors cursor-pointer">Save Name</button>
          </div>
        );
      }
      if (editSub === "bio") {
        return (
          <div className="space-y-4">
            <Header title="Edit Bio" subtitle="Tell your story" color="text-cyan-400" bg="bg-cyan-500/20 border-cyan-500/30" icon={<AlignLeft className="w-6 h-6" />} onBack={back} />
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400">Bio</label>
              <textarea value={bioInput} onChange={(e) => setBioInput(e.target.value)} rows={4} className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none resize-none" placeholder="Write something about yourself..." />
            </div>
            <button onClick={() => { saveProfile({ bio: bioInput }); }} className="w-full py-3 rounded-2xl bg-cyan-500 text-slate-950 font-extrabold hover:bg-cyan-400 transition-colors cursor-pointer">Save Bio</button>
          </div>
        );
      }
      if (editSub === "phone") {
        return (
          <div className="space-y-4">
            <Header title="Phone Number" subtitle="Used for real phone-network calls" color="text-cyan-400" bg="bg-cyan-500/20 border-cyan-500/30" icon={<Phone className="w-6 h-6" />} onBack={back} />
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400">Phone Number (E.164 format)</label>
              <input type="tel" value={phoneInput} onChange={(e) => setPhoneInput(e.target.value.replace(/[^\d+]/g, ""))} placeholder="+12025551234" className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none" />
              <p className="text-[10px] text-slate-500">Include the country code, e.g. +254712345678. Calls placed to/from you will dial this real number.</p>
            </div>
            <button
              onClick={() => {
                if (phoneInput && !/^\+[1-9]\d{6,14}$/.test(phoneInput)) {
                  showToast("Enter a valid E.164 number, e.g. +12025551234");
                  return;
                }
                saveProfile({ phone_number: phoneInput });
              }}
              className="w-full py-3 rounded-2xl bg-cyan-500 text-slate-950 font-extrabold hover:bg-cyan-400 transition-colors cursor-pointer"
            >
              Save Phone Number
            </button>
          </div>
        );
      }
      // handle
      return (
        <div className="space-y-4">
          <Header title="Custom Handle" subtitle="Your unique @username" color="text-cyan-400" bg="bg-cyan-500/20 border-cyan-500/30" icon={<AtSign className="w-6 h-6" />} onBack={back} />
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400">Username Handle</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">@</span>
              <input type="text" value={handleInput} onChange={(e) => setHandleInput(e.target.value.replace(/\s+/g, "").toLowerCase())} className="w-full pl-8 pr-4 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none" />
            </div>
            <p className="text-[10px] text-slate-500">Only letters, numbers, and underscores.</p>
          </div>
          <button onClick={() => { saveProfile({ username: handleInput }); }} className="w-full py-3 rounded-2xl bg-cyan-500 text-slate-950 font-extrabold hover:bg-cyan-400 transition-colors cursor-pointer">Save Handle</button>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <Header title="Edit Profile" subtitle="Update your personal details" color="text-cyan-400" bg="bg-cyan-500/20 border-cyan-500/30" icon={<User className="w-6 h-6" />} onBack={() => setView("hub")} />
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700">
          <img src={currentUser.avatar_url} alt="avatar" className="w-12 h-12 rounded-full object-cover" />
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-100">{currentUser.full_name}</p>
            <p className="text-xs text-slate-400">@{currentUser.username}</p>
          </div>
        </div>
        <div className="space-y-2">
          {[
            { k: "avatar" as const, label: "Change Avatar", desc: "Update profile picture", icon: <User className="w-4 h-4 text-cyan-400" /> },
            { k: "name" as const, label: "Edit Name", desc: "Your display name", icon: <Type className="w-4 h-4 text-indigo-400" /> },
            { k: "bio" as const, label: "Edit Bio", desc: "Your personal story", icon: <AlignLeft className="w-4 h-4 text-emerald-400" /> },
            { k: "handle" as const, label: "Custom Handle", desc: "Your @username", icon: <AtSign className="w-4 h-4 text-pink-400" /> },
            { k: "phone" as const, label: "Phone Number", desc: "For real phone-network calls", icon: <Phone className="w-4 h-4 text-amber-400" /> },
          ].map((item) => (
            <button key={item.k} onClick={() => setEditSub(item.k)} className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-cyan-500/40 transition-all cursor-pointer text-left">
              {item.icon}
              <div className="flex-1">
                <p className="text-xs font-semibold text-slate-200">{item.label}</p>
                <p className="text-[10px] text-slate-500">{item.desc}</p>
              </div>
              <ChevronLeft className="w-4 h-4 text-slate-500 rotate-180" />
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderAccountStatus = () => (
    <div className="space-y-4">
      <Header title="Account Status" subtitle="Set your nautical presence" color="text-emerald-400" bg="bg-emerald-500/20 border-emerald-500/30" icon={<Radio className="w-6 h-6" />} onBack={() => setView("hub")} />
      <div className="space-y-2">
        {[
          { k: "focus" as const, label: "In Focus", desc: "Show as active & available", color: "bg-emerald-500", icon: <Anchor className="w-4 h-4 text-emerald-400" /> },
          { k: "adrift" as const, label: "Adrift", desc: "Away but still reachable", color: "bg-amber-500", icon: <Radio className="w-4 h-4 text-amber-400" /> },
          { k: "custom" as const, label: "Custom Status Text", desc: "Write your own status", color: "bg-indigo-500", icon: <Type className="w-4 h-4 text-indigo-400" /> },
          { k: "timer" as const, label: "Auto-Clear Timer", desc: "Clear status after a set time", color: "bg-purple-500", icon: <Timer className="w-4 h-4 text-purple-400" /> },
        ].map((opt) => (
          <div key={opt.k}>
            <button onClick={() => setStatusOption(opt.k)} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${statusOption === opt.k ? "border-emerald-500/60 bg-emerald-500/10" : "border-slate-700 bg-slate-800/50 hover:border-slate-500"}`}>
              {opt.icon}
              <div className="flex-1 text-left">
                <p className="text-xs font-semibold text-slate-200">{opt.label}</p>
                <p className="text-[10px] text-slate-500">{opt.desc}</p>
              </div>
              <span className={`w-2.5 h-2.5 rounded-full ${opt.color} ${statusOption === opt.k ? "animate-pulse" : "opacity-40"}`} />
            </button>
            {statusOption === opt.k && opt.k === "custom" && (
              <div className="mt-2 pl-9">
                <input type="text" value={customStatusText} onChange={(e) => setCustomStatusText(e.target.value)} placeholder="e.g. Exploring the deep blue..." className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none" />
              </div>
            )}
            {statusOption === opt.k && opt.k === "timer" && (
              <div className="mt-2 pl-9 flex gap-2">
                {["1 hour", "4 hours", "24 hours"].map((d) => (
                  <button key={d} onClick={() => setAutoClear(d)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer ${autoClear === d ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-300"}`}>{d}</button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <button onClick={() => {
        const updates: Partial<Profile> = {};
if (statusOption === "focus") { updates.custom_status = "In Focus"; updates.nautical_presence = "in_focus"; updates.is_online = true; }
        if (statusOption === "adrift") { updates.custom_status = "Adrift"; updates.nautical_presence = "adrift"; updates.is_online = false; }
if (statusOption === "custom") { updates.custom_status = customStatusText as NauticalPresenceState; updates.is_online = false; }
        if (statusOption === "timer") { updates.custom_status = "Adrift"; updates.nautical_presence = "last_anchored"; updates.is_online = false; }
        saveProfile(updates);
      }} className="w-full py-3 rounded-2xl bg-emerald-500 text-slate-950 font-extrabold hover:bg-emerald-400 transition-colors cursor-pointer">Update Status</button>
    </div>
  );

  const renderQrCode = () => (
    <div className="space-y-4">
      <Header title="QR Code & Link" subtitle="Share your profile" color="text-indigo-400" bg="bg-indigo-500/20 border-indigo-500/30" icon={<QrCode className="w-6 h-6" />} onBack={() => setView("hub")} />
      <div className="flex gap-2">
        {[
          { k: "mine" as const, label: "My Code", icon: <QrCode className="w-3.5 h-3.5" /> },
          { k: "scan" as const, label: "Scan Code", icon: <ScanLine className="w-3.5 h-3.5" /> },
        ].map((t) => (
          <button key={t.k} onClick={() => setQrTab(t.k)} className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-[11px] font-bold transition-colors cursor-pointer ${qrTab === t.k ? "bg-indigo-500 text-white" : "bg-slate-800 text-slate-300"}`}>{t.icon} {t.label}</button>
        ))}
      </div>
      {qrTab === "mine" ? (
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="p-4 rounded-2xl bg-white">
            {/* Stylized QR "code" matrix */}
            <div className="grid grid-cols-7 gap-0.5 w-40 h-40">
              {Array.from({ length: 49 }).map((_, i) => {
                const isCorner = i === 0 || i === 6 || i === 42 || i === 48;
                const isFinder = [0,1,5,6,7,13,35,41,42,43,47,48].includes(i);
                const rand = (i * 7 + 3) % 5 === 0;
                return (
                  <div key={i} className={`${isCorner ? "bg-indigo-600" : isFinder ? "bg-slate-900" : rand ? "bg-slate-800" : "bg-slate-200"} rounded-[2px]`} />
                );
              })}
            </div>
          </div>
          <p className="text-xs font-bold text-slate-200">@{currentUser.username} • HeyLook</p>
          <button onClick={() => { navigator.clipboard?.writeText(`https://heylook.app/u/${currentUser.username}`); showToast("Profile link copied ✓"); }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500 text-white text-xs font-extrabold hover:bg-indigo-400 transition-colors cursor-pointer">
            <Copy className="w-3.5 h-3.5" /> Copy Profile Link
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-8">
          <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-indigo-500/50 flex items-center justify-center">
            <ScanLine className="w-12 h-12 text-indigo-400 animate-pulse" />
          </div>
          <p className="text-xs text-slate-400 text-center max-w-[220px]">Point your camera at another HeyLook QR code to instantly add them.</p>
          <button onClick={() => showToast("Camera scanner opened")} className="px-4 py-2.5 rounded-xl bg-indigo-500 text-white text-xs font-extrabold hover:bg-indigo-400 transition-colors cursor-pointer">Open Scanner</button>
        </div>
      )}
    </div>
  );

  const renderLinkedDevices = () => (
    <div className="space-y-4">
      <Header title="Linked Devices" subtitle="Manage active sessions" color="text-purple-400" bg="bg-purple-500/20 border-purple-500/30" icon={<MonitorSmartphone className="w-6 h-6" />} onBack={() => setView("hub")} />
      <div className="space-y-2">
        {devices.map((d) => (
          <div key={d.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700">
            <span className="p-2 rounded-lg bg-slate-900 text-purple-400">{d.icon}</span>
            <div className="flex-1">
              <p className="text-xs font-semibold text-slate-200">{d.name}</p>
              <p className="text-[10px] text-slate-500">{d.location} • {d.lastActive}</p>
            </div>
            <button onClick={() => { setDevices(devices.filter((x) => x.id !== d.id)); showToast(`${d.name} removed`); }} className="p-1.5 text-rose-400 hover:text-rose-300 cursor-pointer"><LogOut className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <button onClick={() => showToast("New web session link initiated")} className="w-full flex items-center gap-3 p-3 rounded-xl bg-purple-500/10 border border-purple-500/40 hover:bg-purple-500/20 transition-all cursor-pointer">
          <LinkIcon className="w-4 h-4 text-purple-400" />
          <div className="flex-1 text-left">
            <p className="text-xs font-semibold text-slate-200">Link New Web Session</p>
            <p className="text-[10px] text-slate-500">Scan QR to login on another device</p>
          </div>
        </button>
        <button onClick={() => { setDevices([devices[0]]); showToast("Logged out of all remote sessions"); }} className="w-full flex items-center gap-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/40 hover:bg-rose-500/20 transition-all cursor-pointer">
          <LogOut className="w-4 h-4 text-rose-400" />
          <div className="flex-1 text-left">
            <p className="text-xs font-semibold text-rose-300">Log Out of All Remote Sessions</p>
            <p className="text-[10px] text-slate-500">Keeps this device signed in</p>
          </div>
        </button>
      </div>
    </div>
  );

  const renderSavedItems = () => {
    const folderContent = savedFolder === "messages" ? (
      <div className="space-y-2">
        {STARRED_MESSAGES.map((m) => (
          <div key={m.id} className="p-3 rounded-xl bg-slate-800/50 border border-slate-700">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-amber-400">{m.sender}</span>
              <span className="text-[10px] text-slate-500">{m.time}</span>
            </div>
            <p className="text-xs text-slate-300">{m.text}</p>
          </div>
        ))}
      </div>
    ) : savedFolder === "reels" ? (
      <div className="grid grid-cols-3 gap-2">
        {SAVED_REELS.map((r) => (
          <button key={r.id} className="aspect-square rounded-xl overflow-hidden border border-slate-700 hover:border-pink-500/60 hover:scale-105 transition-all cursor-pointer relative group">
            <img src={r.thumb} alt={r.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-1.5">
              <span className="text-[9px] font-bold text-white leading-tight">{r.title}</span>
            </div>
          </button>
        ))}
      </div>
    ) : (
      <div className="space-y-2">
        {ANCHORED_BEACONS.map((b) => (
          <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700">
            <span className="p-2 rounded-lg bg-slate-900 text-cyan-400"><Anchor className="w-4 h-4" /></span>
            <div className="flex-1">
              <p className="text-xs font-semibold text-slate-200">{b.title}</p>
              <p className="text-[10px] text-slate-500">{b.time} • {b.views} views</p>
            </div>
          </div>
        ))}
      </div>
    );

    return (
      <div className="space-y-4">
        <Header title="Saved Items" subtitle="Your categorized library" color="text-pink-400" bg="bg-pink-500/20 border-pink-500/30" icon={<Bookmark className="w-6 h-6" />} onBack={() => setView("hub")} />
        <div className="grid grid-cols-3 gap-2">
          {SAVED_ITEMS.map((item) => (
            <button key={item.key} onClick={() => setSavedFolder(item.key as any)} className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all cursor-pointer ${savedFolder === item.key ? "border-pink-500/60 bg-pink-500/10" : "border-slate-700 bg-slate-800/50 hover:border-slate-500"}`}>
              <span className={item.color}>{item.icon}</span>
              <span className="text-[10px] font-semibold text-slate-200 text-center leading-tight">{item.label}</span>
              <span className="text-[9px] text-slate-500">{item.count} items</span>
            </button>
          ))}
        </div>
        <div>
          <p className="text-xs font-bold text-slate-400 mb-2 capitalize">{savedFolder} folder</p>
          {folderContent}
        </div>
      </div>
    );
  };

  const renderDataStorage = () => {
    if (dataSub !== "overview") {
      const back = () => setDataSub("overview");
      if (dataSub === "storage") {
        return (
          <div className="space-y-4">
            <Header title="Manage Storage" subtitle="Clear & free up space" color="text-teal-400" bg="bg-teal-500/20 border-teal-500/30" icon={<Database className="w-6 h-6" />} onBack={back} />
            <div className="space-y-2">
              {[{ label: "Photos & GIFs", size: "1.2 GB", color: "bg-pink-500" }, { label: "Voice Notes", size: "480 MB", color: "bg-amber-500" }, { label: "Videos", size: "2.1 GB", color: "bg-indigo-500" }, { label: "Documents", size: "320 MB", color: "bg-emerald-500" }].map((c) => (
                <div key={c.label} className="p-3 rounded-xl bg-slate-800/50 border border-slate-700">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-slate-200">{c.label}</span>
                    <span className="text-[10px] text-slate-500">{c.size}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden"><div className={`h-full ${c.color} rounded-full`} style={{ width: `${Math.min(90, parseInt(c.size) * 20)}%` }} /></div>
                </div>
              ))}
            </div>
            <button onClick={() => showToast("Storage cleared")} className="w-full py-3 rounded-2xl bg-teal-500 text-slate-950 font-extrabold hover:bg-teal-400 transition-colors cursor-pointer">Clear Unused Media</button>
          </div>
        );
      }
      if (dataSub === "network") {
        return (
          <div className="space-y-4">
            <Header title="Network Usage" subtitle="Data consumption analytics" color="text-teal-400" bg="bg-teal-500/20 border-teal-500/30" icon={<Wifi className="w-6 h-6" />} onBack={back} />
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700 text-center">
                <p className="text-2xl font-black text-teal-400">3.4<span className="text-sm"> GB</span></p>
                <p className="text-[10px] text-slate-500 mt-1">This Month</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700 text-center">
                <p className="text-2xl font-black text-cyan-400">1.1<span className="text-sm"> GB</span></p>
                <p className="text-[10px] text-slate-500 mt-1">Wifi vs Mobile</p>
              </div>
            </div>
            <div className="space-y-2">
              {[{ label: "Messages", val: 42 }, { label: "Media (photos/video)", val: 38 }, { label: "Voice calls", val: 12 }, { label: "Other sync", val: 8 }].map((b) => (
                <div key={b.label}>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1"><span>{b.label}</span><span>{b.val}%</span></div>
                  <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden"><div className="h-full bg-teal-400 rounded-full" style={{ width: `${b.val}%` }} /></div>
                </div>
              ))}
            </div>
          </div>
        );
      }
      // download rules
      return (
        <div className="space-y-4">
          <Header title="Media Auto-Download Rules" subtitle="Control background downloads" color="text-teal-400" bg="bg-teal-500/20 border-teal-500/30" icon={<Download className="w-6 h-6" />} onBack={back} />
          <div className="space-y-2">
            {["Never", "Wifi Only", "Wifi & Mobile"].map((opt) => (
              <button key={opt} onClick={() => setAutoDownload(opt)} className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${autoDownload === opt ? "border-teal-500/60 bg-teal-500/10" : "border-slate-700 bg-slate-800/50"}`}>
                <span className="text-xs font-semibold text-slate-200">{opt}</span>
                {autoDownload === opt && <CheckCircle2 className="w-4 h-4 text-teal-400" />}
              </button>
            ))}
          </div>
          <button onClick={() => showToast(`Auto-download: ${autoDownload}`)} className="w-full py-3 rounded-2xl bg-teal-500 text-slate-950 font-extrabold hover:bg-teal-400 transition-colors cursor-pointer">Save Rules</button>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <Header title="Data & Storage Usage" subtitle="Analytics dashboard" color="text-teal-400" bg="bg-teal-500/20 border-teal-500/30" icon={<Database className="w-6 h-6" />} onBack={() => setView("hub")} />
        <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700 flex items-center justify-between">
          <div>
            <p className="text-3xl font-black text-teal-400">4.1 <span className="text-sm text-slate-400">GB</span></p>
            <p className="text-[10px] text-slate-500 mt-1">Total storage used</p>
          </div>
          <div className="w-16 h-16 rounded-full border-4 border-teal-500/30 border-t-teal-400 flex items-center justify-center">
            <span className="text-xs font-bold text-teal-400">62%</span>
          </div>
        </div>
        <div className="space-y-2">
          {[
            { k: "storage" as const, label: "Manage Storage", desc: "Review & clear cached media", icon: <Database className="w-4 h-4 text-teal-400" /> },
            { k: "network" as const, label: "Network Usage", desc: "Data consumed breakdown", icon: <Wifi className="w-4 h-4 text-cyan-400" /> },
            { k: "download" as const, label: "Media Auto-Download Rules", desc: "Wifi vs mobile policies", icon: <Download className="w-4 h-4 text-amber-400" /> },
          ].map((item) => (
            <button key={item.k} onClick={() => setDataSub(item.k)} className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-teal-500/40 transition-all cursor-pointer text-left">
              {item.icon}
              <div className="flex-1">
                <p className="text-xs font-semibold text-slate-200">{item.label}</p>
                <p className="text-[10px] text-slate-500">{item.desc}</p>
              </div>
              <ChevronLeft className="w-4 h-4 text-slate-500 rotate-180" />
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderThemeAppearance = () => {
    if (themeSub !== "list") {
      const back = () => setThemeSub("list");
      if (themeSub === "custom") {
        return (
          <div className="space-y-4">
            <Header title="Custom Accent Color" subtitle="Pick a signature color" color="text-amber-400" bg="bg-amber-500/20 border-amber-500/30" icon={<Droplets className="w-6 h-6" />} onBack={back} />
            <div className="flex flex-col items-center gap-4 py-4">
              <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="w-24 h-24 rounded-2xl cursor-pointer bg-transparent border-0" />
              <div className="flex gap-2">
                {["#06b6d4", "#6366f1", "#ec4899", "#10b981", "#f59e0b", "#ef4444"].map((c) => (
                  <button key={c} onClick={() => setAccentColor(c)} className={`w-8 h-8 rounded-full border-2 transition-all cursor-pointer ${accentColor === c ? "border-white scale-110" : "border-transparent"}`} style={{ background: c }} />
                ))}
              </div>
              <p className="text-xs font-mono text-slate-400">{accentColor}</p>
            </div>
            <button onClick={() => showToast(`Accent set to ${accentColor}`)} className="w-full py-3 rounded-2xl bg-amber-500 text-slate-950 font-extrabold hover:bg-amber-400 transition-colors cursor-pointer">Apply Accent</button>
          </div>
        );
      }
      return (
        <div className="space-y-4">
          <Header title={themeSub === "dark" ? "Dark Mode" : themeSub === "light" ? "Light Mode" : "Nautical Blue"} subtitle="Theme preview" color="text-amber-400" bg="bg-amber-500/20 border-amber-500/30" icon={<Palette className="w-6 h-6" />} onBack={back} />
          <div className={`rounded-2xl border p-6 text-center ${themeSub === "dark" ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"}`}>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 mx-auto mb-3 flex items-center justify-center">
              <Palette className="w-8 h-8 text-white" />
            </div>
            <p className="font-bold">Preview</p>
            <p className="text-xs opacity-70 mt-1">This is how HeyLook will appear.</p>
          </div>
          <button onClick={() => { if (themeSub === "light" && isDark) onToggleTheme(); if (themeSub === "dark" && !isDark) onToggleTheme(); showToast("Theme applied"); }} className="w-full py-3 rounded-2xl bg-amber-500 text-slate-950 font-extrabold hover:bg-amber-400 transition-colors cursor-pointer">Apply Theme</button>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <Header title="Theme & Appearance" subtitle="Personalize HeyLook" color="text-amber-400" bg="bg-amber-500/20 border-amber-500/30" icon={<Palette className="w-6 h-6" />} onBack={() => setView("hub")} />
        <div className="space-y-2">
          {[
            { k: "dark" as const, label: "Dark Mode", desc: "Sleek dark interface", icon: <Moon className="w-4 h-4 text-indigo-400" />, active: isDark },
            { k: "light" as const, label: "Light Mode", desc: "Bright & clean", icon: <Sun className="w-4 h-4 text-amber-400" />, active: !isDark },
            { k: "nautical" as const, label: "Nautical Blue", desc: "Ocean-inspired theme", icon: <Droplets className="w-4 h-4 text-cyan-400" />, active: false },
            { k: "custom" as const, label: "Custom Accent Color", desc: "Pick your own color", icon: <Palette className="w-4 h-4 text-pink-400" />, active: false },
          ].map((t) => (
            <button key={t.k} onClick={() => setThemeSub(t.k)} className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-amber-500/40 transition-all cursor-pointer text-left">
              {t.icon}
              <div className="flex-1">
                <p className="text-xs font-semibold text-slate-200">{t.label}</p>
                <p className="text-[10px] text-slate-500">{t.desc}</p>
              </div>
              {t.active && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderLanguageRegion = () => {
    if (langSub !== "list") {
      const back = () => setLangSub("list");
      if (langSub === "language") {
        return (
          <div className="space-y-4">
            <Header title="App Language" subtitle="Choose display language" color="text-blue-400" bg="bg-blue-500/20 border-blue-500/30" icon={<Languages className="w-6 h-6" />} onBack={back} />
            <div className="space-y-2">
              {["English (US)", "English (UK)", "Swahili", "Spanish", "French", "Arabic"].map((l) => (
                <button key={l} onClick={() => { setAppLanguage(l); showToast(`Language: ${l}`); }} className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${appLanguage === l ? "border-blue-500/60 bg-blue-500/10" : "border-slate-700 bg-slate-800/50"}`}>
                  <span className="text-xs font-semibold text-slate-200">{l}</span>
                  {appLanguage === l && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                </button>
              ))}
            </div>
          </div>
        );
      }
      if (langSub === "week") {
        return (
          <div className="space-y-4">
            <Header title="First Day of Week" subtitle="Calendar preference" color="text-blue-400" bg="bg-blue-500/20 border-blue-500/30" icon={<CalendarDays className="w-6 h-6" />} onBack={back} />
            <div className="space-y-2">
              {["Sunday", "Monday", "Saturday"].map((d) => (
                <button key={d} onClick={() => { setFirstDay(d); showToast(`First day: ${d}`); }} className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${firstDay === d ? "border-blue-500/60 bg-blue-500/10" : "border-slate-700 bg-slate-800/50"}`}>
                  <span className="text-xs font-semibold text-slate-200">{d}</span>
                  {firstDay === d && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                </button>
              ))}
            </div>
          </div>
        );
      }
      return (
        <div className="space-y-4">
          <Header title="Timestamp Format" subtitle="How times are shown" color="text-blue-400" bg="bg-blue-500/20 border-blue-500/30" icon={<Clock className="w-6 h-6" />} onBack={back} />
          <div className="space-y-2">
            {["12h", "24h"].map((t) => (
              <button key={t} onClick={() => { setTimeFormat(t); showToast(`Format: ${t}`); }} className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${timeFormat === t ? "border-blue-500/60 bg-blue-500/10" : "border-slate-700 bg-slate-800/50"}`}>
                <span className="text-xs font-semibold text-slate-200">{t === "12h" ? "12-hour (3:30 PM)" : "24-hour (15:30)"}</span>
                {timeFormat === t && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
              </button>
            ))}
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <Header title="Language & Region" subtitle="Locale & time settings" color="text-blue-400" bg="bg-blue-500/20 border-blue-500/30" icon={<Languages className="w-6 h-6" />} onBack={() => setView("hub")} />
        <div className="space-y-2">
          {[
            { k: "language" as const, label: "App Language", desc: appLanguage, icon: <Languages className="w-4 h-4 text-blue-400" /> },
            { k: "week" as const, label: "First Day of Week", desc: firstDay, icon: <CalendarDays className="w-4 h-4 text-cyan-400" /> },
            { k: "time" as const, label: "Timestamp Format", desc: `${timeFormat} hour`, icon: <Clock className="w-4 h-4 text-indigo-400" /> },
          ].map((item) => (
            <button key={item.k} onClick={() => setLangSub(item.k)} className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-blue-500/40 transition-all cursor-pointer text-left">
              {item.icon}
              <div className="flex-1">
                <p className="text-xs font-semibold text-slate-200">{item.label}</p>
                <p className="text-[10px] text-slate-500">{item.desc}</p>
              </div>
              <ChevronLeft className="w-4 h-4 text-slate-500 rotate-180" />
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderHelpSupport = () => {
    if (helpView !== "list") {
      const back = () => setHelpView("list");
      if (helpView === "faq") {
        const filtered = FAQ_ITEMS.filter((f) => f.q.toLowerCase().includes(faqSearch.toLowerCase()));
        return (
          <div className="space-y-4">
            <Header title="FAQ Search" subtitle="Find quick answers" color="text-slate-300" bg="bg-slate-500/20 border-slate-500/30" icon={<Search className="w-6 h-6" />} onBack={back} />
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" value={faqSearch} onChange={(e) => setFaqSearch(e.target.value)} placeholder="Search FAQs..." className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-indigo-500 focus:outline-none" />
            </div>
            <div className="space-y-2">
              {filtered.map((f) => (
                <div key={f.q} className="p-3 rounded-xl bg-slate-800/50 border border-slate-700">
                  <p className="text-xs font-bold text-slate-200">{f.q}</p>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        );
      }
      if (helpView === "report") {
        return (
          <div className="space-y-4">
            <Header title="Report a Problem" subtitle="Tell us what went wrong" color="text-slate-300" bg="bg-slate-500/20 border-slate-500/30" icon={<AlertTriangle className="w-6 h-6" />} onBack={back} />
            <div className="space-y-2">
              {["Bug or crash", "Inappropriate content", "Account issue", "Billing problem", "Other"].map((c) => (
                <button key={c} className="w-full text-left p-3 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-rose-500/40 transition-all cursor-pointer text-xs font-semibold text-slate-200">{c}</button>
              ))}
            </div>
            <textarea rows={4} placeholder="Describe the issue..." className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:border-rose-500 focus:outline-none resize-none" />
            <button onClick={() => showToast("Report submitted ✓")} className="w-full py-3 rounded-2xl bg-rose-500 text-white font-extrabold hover:bg-rose-400 transition-colors cursor-pointer">Submit Report</button>
          </div>
        );
      }
      if (helpView === "terms") {
        return (
          <div className="space-y-4">
            <Header title="Terms of Service" subtitle="Legal & usage terms" color="text-slate-300" bg="bg-slate-500/20 border-slate-500/30" icon={<FileText className="w-6 h-6" />} onBack={back} />
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 text-xs text-slate-300 leading-relaxed space-y-3 max-h-64 overflow-y-auto">
              <p><strong className="text-slate-100">1. Acceptance.</strong> By using HeyLook, you agree to these terms. The nautical-themed features including Beacons, presence states, and delivery vectors are provided "as-is."</p>
              <p><strong className="text-slate-100">2. Privacy.</strong> Your messages are end-to-end encrypted. Presence status is shared only with your contacts.</p>
              <p><strong className="text-slate-100">3. Acceptable Use.</strong> Content must not violate laws or infringe rights. Vanishing messages are subject to platform safety review.</p>
              <p><strong className="text-slate-100">4. Termination.</strong> We may suspend accounts that violate these terms. Users may delete their account anytime.</p>
            </div>
          </div>
        );
      }
      return (
        <div className="space-y-4">
          <Header title="App Diagnostics" subtitle="System health & info" color="text-slate-300" bg="bg-slate-500/20 border-slate-500/30" icon={<Activity className="w-6 h-6" />} onBack={back} />
          <div className="space-y-2">
            {[
              { label: "App Version", value: "HeyLook v2.4.0" },
              { label: "Build", value: "2026.03.15" },
              { label: "Backend", value: "Supabase (Connected)" },
              { label: "Realtime", value: "WebSocket • Latency 42ms" },
              { label: "Storage", value: "4.1 GB / 6.6 GB" },
              { label: "Auth Provider", value: "Supabase Auth" },
            ].map((d) => (
              <div key={d.label} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700">
                <span className="text-xs text-slate-400">{d.label}</span>
                <span className="text-xs font-bold text-slate-200">{d.value}</span>
              </div>
            ))}
          </div>
          <button onClick={() => showToast("Diagnostics refreshed")} className="w-full py-3 rounded-2xl bg-slate-700 text-white font-extrabold hover:bg-slate-600 transition-colors cursor-pointer">Run Health Check</button>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <Header title="Help & Support" subtitle="Get assistance" color="text-slate-300" bg="bg-slate-500/20 border-slate-500/30" icon={<HelpCircle className="w-6 h-6" />} onBack={() => setView("hub")} />
        <div className="space-y-2">
          {[
            { k: "faq" as const, label: "FAQ Search", desc: "Browse common questions", icon: <Search className="w-4 h-4 text-indigo-400" /> },
            { k: "report" as const, label: "Report a Problem", desc: "Submit a support ticket", icon: <AlertTriangle className="w-4 h-4 text-rose-400" /> },
            { k: "terms" as const, label: "Terms of Service", desc: "Read legal terms", icon: <FileText className="w-4 h-4 text-cyan-400" /> },
            { k: "diagnostics" as const, label: "App Diagnostics", desc: "System health & info", icon: <Activity className="w-4 h-4 text-emerald-400" /> },
          ].map((item) => (
            <button key={item.k} onClick={() => setHelpView(item.k)} className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-slate-500 transition-all cursor-pointer text-left">
              {item.icon}
              <div className="flex-1">
                <p className="text-xs font-semibold text-slate-200">{item.label}</p>
                <p className="text-[10px] text-slate-500">{item.desc}</p>
              </div>
              <ChevronLeft className="w-4 h-4 text-slate-500 rotate-180" />
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderAccountSwitcher = () => (
    <div className="space-y-4">
      <Header title="Account Switcher" subtitle="Switch between accounts" color="text-rose-400" bg="bg-rose-500/20 border-rose-500/30" icon={<Repeat className="w-6 h-6" />} onBack={() => setView("hub")} />
      <div className="space-y-2">
        {accounts.map((acc) => (
          <button key={acc.id} onClick={() => showToast(`Switched to ${acc.name}`)} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${acc.active ? "border-rose-500/60 bg-rose-500/10" : "border-slate-700 bg-slate-800/50 hover:border-slate-500"}`}>
            <img src={acc.avatar} alt={acc.name} className="w-10 h-10 rounded-full object-cover" />
            <div className="flex-1 text-left">
              <p className="text-xs font-bold text-slate-200 flex items-center gap-1.5">{acc.name} {acc.active && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300">Active</span>}</p>
              <p className="text-[10px] text-slate-500 flex items-center gap-1">{acc.handle} • {acc.provider === "google" ? "Google" : "Email"}</p>
            </div>
            {acc.active && <CheckCircle2 className="w-4 h-4 text-rose-400" />}
          </button>
        ))}
      </div>
      <button onClick={handleGoogleSignIn} className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-rose-500 text-white font-extrabold hover:bg-rose-400 transition-colors cursor-pointer">
        <Plus className="w-4 h-4" /> Add Google Account
      </button>
      <p className="text-[10px] text-slate-500 text-center">Adding an account will open a secure Google sign-in window.</p>
    </div>
  );

  /* ---------- Hub grid ---------- */
  const renderHub = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-cyan-400 to-pink-500 animate-pulse" />
            Profile Settings
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Manage your HeyLook account & preferences</p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {TILES.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setView(t.key as SettingsView);
              setEditSub("list");
              setThemeSub("list");
              setLangSub("list");
              setHelpView("list");
              setDataSub("overview");
            }}
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
          onClick={closeModal}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-[min(100%,32rem)] max-w-[calc(100vw-1rem)] max-h-[88vh] overflow-y-auto overflow-x-hidden bg-slate-900 border border-slate-700 rounded-3xl p-4 sm:p-6 shadow-2xl text-slate-100 relative"
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
            {view === "editProfile" && renderEditProfile()}
            {view === "accountStatus" && renderAccountStatus()}
            {view === "qrCode" && renderQrCode()}
            {view === "linkedDevices" && renderLinkedDevices()}
            {view === "savedItems" && renderSavedItems()}
            {view === "dataStorage" && renderDataStorage()}
            {view === "themeAppearance" && renderThemeAppearance()}
            {view === "languageRegion" && renderLanguageRegion()}
            {view === "helpSupport" && renderHelpSupport()}
            {view === "accountSwitcher" && renderAccountSwitcher()}
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

export default ProfileSettingsModal;
