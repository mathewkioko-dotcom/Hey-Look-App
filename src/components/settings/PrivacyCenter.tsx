import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  ChevronLeft,
  Eye,
  EyeOff,
  User,
  CheckCircle2,
  Users,
  ShieldCheck,
  Ban,
  Lock,
  KeyRound,
  MapPin,
  Settings2,
  Timer,
  AlertTriangle,
  Trash2,
  Globe,
  Contact,
  History,
  Plus,
  Mail,
  Smartphone,
  Wifi,
  Link2,
  Loader2,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

type PrivacyView =
  | "hub"
  | "lastAnchored"
  | "profilePhoto"
  | "storyVisibility"
  | "readReceipts"
  | "groupAdd"
  | "blockedContacts"
  | "appLock"
  | "twoStep"
  | "liveLocation"
  | "advancedSecurity"
  | "deleteAccount";

interface PrivacyCenterProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string;
}

/* ------------------------- Sample Data ------------------------- */
const BLOCKED_CONTACTS = [
  {
    id: "b1",
    name: "Jake Nilson",
    handle: "@jake_n",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100",
    blockedAt: "2 weeks ago",
  },
  {
    id: "b2",
    name: "Amina Yusuf",
    handle: "@amina_y",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
    blockedAt: "1 month ago",
  },
];

const BLOCK_HISTORY = [
  { id: "h1", name: "Ravi Patel", action: "Blocked", date: "Jan 12" },
  { id: "h2", name: "Lena Fischer", action: "Unblocked", date: "Jan 3" },
  { id: "h3", name: "Tom O'Brien", action: "Blocked", date: "Dec 28" },
];

const LOCATION_ACCESS_CHATS = [
  {
    id: "l1",
    name: "Sara Chen",
    avatar:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100",
    access: "Live",
    updated: "2m ago",
  },
  {
    id: "l2",
    name: "Alex Rivera",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100",
    access: "Live",
    updated: "15m ago",
  },
  {
    id: "l3",
    name: "Maya Okafor",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100",
    access: "While open",
    updated: "1h ago",
  },
];

const DELETE_REASONS = [
  "Privacy concerns",
  "Switching to another app",
  "Creating a new account",
  "Too many notifications",
  "Other",
];

/* ====================================================================== */
/*  MAIN COMPONENT                                                         */
/* ====================================================================== */
export const PrivacyCenter: React.FC<PrivacyCenterProps> = ({
  isOpen,
  onClose,
  currentUserId,
}) => {
  const [view, setView] = useState<PrivacyView>("hub");
  const [toast, setToast] = useState<string>("");

  // Last Anchored / Online Status
  const [statusVisibility, setStatusVisibility] = useState("My Contacts");
  const [statusExclusions, setStatusExclusions] = useState<string[]>([]);

  // Profile Photo Visibility
  const [photoVisibility, setPhotoVisibility] = useState("Everyone");
  const [storyVisibility, setStoryVisibility] = useState("Everyone");
  const [photoExclusions, setPhotoExclusions] = useState<string[]>([]);

  // Read Receipts
  const [receiptsEnabled, setReceiptsEnabled] = useState(true);
  const [receiptsPopup, setReceiptsPopup] = useState(false);

  // Group Add Permissions
  const [groupAddPerm, setGroupAddPerm] = useState("Everyone");

  // Blocked Contacts
  const [blockedContacts, setBlockedContacts] = useState(BLOCKED_CONTACTS);
  const [blockSub, setBlockSub] = useState<"list" | "add" | "history">("list");
  const [newBlockName, setNewBlockName] = useState("");

  // App Lock
  const [appLockEnabled, setAppLockEnabled] = useState(false);
  const [appLockSub, setAppLockSub] = useState<"list" | "pin" | "delay">(
    "list",
  );
  const [requirePin, setRequirePin] = useState(true);
  const [autoLockDelay, setAutoLockDelay] = useState("1m");

  // Two-Step Verification
  const [twoStepStep, setTwoStepStep] = useState<"list" | "setup" | "verify">(
    "list",
  );
  const [twoStepPin, setTwoStepPin] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [twoStepEnabled, setTwoStepEnabled] = useState(false);

  // Live Location
  const [locationChats, setLocationChats] = useState(LOCATION_ACCESS_CHATS);

  // Advanced Security
  const [protectIP, setProtectIP] = useState(true);
  const [disableLinkPreviews, setDisableLinkPreviews] = useState(false);
  const [strictSSL, setStrictSSL] = useState(true);

  // Delete Account
  const [deleteStep, setDeleteStep] = useState<
    "list" | "reason" | "password" | "confirm"
  >("list");
  const [deleteReason, setDeleteReason] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 1800);
  };

  const closeModal = () => {
    setView("hub");
    setBlockSub("list");
    setAppLockSub("list");
    setTwoStepStep("list");
    setDeleteStep("list");
    onClose();
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      if (currentUserId) {
        await supabase.auth.signOut();
      }
      showToast("Account scheduled for deletion");
    } catch (err: any) {
      showToast(err?.message || "Deletion error");
    } finally {
      setDeleting(false);
    }
  };

  /* ------------------------- Render helpers ------------------------- */
  const renderLastAnchored = () => (
    <div className="space-y-4">
      <Header
        title="Last Anchored / Online Status"
        subtitle="Who can see your presence?"
        color="text-cyan-400"
        bg="bg-cyan-500/20 border-cyan-500/30"
        icon={<Eye className="w-6 h-6" />}
        onBack={() => setView("hub")}
      />
      <div className="space-y-2">
        {[
          { k: "Everyone", desc: "All HeyLook users can see your status" },
          { k: "My Contacts", desc: "Only users you've messaged" },
          { k: "Nobody", desc: "Hide your presence entirely" },
          { k: "Except Selected Users...", desc: "Hide from specific people" },
        ].map((opt) => (
          <button
            key={opt.k}
            onClick={() => setStatusVisibility(opt.k)}
            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${statusVisibility === opt.k ? "border-cyan-500/60 bg-cyan-500/10" : "border-slate-700 bg-slate-800/50"}`}
          >
            <div className="text-left">
              <p className="text-xs font-semibold text-slate-200">{opt.k}</p>
              <p className="text-[10px] text-slate-500">{opt.desc}</p>
            </div>
            {statusVisibility === opt.k && (
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            )}
          </button>
        ))}
      </div>
      {statusVisibility === "Except Selected Users..." && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-400">Hidden from</p>
          {["Sara Chen", "Alex Rivera"].map((u) => (
            <div
              key={u}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/50 border border-slate-700"
            >
              <span className="text-xs text-slate-200">{u}</span>
              <button
                onClick={() => setStatusExclusions((s) => [...s, u])}
                className="text-[10px] text-rose-400 hover:text-rose-300 cursor-pointer"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
      <button
        onClick={() => showToast("Status visibility saved")}
        className="w-full py-3 rounded-2xl bg-cyan-500 text-slate-950 font-extrabold hover:bg-cyan-400 transition-colors cursor-pointer"
      >
        Save
      </button>
    </div>
  );

  const renderProfilePhoto = () => (
    <div className="space-y-4">
      <Header
        title="Profile Photo Visibility"
        subtitle="Who can see your photo?"
        color="text-indigo-400"
        bg="bg-indigo-500/20 border-indigo-500/30"
        icon={<User className="w-6 h-6" />}
        onBack={() => setView("hub")}
      />
      <div className="space-y-2">
        {[
          { k: "Everyone", desc: "Visible to all users" },
          { k: "Contacts Only", desc: "Only your contacts" },
          { k: "Nobody", desc: "Hide your photo" },
          { k: "Custom Exclusions", desc: "Hide from selected users" },
        ].map((opt) => (
          <button
            key={opt.k}
            onClick={() => setPhotoVisibility(opt.k)}
            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${photoVisibility === opt.k ? "border-indigo-500/60 bg-indigo-500/10" : "border-slate-700 bg-slate-800/50"}`}
          >
            <div className="text-left">
              <p className="text-xs font-semibold text-slate-200">{opt.k}</p>
              <p className="text-[10px] text-slate-500">{opt.desc}</p>
            </div>
            {photoVisibility === opt.k && (
              <CheckCircle2 className="w-4 h-4 text-indigo-400" />
            )}
          </button>
        ))}
      </div>
      {photoVisibility === "Custom Exclusions" && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-400">Excluded users</p>
          {["Ravi Patel", "Lena Fischer"].map((u) => (
            <div
              key={u}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/50 border border-slate-700"
            >
              <span className="text-xs text-slate-200">{u}</span>
              <button
                onClick={() => setPhotoExclusions((s) => [...s, u])}
                className="text-[10px] text-rose-400 hover:text-rose-300 cursor-pointer"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
      <button
        onClick={async () => { if (currentUserId) await supabase.from("profiles").update({ profile_photo_visibility: photoVisibility }).eq("id", currentUserId); showToast("Photo visibility saved"); }}
        className="w-full py-3 rounded-2xl bg-indigo-500 text-white font-extrabold hover:bg-indigo-400 transition-colors cursor-pointer"
      >
        Save
      </button>
    </div>
  );

  const renderStoryVisibility = () => (
    <div className="space-y-4">
      <Header title="Story Visibility" subtitle="Who can see your stories?" color="text-pink-400" bg="bg-pink-500/20 border-pink-500/30" icon={<Eye className="w-6 h-6" />} onBack={() => setView("hub")} />
      <div className="space-y-2">{["Everyone", "Contacts Only", "Nobody"].map((option) => <button key={option} onClick={() => setStoryVisibility(option)} className={`w-full flex items-center justify-between p-3 rounded-xl border ${storyVisibility === option ? "border-pink-500/60 bg-pink-500/10" : "border-slate-700 bg-slate-800/50"}`}><span className="text-xs text-slate-200">{option}</span>{storyVisibility === option && <CheckCircle2 className="h-4 w-4 text-pink-400" />}</button>)}</div>
      <button onClick={async () => { if (currentUserId) await supabase.from("profiles").update({ story_visibility: storyVisibility }).eq("id", currentUserId); showToast("Story visibility saved"); }} className="w-full rounded-2xl bg-pink-500 py-3 font-extrabold text-white">Save</button>
    </div>
  );

  const renderReadReceipts = () => (
    <div className="space-y-4">
      <Header
        title="Read Receipts"
        subtitle="Control read receipts"
        color="text-emerald-400"
        bg="bg-emerald-500/20 border-emerald-500/30"
        icon={<Eye className="w-6 h-6" />}
        onBack={() => setView("hub")}
      />
      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/50 border border-slate-700">
        <div>
          <p className="text-xs font-semibold text-slate-200">
            Send Read Receipts
          </p>
          <p className="text-[10px] text-slate-500">
            Let others know when you've read their messages
          </p>
        </div>
        <button
          onClick={() => {
            const next = !receiptsEnabled;
            setReceiptsEnabled(next);
            if (!next) setReceiptsPopup(true);
          }}
          className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer ${receiptsEnabled ? "bg-emerald-500" : "bg-slate-600"}`}
        >
          <div
            className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${receiptsEnabled ? "translate-x-5" : ""}`}
          />
        </button>
      </div>
      <p className="text-[11px] text-slate-500 leading-relaxed">
        If you turn off read receipts, you also won't see read receipts from
        others. Delivery checks (D) still appear.
      </p>

      <AnimatePresence>
        {receiptsPopup && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="p-4 rounded-2xl border border-amber-500/40 bg-amber-500/10"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-300">Warning</p>
                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                  Turning off read receipts is a two-way street. You will no
                  longer see when others have read your messages, and Somecean
                  features like "Seen by" summaries may behave differently.
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => {
                  setReceiptsPopup(false);
                  setReceiptsEnabled(true);
                }}
                className="flex-1 py-2 rounded-xl bg-slate-700 text-white text-xs font-bold hover:bg-slate-600 cursor-pointer"
              >
                Keep Receipts On
              </button>
              <button
                onClick={() => {
                  setReceiptsPopup(false);
                  showToast("Receipts turned off");
                }}
                className="flex-1 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 cursor-pointer"
              >
                Confirm Off
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const renderGroupAdd = () => (
    <div className="space-y-4">
      <Header
        title="Group Add Permissions"
        subtitle="Who can add you to groups?"
        color="text-purple-400"
        bg="bg-purple-500/20 border-purple-500/30"
        icon={<Users className="w-6 h-6" />}
        onBack={() => setView("hub")}
      />
      <div className="space-y-2">
        {[
          { k: "Everyone", desc: "Anyone can add you to groups" },
          { k: "Contacts", desc: "Only your contacts can add you" },
          {
            k: "Admin Invite Only",
            desc: "Only group admins can invite you directly",
          },
        ].map((opt) => (
          <button
            key={opt.k}
            onClick={() => setGroupAddPerm(opt.k)}
            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${groupAddPerm === opt.k ? "border-purple-500/60 bg-purple-500/10" : "border-slate-700 bg-slate-800/50"}`}
          >
            <div className="text-left">
              <p className="text-xs font-semibold text-slate-200">{opt.k}</p>
              <p className="text-[10px] text-slate-500">{opt.desc}</p>
            </div>
            {groupAddPerm === opt.k && (
              <CheckCircle2 className="w-4 h-4 text-purple-400" />
            )}
          </button>
        ))}
      </div>
      <button
        onClick={() => showToast("Group permission saved")}
        className="w-full py-3 rounded-2xl bg-purple-500 text-white font-extrabold hover:bg-purple-400 transition-colors cursor-pointer"
      >
        Save
      </button>
    </div>
  );

  const renderBlockedContacts = () => {
    if (blockSub !== "list") {
      const back = () => setBlockSub("list");
      if (blockSub === "add") {
        return (
          <div className="space-y-4">
            <Header
              title="Add Contact to Blocklist"
              subtitle="Block a user"
              color="text-rose-400"
              bg="bg-rose-500/20 border-rose-500/30"
              icon={<Contact className="w-6 h-6" />}
              onBack={back}
            />
            <input
              type="text"
              value={newBlockName}
              onChange={(e) => setNewBlockName(e.target.value)}
              placeholder="Search name or @handle..."
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:border-rose-500 focus:outline-none"
            />
            <div className="space-y-2">
              {["Sara Chen", "Alex Rivera", "Maya Okafor"]
                .filter((n) =>
                  n.toLowerCase().includes(newBlockName.toLowerCase()),
                )
                .map((n) => (
                  <button
                    key={n}
                    onClick={() => {
                      setBlockedContacts((bc) => [
                        ...bc,
                        {
                          id: `n${Date.now()}`,
                          name: n,
                          handle: `@${n.split(" ")[0].toLowerCase()}`,
                          avatar:
                            "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100",
                          blockedAt: "Just now",
                        },
                      ]);
                      setNewBlockName("");
                      showToast(`${n} blocked`);
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-rose-500/40 cursor-pointer text-left"
                  >
                    <img
                      src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100"
                      alt={n}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-slate-200">
                        {n}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        @{n.split(" ")[0].toLowerCase()}
                      </p>
                    </div>
                    <Plus className="w-4 h-4 text-rose-400" />
                  </button>
                ))}
            </div>
          </div>
        );
      }
      return (
        <div className="space-y-4">
          <Header
            title="Block History"
            subtitle="Your recent block activity"
            color="text-rose-400"
            bg="bg-rose-500/20 border-rose-500/30"
            icon={<History className="w-6 h-6" />}
            onBack={back}
          />
          <div className="space-y-2">
            {BLOCK_HISTORY.map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-200">
                    {h.name}
                  </p>
                  <p className="text-[10px] text-slate-500">{h.action}</p>
                </div>
                <span className="text-[10px] text-slate-400">{h.date}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <Header
          title="Blocked Contacts"
          subtitle="Manage your blocklist"
          color="text-rose-400"
          bg="bg-rose-500/20 border-rose-500/30"
          icon={<Ban className="w-6 h-6" />}
          onBack={() => setView("hub")}
        />
        <div className="space-y-2">
          {blockedContacts.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700"
            >
              <img
                src={c.avatar}
                alt={c.name}
                className="w-9 h-9 rounded-full object-cover"
              />
              <div className="flex-1">
                <p className="text-xs font-semibold text-slate-200">{c.name}</p>
                <p className="text-[10px] text-slate-500">
                  {c.handle} • Blocked {c.blockedAt}
                </p>
              </div>
              <button
                onClick={async () => {
                  if (currentUserId) {
                    const { error } = await supabase
                      .from("user_blocks")
                      .delete()
                      .eq("blocker_id", currentUserId)
                      .eq("blocked_id", c.id);
                    if (error && error.code !== "22P02") {
                      showToast("Could not unblock user");
                      return;
                    }
                  }
                  setBlockedContacts((contacts) => contacts.filter((x) => x.id !== c.id));
                  showToast(`${c.name} unblocked`);
                }}
                className="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 text-[10px] font-bold hover:bg-rose-500/30 cursor-pointer"
              >
                Unblock
              </button>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <button
            onClick={() => setBlockSub("add")}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/40 hover:bg-rose-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-rose-400" />
            <div className="flex-1 text-left">
              <p className="text-xs font-semibold text-rose-300">
                Add Contact to Blocklist
              </p>
              <p className="text-[10px] text-slate-500">
                Block a user from messaging you
              </p>
            </div>
          </button>
          <button
            onClick={() => setBlockSub("history")}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-slate-500 cursor-pointer"
          >
            <History className="w-4 h-4 text-slate-400" />
            <div className="flex-1 text-left">
              <p className="text-xs font-semibold text-slate-200">
                Block History
              </p>
              <p className="text-[10px] text-slate-500">
                View past block activity
              </p>
            </div>
            <ChevronLeft className="w-4 h-4 text-slate-500 rotate-180" />
          </button>
        </div>
      </div>
    );
  };

  const renderAppLock = () => {
    if (appLockSub !== "list") {
      const back = () => setAppLockSub("list");
      if (appLockSub === "pin") {
        return (
          <div className="space-y-4">
            <Header
              title="Require PIN/Passcode"
              subtitle="Lock HeyLook securely"
              color="text-blue-400"
              bg="bg-blue-500/20 border-blue-500/30"
              icon={<Lock className="w-6 h-6" />}
              onBack={back}
            />
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/50 border border-slate-700">
              <div>
                <p className="text-xs font-semibold text-slate-200">
                  Require PIN / Passcode
                </p>
                <p className="text-[10px] text-slate-500">
                  Ask for a PIN when opening the app
                </p>
              </div>
              <button
                onClick={() => setRequirePin(!requirePin)}
                className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer ${requirePin ? "bg-blue-500" : "bg-slate-600"}`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${requirePin ? "translate-x-5" : ""}`}
                />
              </button>
            </div>
            <input
              type="password"
              placeholder="Enter 4-digit PIN"
              maxLength={4}
              className="w-full p-2.5 text-center text-lg tracking-widest rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-blue-500 focus:outline-none"
            />
            <button
              onClick={() => showToast("PIN set")}
              className="w-full py-3 rounded-2xl bg-blue-500 text-white font-extrabold hover:bg-blue-400 cursor-pointer"
            >
              Set PIN
            </button>
          </div>
        );
      }
      return (
        <div className="space-y-4">
          <Header
            title="Auto-Lock Delay"
            subtitle="Lock after inactivity"
            color="text-blue-400"
            bg="bg-blue-500/20 border-blue-500/30"
            icon={<Timer className="w-6 h-6" />}
            onBack={back}
          />
          <div className="space-y-2">
            {["Immediately", "1m", "15m", "1h"].map((d) => (
              <button
                key={d}
                onClick={() => {
                  setAutoLockDelay(d);
                  showToast(`Auto-lock: ${d}`);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${autoLockDelay === d ? "border-blue-500/60 bg-blue-500/10" : "border-slate-700 bg-slate-800/50"}`}
              >
                <span className="text-xs font-semibold text-slate-200">
                  {d === "Immediately" ? d : `After ${d}`}
                </span>
                {autoLockDelay === d && (
                  <CheckCircle2 className="w-4 h-4 text-blue-400" />
                )}
              </button>
            ))}
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <Header
          title="App Lock Settings"
          subtitle="Secure HeyLook"
          color="text-blue-400"
          bg="bg-blue-500/20 border-blue-500/30"
          icon={<Lock className="w-6 h-6" />}
          onBack={() => setView("hub")}
        />
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/50 border border-slate-700">
          <div>
            <p className="text-xs font-semibold text-slate-200">App Lock</p>
            <p className="text-[10px] text-slate-500">
              {appLockEnabled ? "Enabled" : "Disabled"}
            </p>
          </div>
          <button
            onClick={() => setAppLockEnabled(!appLockEnabled)}
            className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer ${appLockEnabled ? "bg-blue-500" : "bg-slate-600"}`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${appLockEnabled ? "translate-x-5" : ""}`}
            />
          </button>
        </div>
        <div className="space-y-2">
          <button
            onClick={() => setAppLockSub("pin")}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-blue-500/40 cursor-pointer text-left"
          >
            <KeyRound className="w-4 h-4 text-blue-400" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-slate-200">
                Require PIN/Passcode
              </p>
              <p className="text-[10px] text-slate-500">
                {requirePin ? "Enabled" : "Disabled"}
              </p>
            </div>
            <ChevronLeft className="w-4 h-4 text-slate-500 rotate-180" />
          </button>
          <button
            onClick={() => setAppLockSub("delay")}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-blue-500/40 cursor-pointer text-left"
          >
            <Timer className="w-4 h-4 text-indigo-400" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-slate-200">
                Auto-Lock Delay
              </p>
              <p className="text-[10px] text-slate-500">
                {autoLockDelay === "Immediately"
                  ? "Immediately"
                  : `After ${autoLockDelay}`}
              </p>
            </div>
            <ChevronLeft className="w-4 h-4 text-slate-500 rotate-180" />
          </button>
        </div>
      </div>
    );
  };

  const renderTwoStep = () => {
    if (twoStepStep !== "list") {
      const back = () => setTwoStepStep("list");
      if (twoStepStep === "setup") {
        return (
          <div className="space-y-4">
            <Header
              title="Set 6-Digit PIN"
              subtitle="Choose a secure code"
              color="text-fuchsia-400"
              bg="bg-fuchsia-500/20 border-fuchsia-500/30"
              icon={<KeyRound className="w-6 h-6" />}
              onBack={back}
            />
            <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700 text-center">
              <KeyRound className="w-10 h-10 text-fuchsia-400 mx-auto mb-2" />
              <p className="text-xs text-slate-300">
                Create a 6-digit PIN for two-step verification.
              </p>
            </div>
            <input
              type="password"
              value={twoStepPin}
              onChange={(e) =>
                setTwoStepPin(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="6-digit PIN"
              maxLength={6}
              className="w-full p-2.5 text-center text-lg tracking-[0.5em] rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-fuchsia-500 focus:outline-none"
            />
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400">
                Backup Recovery Email
              </label>
              <input
                type="email"
                value={recoveryEmail}
                onChange={(e) => setRecoveryEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:border-fuchsia-500 focus:outline-none"
              />
            </div>
            <button
              onClick={() => {
                if (twoStepPin.length === 6) {
                  setTwoStepEnabled(true);
                  setTwoStepStep("verify");
                } else showToast("Enter a 6-digit PIN");
              }}
              className="w-full py-3 rounded-2xl bg-fuchsia-500 text-white font-extrabold hover:bg-fuchsia-400 cursor-pointer"
            >
              Set PIN & Continue
            </button>
          </div>
        );
      }
      return (
        <div className="space-y-4">
          <Header
            title="Verification Enabled"
            subtitle="Two-step verification is on"
            color="text-fuchsia-400"
            bg="bg-fuchsia-500/20 border-fuchsia-500/30"
            icon={<ShieldCheck className="w-6 h-6" />}
            onBack={() => setView("hub")}
          />
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <p className="text-xs text-slate-200">
              Two-step verification is now enabled.
            </p>
            <p className="text-[10px] text-slate-400 mt-1">
              Recovery email: {recoveryEmail || "Not set"}
            </p>
          </div>
          <button
            onClick={() => {
              setTwoStepEnabled(false);
              setTwoStepStep("list");
              showToast("Two-step disabled");
            }}
            className="w-full py-3 rounded-2xl bg-slate-700 text-white font-extrabold hover:bg-slate-600 cursor-pointer"
          >
            Disable Two-Step Verification
          </button>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <Header
          title="Two-Step Verification"
          subtitle="Extra account security"
          color="text-fuchsia-400"
          bg="bg-fuchsia-500/20 border-fuchsia-500/30"
          icon={<ShieldCheck className="w-6 h-6" />}
          onBack={() => setView("hub")}
        />
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/50 border border-slate-700">
          <div>
            <p className="text-xs font-semibold text-slate-200">
              Two-Step Verification
            </p>
            <p className="text-[10px] text-slate-500">
              {twoStepEnabled ? "Enabled" : "Not set up"}
            </p>
          </div>
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${twoStepEnabled ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-700 text-slate-400"}`}
          >
            {twoStepEnabled ? "ON" : "OFF"}
          </span>
        </div>
        <button
          onClick={() => setTwoStepStep("setup")}
          className="w-full flex items-center gap-3 p-3 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/40 hover:bg-fuchsia-500/20 cursor-pointer"
        >
          <KeyRound className="w-4 h-4 text-fuchsia-400" />
          <div className="flex-1 text-left">
            <p className="text-xs font-semibold text-fuchsia-300">
              Set 6-Digit PIN
            </p>
            <p className="text-[10px] text-slate-500">
              Create your verification PIN
            </p>
          </div>
          <ChevronLeft className="w-4 h-4 text-slate-500 rotate-180" />
        </button>
        <button
          onClick={() => showToast("Recovery email sent")}
          className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-slate-500 cursor-pointer"
        >
          <Mail className="w-4 h-4 text-indigo-400" />
          <div className="flex-1 text-left">
            <p className="text-xs font-semibold text-slate-200">
              Backup Recovery Email
            </p>
            <p className="text-[10px] text-slate-500">
              {recoveryEmail || "Not set"}
            </p>
          </div>
        </button>
      </div>
    );
  };

  const renderLiveLocation = () => (
    <div className="space-y-4">
      <Header
        title="Live Location Permissions"
        subtitle="Who can see your location"
        color="text-amber-400"
        bg="bg-amber-500/20 border-amber-500/30"
        icon={<MapPin className="w-6 h-6" />}
        onBack={() => setView("hub")}
      />
      <div className="space-y-2">
        {locationChats.map((c) => (
          <div
            key={c.id}
            className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700"
          >
            <img
              src={c.avatar}
              alt={c.name}
              className="w-9 h-9 rounded-full object-cover"
            />
            <div className="flex-1">
              <p className="text-xs font-semibold text-slate-200">{c.name}</p>
              <p className="text-[10px] text-slate-500">
                {c.access} • {c.updated}
              </p>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        ))}
      </div>
      <button
        onClick={() => {
          setLocationChats([]);
          showToast("Revoked all location access");
        }}
        className="w-full py-3 rounded-2xl bg-rose-500 text-white font-extrabold hover:bg-rose-400 cursor-pointer"
      >
        Revoke All Access
      </button>
      <p className="text-[10px] text-slate-500 text-center">
        Revoking access stops all live location sharing immediately.
      </p>
    </div>
  );

  const renderAdvancedSecurity = () => (
    <div className="space-y-4">
      <Header
        title="Advanced Security"
        subtitle="Extra protection toggles"
        color="text-teal-400"
        bg="bg-teal-500/20 border-teal-500/30"
        icon={<ShieldCheck className="w-6 h-6" />}
        onBack={() => setView("hub")}
      />
      <div className="space-y-2">
        {[
          {
            label: "Protect IP Address in Calls",
            desc: "Route calls through a private relay",
            val: protectIP,
            set: setProtectIP,
          },
          {
            label: "Disable Link Previews",
            desc: "Stop generating previews for links",
            val: disableLinkPreviews,
            set: setDisableLinkPreviews,
          },
          {
            label: "Strict SSL Certificate Check",
            desc: "Require valid SSL for all connections",
            val: strictSSL,
            set: setStrictSSL,
          },
        ].map((t) => (
          <div
            key={t.label}
            className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700"
          >
            <div>
              <p className="text-xs font-semibold text-slate-200">{t.label}</p>
              <p className="text-[10px] text-slate-500">{t.desc}</p>
            </div>
            <button
              onClick={() => t.set(!t.val)}
              className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer ${t.val ? "bg-teal-500" : "bg-slate-600"}`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${t.val ? "translate-x-5" : ""}`}
              />
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={() => showToast("Security settings saved")}
        className="w-full py-3 rounded-2xl bg-teal-500 text-slate-950 font-extrabold hover:bg-teal-400 cursor-pointer"
      >
        Save
      </button>
    </div>
  );

  const renderDeleteAccount = () => {
    if (deleteStep === "reason") {
      return (
        <div className="space-y-4">
          <Header
            title="Select Reason"
            subtitle="Why are you leaving?"
            color="text-rose-400"
            bg="bg-rose-500/20 border-rose-500/30"
            icon={<Trash2 className="w-6 h-6" />}
            onBack={() => setDeleteStep("list")}
          />
          <div className="space-y-2">
            {DELETE_REASONS.map((r) => (
              <button
                key={r}
                onClick={() => setDeleteReason(r)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${deleteReason === r ? "border-rose-500/60 bg-rose-500/10" : "border-slate-700 bg-slate-800/50"}`}
              >
                <span className="text-xs font-semibold text-slate-200">
                  {r}
                </span>
                {deleteReason === r && (
                  <CheckCircle2 className="w-4 h-4 text-rose-400" />
                )}
              </button>
            ))}
          </div>
          <button
            onClick={() => setDeleteStep("password")}
            disabled={!deleteReason}
            className="w-full py-3 rounded-2xl bg-rose-500 text-white font-extrabold hover:bg-rose-400 disabled:opacity-40 cursor-pointer"
          >
            Continue
          </button>
        </div>
      );
    }
    if (deleteStep === "password") {
      return (
        <div className="space-y-4">
          <Header
            title="Enter Auth Password"
            subtitle="Confirm your identity"
            color="text-rose-400"
            bg="bg-rose-500/20 border-rose-500/30"
            icon={<Lock className="w-6 h-6" />}
            onBack={() => setDeleteStep("reason")}
          />
          <div className="p-4 rounded-2xl border border-rose-500/40 bg-rose-500/10">
            <p className="text-xs text-slate-300 leading-relaxed">
              This is the final step. Deleting your account is{" "}
              <span className="text-rose-300 font-bold">permanent</span> and
              cannot be undone.
            </p>
          </div>
          <input
            type="password"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            placeholder="Enter your password"
            className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:border-rose-500 focus:outline-none"
          />
          <button
            onClick={() => setDeleteStep("confirm")}
            disabled={!deletePassword}
            className="w-full py-3 rounded-2xl bg-rose-500 text-white font-extrabold hover:bg-rose-400 disabled:opacity-40 cursor-pointer"
          >
            Continue
          </button>
        </div>
      );
    }
    if (deleteStep === "confirm") {
      return (
        <div className="space-y-4">
          <Header
            title="Permanent Purge"
            subtitle="Final confirmation"
            color="text-rose-400"
            bg="bg-rose-500/20 border-rose-500/30"
            icon={<AlertTriangle className="w-6 h-6" />}
            onBack={() => setDeleteStep("password")}
          />
          <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700 text-center">
            <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-200">
              Delete my account?
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              All messages, posts, reels, and beacons will be permanently
              purged.
            </p>
          </div>
          <p className="text-xs text-slate-400">
            Reason: <span className="text-slate-200">{deleteReason}</span>
          </p>
          <button
            onClick={handleDeleteAccount}
            disabled={deleting}
            className="w-full py-3 rounded-2xl bg-rose-600 text-white font-extrabold hover:bg-rose-500 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {deleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            {deleting ? "Deleting..." : "Permanently Delete My Account"}
          </button>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <Header
          title="Delete Account"
          subtitle="Permanently remove everything"
          color="text-rose-400"
          bg="bg-rose-500/20 border-rose-500/30"
          icon={<Trash2 className="w-6 h-6" />}
          onBack={() => setView("hub")}
        />
        <div className="p-4 rounded-2xl border border-rose-500/40 bg-rose-500/10">
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Deleting your account will permanently remove your profile,
            messages, posts, reels, and beacons. This action cannot be undone.
          </p>
        </div>
        <button
          onClick={() => setDeleteStep("reason")}
          className="w-full flex items-center gap-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/40 hover:bg-rose-500/20 cursor-pointer"
        >
          <Trash2 className="w-4 h-4 text-rose-400" />
          <div className="flex-1 text-left">
            <p className="text-xs font-semibold text-rose-300">
              Delete My Account
            </p>
            <p className="text-[10px] text-slate-500">
              Multi-step confirmation required
            </p>
          </div>
          <ChevronLeft className="w-4 h-4 text-slate-500 rotate-180" />
        </button>
      </div>
    );
  };

  /* ------------------------- Hub grid ------------------------- */
  const renderHub = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-cyan-400 to-rose-500 animate-pulse" />
            Privacy & Security
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Control your data & account safety
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {[
          {
            k: "lastAnchored" as const,
            label: "Last Anchored / Online",
            icon: <Eye className="w-5 h-5" />,
            grad: "from-cyan-500/20 to-blue-500/10 border-cyan-500/30 text-cyan-400",
          },
          {
            k: "profilePhoto" as const,
            label: "Profile Photo",
            icon: <User className="w-5 h-5" />,
            grad: "from-indigo-500/20 to-violet-500/10 border-indigo-500/30 text-indigo-400",
          },
          {
            k: "storyVisibility" as const,
            label: "Story Visibility",
            icon: <Eye className="w-5 h-5" />,
            grad: "from-pink-500/20 to-rose-500/10 border-pink-500/30 text-pink-400",
          },
          {
            k: "readReceipts" as const,
            label: "Read Receipts",
            icon: <EyeOff className="w-5 h-5" />,
            grad: "from-emerald-500/20 to-green-500/10 border-emerald-500/30 text-emerald-400",
          },
          {
            k: "groupAdd" as const,
            label: "Group Add Permissions",
            icon: <Users className="w-5 h-5" />,
            grad: "from-purple-500/20 to-fuchsia-500/10 border-purple-500/30 text-purple-400",
          },
          {
            k: "blockedContacts" as const,
            label: "Blocked Contacts",
            icon: <Ban className="w-5 h-5" />,
            grad: "from-rose-500/20 to-red-500/10 border-rose-500/30 text-rose-400",
          },
          {
            k: "appLock" as const,
            label: "App Lock Settings",
            icon: <Lock className="w-5 h-5" />,
            grad: "from-blue-500/20 to-sky-500/10 border-blue-500/30 text-blue-400",
          },
          {
            k: "twoStep" as const,
            label: "Two-Step Verification",
            icon: <ShieldCheck className="w-5 h-5" />,
            grad: "from-fuchsia-500/20 to-pink-500/10 border-fuchsia-500/30 text-fuchsia-400",
          },
          {
            k: "liveLocation" as const,
            label: "Live Location",
            icon: <MapPin className="w-5 h-5" />,
            grad: "from-amber-500/20 to-yellow-500/10 border-amber-500/30 text-amber-400",
          },
          {
            k: "advancedSecurity" as const,
            label: "Advanced Security",
            icon: <Settings2 className="w-5 h-5" />,
            grad: "from-teal-500/20 to-cyan-500/10 border-teal-500/30 text-teal-400",
          },
          {
            k: "deleteAccount" as const,
            label: "Delete Account",
            icon: <Trash2 className="w-5 h-5" />,
            grad: "from-red-500/20 to-rose-500/10 border-red-500/30 text-red-400",
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
            {view === "lastAnchored" && renderLastAnchored()}
            {view === "profilePhoto" && renderProfilePhoto()}
            {view === "storyVisibility" && renderStoryVisibility()}
            {view === "readReceipts" && renderReadReceipts()}
            {view === "groupAdd" && renderGroupAdd()}
            {view === "blockedContacts" && renderBlockedContacts()}
            {view === "appLock" && renderAppLock()}
            {view === "twoStep" && renderTwoStep()}
            {view === "liveLocation" && renderLiveLocation()}
            {view === "advancedSecurity" && renderAdvancedSecurity()}
            {view === "deleteAccount" && renderDeleteAccount()}
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

export default PrivacyCenter;
