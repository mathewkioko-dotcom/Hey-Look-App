import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  ChevronLeft,
  Bell,
MessageCircle,
  Eye,
  Music,
  Vibrate,
  Volume2,
  Users,
  BellOff,
  AtSign,
  Send,
  Smile,
  Radio,
  Phone,
  Building2,
  Moon,
  AlarmClock,
  CalendarDays,
  Repeat,
  Anchor,
  Film,
  Sparkles,
  Bot,
  CheckCircle2,
  BadgeCheck,
  Mail,
  FileText,
  ShieldAlert,
  MessageSquare,
  RotateCcw,
  AlertTriangle,
  SlidersHorizontal,
} from "lucide-react";

type NotificationView =
  | "hub"
  | "messageNotifications"
  | "groupNotifications"
  | "inAppSounds"
  | "callNotifications"
  | "dndSchedule"
  | "beaconReelAlerts"
  | "hymliAlerts"
  | "badgeCount"
  | "emailNotifications"
  | "resetSettings";

interface NotificationHubProps {
  isOpen: boolean;
  onClose: () => void;
}

/* ------------------------- Sample Data ------------------------- */
const SOUND_TONES = ["Siren", "Harbor Bell", "Digital Chime", "Ping", "Soft Wave"];

const RINGTONES = ["Marco Polo", "Underwater Echo", "Canary", "Ocean Breeze"];

const BADGE_OPTIONS = [
  { k: "Count Unread Messages", desc: "Shows only unread chat count" },
  { k: "Count All Unread Activity", desc: "Includes calls, beacons & reels" },
  { k: "Disable Badges", desc: "Hide all badge counts" },
];

/* ====================================================================== */
/*  MAIN COMPONENT                                                         */
/* ====================================================================== */
export const NotificationHub: React.FC<NotificationHubProps> = ({
  isOpen,
  onClose,
}) => {
  const [view, setView] = useState<NotificationView>("hub");
  const [toast, setToast] = useState<string>("");

  // Message Notifications
  const [showPreviews, setShowPreviews] = useState(true);
  const [msgSound, setMsgSound] = useState("Siren");
  const [vibratePattern, setVibratePattern] = useState("Default");

  // Group Notifications
  const [muteAllGroups, setMuteAllGroups] = useState(false);
  const [groupAlertTone, setGroupAlertTone] = useState("Harbor Bell");
  const [mentionAlertsOnly, setMentionAlertsOnly] = useState(false);

  // In-App Sounds
  const [chatSentSound, setChatSentSound] = useState(true);
  const [reactionPopSound, setReactionPopSound] = useState(true);
  const [beaconCastChime, setBeaconCastChime] = useState(true);

  // Call Notifications
  const [ringtone, setRingtone] = useState("Marco Polo");
  const [vibrationStrength, setVibrationStrength] = useState("Medium");
  const [callBanners, setCallBanners] = useState(true);

  // Do Not Disturb Schedule
  const [dndStart, setDndStart] = useState("22:00");
  const [dndEnd, setDndEnd] = useState("08:00");
  const [dndDays, setDndDays] = useState<string[]>(["Mon", "Fri"]);
  const [repeatWeekly, setRepeatWeekly] = useState(true);

  // Beacon & Reel Alerts
  const [beaconReelFreq, setBeaconReelFreq] = useState("Top Friends Only");

  // Hymli AI Activity Alerts
  const [hymliTaskNotif, setHymliTaskNotif] = useState(true);
  const [hymliAutoReplyAlerts, setHymliAutoReplyAlerts] = useState(false);

  // Badge Count
  const [badgeOption, setBadgeOption] = useState("Count Unread Messages");

  // Email Notifications
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);
  const [missedDMs, setMissedDMs] = useState(false);

  // Reset
  const [confirmReset, setConfirmReset] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 1800);
  };

  const closeModal = () => {
    setView("hub");
    setConfirmReset(false);
    onClose();
  };

  const resetAll = () => {
    setShowPreviews(true);
    setMsgSound("Siren");
    setVibratePattern("Default");
    setMuteAllGroups(false);
    setGroupAlertTone("Harbor Bell");
    setMentionAlertsOnly(false);
    setChatSentSound(true);
    setReactionPopSound(true);
    setBeaconCastChime(true);
    setRingtone("Marco Polo");
    setVibrationStrength("Medium");
    setCallBanners(true);
    setDndStart("22:00");
    setDndEnd("08:00");
    setDndDays(["Mon", "Fri"]);
    setRepeatWeekly(true);
    setBeaconReelFreq("Top Friends Only");
    setHymliTaskNotif(true);
    setHymliAutoReplyAlerts(false);
    setBadgeOption("Count Unread Messages");
    setWeeklyDigest(true);
    setSecurityAlerts(true);
    setMissedDMs(false);
    setConfirmReset(false);
    showToast("All notification settings reset to default ✓");
  };

  /* ------------------------- Toggle switch helper ------------------------- */
  const Toggle: React.FC<{ on: boolean; onClick: () => void; color?: string }> = ({
    on,
    onClick,
    color = "bg-cyan-500",
  }) => (
    <button
      onClick={onClick}
      className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer ${on ? color : "bg-slate-600"}`}
    >
      <div
        className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-5" : ""}`}
      />
    </button>
  );

  const TokenChip: React.FC<{ value: string }> = ({ value }) => (
    <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-[10px] font-bold text-slate-200">
      {value}
    </span>
  );

  /* ------------------------- Render helpers ------------------------- */
  const renderMessageNotifications = () => (
    <div className="space-y-4">
      <Header
        title="Message Notifications"
        subtitle="Customize chat alerts"
        color="text-cyan-400"
        bg="bg-cyan-500/20 border-cyan-500/30"
        icon={<MessageCircle className="w-6 h-6" />}
        onBack={() => setView("hub")}
      />
      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/50 border border-slate-700">
        <div className="flex items-center gap-3">
          <Eye className="w-4 h-4 text-cyan-400" />
          <div>
            <p className="text-xs font-semibold text-slate-200">
              Show Message Previews
            </p>
            <p className="text-[10px] text-slate-500">
              Display message text in notifications
            </p>
          </div>
        </div>
        <Toggle on={showPreviews} onClick={() => setShowPreviews(!showPreviews)} />
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
          <Music className="w-3.5 h-3.5 text-amber-400" /> Sound Tone Selector
        </p>
        {SOUND_TONES.map((t) => (
          <button
            key={t}
            onClick={() => {
              setMsgSound(t);
              showToast(`Sound: ${t}`);
            }}
            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${msgSound === t ? "border-cyan-500/60 bg-cyan-500/10" : "border-slate-700 bg-slate-800/50"}`}
          >
            <span className="text-xs font-semibold text-slate-200">{t}</span>
            {msgSound === t && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
          <Vibrate className="w-3.5 h-3.5 text-indigo-400" /> Vibrate Pattern
        </p>
        {["Default", "Short Pulses", "Long Buzz", "None"].map((p) => (
          <button
            key={p}
            onClick={() => {
              setVibratePattern(p);
              showToast(`Vibration: ${p}`);
            }}
            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${vibratePattern === p ? "border-indigo-500/60 bg-indigo-500/10" : "border-slate-700 bg-slate-800/50"}`}
          >
            <span className="text-xs font-semibold text-slate-200">{p}</span>
            {vibratePattern === p && (
              <CheckCircle2 className="w-4 h-4 text-indigo-400" />
            )}
          </button>
        ))}
      </div>
    </div>
  );

  const renderGroupNotifications = () => (
    <div className="space-y-4">
      <Header
        title="Group Notifications"
        subtitle="Manage group alerts"
        color="text-emerald-400"
        bg="bg-emerald-500/20 border-emerald-500/30"
        icon={<Users className="w-6 h-6" />}
        onBack={() => setView("hub")}
      />
      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/50 border border-slate-700">
        <div className="flex items-center gap-3">
          <BellOff className="w-4 h-4 text-emerald-400" />
          <div>
            <p className="text-xs font-semibold text-slate-200">
              Mute All Group Notifications
            </p>
            <p className="text-[10px] text-slate-500">
              Silence all group activity
            </p>
          </div>
        </div>
        <Toggle
          on={muteAllGroups}
          onClick={() => setMuteAllGroups(!muteAllGroups)}
          color="bg-emerald-500"
        />
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
          <Music className="w-3.5 h-3.5 text-amber-400" /> Custom Group Alert Tone
        </p>
        {["Harbor Bell", "Squad Horn", "Silent", "Digital Chime"].map((t) => (
          <button
            key={t}
            onClick={() => {
              setGroupAlertTone(t);
              showToast(`Group tone: ${t}`);
            }}
            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${groupAlertTone === t ? "border-emerald-500/60 bg-emerald-500/10" : "border-slate-700 bg-slate-800/50"}`}
          >
            <span className="text-xs font-semibold text-slate-200">{t}</span>
            {groupAlertTone === t && (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/50 border border-slate-700">
        <div className="flex items-center gap-3">
          <AtSign className="w-4 h-4 text-emerald-400" />
          <div>
            <p className="text-xs font-semibold text-slate-200">
              Mention Alerts Only
            </p>
            <p className="text-[10px] text-slate-500">
              Notify only when you're @mentioned
            </p>
          </div>
        </div>
        <Toggle
          on={mentionAlertsOnly}
          onClick={() => setMentionAlertsOnly(!mentionAlertsOnly)}
          color="bg-emerald-500"
        />
      </div>
    </div>
  );

  const renderInAppSounds = () => (
    <div className="space-y-4">
      <Header
        title="In-App Sounds"
        subtitle="Toggle internal sound effects"
        color="text-pink-400"
        bg="bg-pink-500/20 border-pink-500/30"
        icon={<Volume2 className="w-6 h-6" />}
        onBack={() => setView("hub")}
      />
      {[
        { label: "Chat Sent Sound", desc: "Plays when you send a message", val: chatSentSound, set: setChatSentSound, icon: <Send className="w-4 h-4 text-pink-400" /> },
        { label: "Reaction Pop Sound", desc: "Plays when you send a reaction", val: reactionPopSound, set: setReactionPopSound, icon: <Smile className="w-4 h-4 text-pink-400" /> },
        { label: "Beacon Cast Chime", desc: "Plays when you cast a Beacon", val: beaconCastChime, set: setBeaconCastChime, icon: <Radio className="w-4 h-4 text-pink-400" /> },
      ].map((s) => (
        <div
          key={s.label}
          className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/50 border border-slate-700"
        >
          <div className="flex items-center gap-3">
            {s.icon}
            <div>
              <p className="text-xs font-semibold text-slate-200">{s.label}</p>
              <p className="text-[10px] text-slate-500">{s.desc}</p>
            </div>
          </div>
          <Toggle
            on={s.val}
            onClick={() => s.set(!s.val)}
            color="bg-pink-500"
          />
        </div>
      ))}
    </div>
  );

  const renderCallNotifications = () => (
    <div className="space-y-4">
      <Header
        title="Call Notifications"
        subtitle="Call ring & banner preferences"
        color="text-indigo-400"
        bg="bg-indigo-500/20 border-indigo-500/30"
        icon={<Phone className="w-6 h-6" />}
        onBack={() => setView("hub")}
      />
      <div className="space-y-2">
        <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
          <Volume2 className="w-3.5 h-3.5 text-indigo-400" /> Ringtone Selector
        </p>
        {RINGTONES.map((r) => (
          <button
            key={r}
            onClick={() => {
              setRingtone(r);
              showToast(`Ringtone: ${r}`);
            }}
            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${ringtone === r ? "border-indigo-500/60 bg-indigo-500/10" : "border-slate-700 bg-slate-800/50"}`}
          >
            <span className="text-xs font-semibold text-slate-200">{r}</span>
            {ringtone === r && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
          <Vibrate className="w-3.5 h-3.5 text-indigo-400" /> Vibration Strength
        </p>
        {["None", "Light", "Medium", "Strong"].map((v) => (
          <button
            key={v}
            onClick={() => {
              setVibrationStrength(v);
              showToast(`Vibration: ${v}`);
            }}
            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${vibrationStrength === v ? "border-indigo-500/60 bg-indigo-500/10" : "border-slate-700 bg-slate-800/50"}`}
          >
            <span className="text-xs font-semibold text-slate-200">{v}</span>
            {vibrationStrength === v && (
              <CheckCircle2 className="w-4 h-4 text-indigo-400" />
            )}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/50 border border-slate-700">
        <div className="flex items-center gap-3">
          <Building2 className="w-4 h-4 text-indigo-400" />
          <div>
            <p className="text-xs font-semibold text-slate-200">
              Pop-up Call Banners
            </p>
            <p className="text-[10px] text-slate-500">
              Show full-screen incoming call
            </p>
          </div>
        </div>
        <Toggle
          on={callBanners}
          onClick={() => setCallBanners(!callBanners)}
          color="bg-indigo-500"
        />
      </div>
    </div>
  );

  const renderDndSchedule = () => (
    <div className="space-y-4">
      <Header
        title="Do Not Disturb Schedule"
        subtitle="Silence during set hours"
        color="text-purple-400"
        bg="bg-purple-500/20 border-purple-500/30"
        icon={<Moon className="w-6 h-6" />}
        onBack={() => setView("hub")}
      />
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <AlarmClock className="w-3.5 h-3.5 text-purple-400" /> Start
          </span>
          <input
            type="time"
            value={dndStart}
            onChange={(e) => setDndStart(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 focus:border-purple-500 focus:outline-none"
          />
        </div>
        <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <AlarmClock className="w-3.5 h-3.5 text-indigo-400" /> End
          </span>
          <input
            type="time"
            value={dndEnd}
            onChange={(e) => setDndEnd(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 focus:border-purple-500 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <p className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-1.5">
          <CalendarDays className="w-3.5 h-3.5 text-purple-400" /> Days Active
        </p>
        <div className="flex flex-wrap gap-2">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => {
            const active = dndDays.includes(d);
            return (
              <button
                key={d}
                onClick={() =>
                  setDndDays((days) =>
                    active ? days.filter((x) => x !== d) : [...days, d],
                  )
                }
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${active ? "bg-purple-500 text-white border-purple-400" : "bg-slate-800 text-slate-400 border-slate-700"}`}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/50 border border-slate-700">
        <div className="flex items-center gap-3">
          <Repeat className="w-4 h-4 text-purple-400" />
          <div>
            <p className="text-xs font-semibold text-slate-200">Repeat Weekly</p>
            <p className="text-[10px] text-slate-500">
              Reapply this schedule every week
            </p>
          </div>
        </div>
        <Toggle
          on={repeatWeekly}
          onClick={() => setRepeatWeekly(!repeatWeekly)}
          color="bg-purple-500"
        />
      </div>
    </div>
  );

  const renderBeaconReelAlerts = () => {
    const opts = [
      { k: "All Activity", desc: "Notify for every beacon & reel", icon: <Film className="w-4 h-4 text-pink-400" /> },
      { k: "Top Friends Only", desc: "Only from your top friends", icon: <Anchor className="w-4 h-4 text-cyan-400" /> },
      { k: "Off", desc: "No beacon or reel alerts", icon: <BellOff className="w-4 h-4 text-rose-400" /> },
    ];
    return (
      <div className="space-y-4">
        <Header
          title="Beacon & Reel Alerts"
          subtitle="Choose alert frequency"
          color="text-pink-400"
          bg="bg-pink-500/20 border-pink-500/30"
          icon={<Anchor className="w-6 h-6" />}
          onBack={() => setView("hub")}
        />
        <div className="space-y-2">
          {opts.map((o) => (
            <button
              key={o.k}
              onClick={() => {
                setBeaconReelFreq(o.k);
                showToast(`Alerts: ${o.k}`);
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${beaconReelFreq === o.k ? "border-pink-500/60 bg-pink-500/10" : "border-slate-700 bg-slate-800/50"}`}
            >
              {o.icon}
              <div className="flex-1 text-left">
                <p className="text-xs font-semibold text-slate-200">{o.k}</p>
                <p className="text-[10px] text-slate-500">{o.desc}</p>
              </div>
              {beaconReelFreq === o.k && (
                <CheckCircle2 className="w-4 h-4 text-pink-400" />
              )}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderHymliAlerts = () => (
    <div className="space-y-4">
      <Header
        title="Hymli AI Activity Alerts"
        subtitle="Notify about AI tasks"
        color="text-fuchsia-400"
        bg="bg-fuchsia-500/20 border-fuchsia-500/30"
        icon={<Bot className="w-6 h-6" />}
        onBack={() => setView("hub")}
      />
      {[
        { label: "Task Completed Notification", desc: "Alert when an AI task finishes", val: hymliTaskNotif, set: setHymliTaskNotif, icon: <CheckCircle2 className="w-4 h-4 text-fuchsia-400" /> },
        { label: "AI Auto-Reply Alerts", desc: "Notify when AI auto-replies", val: hymliAutoReplyAlerts, set: setHymliAutoReplyAlerts, icon: <Bot className="w-4 h-4 text-fuchsia-400" /> },
      ].map((t) => (
        <div
          key={t.label}
          className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/50 border border-slate-700"
        >
          <div className="flex items-center gap-3">
            {t.icon}
            <div>
              <p className="text-xs font-semibold text-slate-200">{t.label}</p>
              <p className="text-[10px] text-slate-500">{t.desc}</p>
            </div>
          </div>
          <Toggle
            on={t.val}
            onClick={() => t.set(!t.val)}
            color="bg-fuchsia-500"
          />
        </div>
      ))}
    </div>
  );

  const renderBadgeCount = () => (
    <div className="space-y-4">
      <Header
        title="Badge Count Settings"
        subtitle="What the badge icon shows"
        color="text-amber-400"
        bg="bg-amber-500/20 border-amber-500/30"
        icon={<BadgeCheck className="w-6 h-6" />}
        onBack={() => setView("hub")}
      />
      <div className="space-y-2">
        {BADGE_OPTIONS.map((o) => (
          <button
            key={o.k}
            onClick={() => {
              setBadgeOption(o.k);
              showToast(`Badge: ${o.k}`);
            }}
            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${badgeOption === o.k ? "border-amber-500/60 bg-amber-500/10" : "border-slate-700 bg-slate-800/50"}`}
          >
            <div className="text-left">
              <p className="text-xs font-semibold text-slate-200">{o.k}</p>
              <p className="text-[10px] text-slate-500">{o.desc}</p>
            </div>
            {badgeOption === o.k && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
          </button>
        ))}
      </div>
      <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700 flex items-center gap-3">
        <span className="w-6 h-6 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
          {badgeOption === "Disable Badges" ? "0" : "3"}
        </span>
        <span className="text-xs text-slate-300">{badgeOption}</span>
      </div>
    </div>
  );

  const renderEmailNotifications = () => (
    <div className="space-y-4">
      <Header
        title="Email Notifications"
        subtitle="Manage email alerts"
        color="text-blue-400"
        bg="bg-blue-500/20 border-blue-500/30"
        icon={<Mail className="w-6 h-6" />}
        onBack={() => setView("hub")}
      />
      {[
        { label: "Weekly Digest", desc: "Summary of your week", val: weeklyDigest, set: setWeeklyDigest, icon: <FileText className="w-4 h-4 text-blue-400" /> },
        { label: "Security Alerts", desc: "Suspicious sign-in warnings", val: securityAlerts, set: setSecurityAlerts, icon: <ShieldAlert className="w-4 h-4 text-blue-400" /> },
        { label: "Direct Messages Missed", desc: "Email when you miss a DM", val: missedDMs, set: setMissedDMs, icon: <MessageSquare className="w-4 h-4 text-blue-400" /> },
      ].map((e) => (
        <div
          key={e.label}
          className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/50 border border-slate-700"
        >
          <div className="flex items-center gap-3">
            {e.icon}
            <div>
              <p className="text-xs font-semibold text-slate-200">{e.label}</p>
              <p className="text-[10px] text-slate-500">{e.desc}</p>
            </div>
          </div>
          <Toggle on={e.val} onClick={() => e.set(!e.val)} color="bg-blue-500" />
        </div>
      ))}
    </div>
  );

  const renderResetSettings = () => (
    <div className="space-y-4">
      <Header
        title="Reset Notification Settings"
        subtitle="Restore defaults"
        color="text-rose-400"
        bg="bg-rose-500/20 border-rose-500/30"
        icon={<RotateCcw className="w-6 h-6" />}
        onBack={() => setView("hub")}
      />
      {!confirmReset ? (
        <div className="p-4 rounded-2xl border border-rose-500/40 bg-rose-500/10 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-300 leading-relaxed">
            This will reset all notification parameters (sounds, toggles,
            schedules, and frequencies) back to their default schema.
          </p>
        </div>
      ) : (
        <div className="p-4 rounded-2xl border border-rose-500/40 bg-rose-500/10 text-center">
          <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto mb-2" />
          <p className="text-xs font-bold text-rose-300">
            Are you sure you want to reset all notification settings?
          </p>
        </div>
      )}
      <div className="flex gap-2">
        <button
          onClick={resetAll}
          className="flex-1 py-3 rounded-2xl bg-rose-500 text-white font-extrabold hover:bg-rose-400 flex items-center justify-center gap-2 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          Yes, Reset All
        </button>
        <button
          onClick={() => {
            setConfirmReset(true);
            setView("hub");
            showToast("Reset cancelled");
          }}
          className="flex-1 py-3 rounded-2xl bg-slate-700 text-white font-extrabold hover:bg-slate-600 cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  /* ------------------------- Hub grid ------------------------- */
  const renderHub = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-cyan-400 to-pink-500 animate-pulse" />
            Notification & Sound Hub
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage alerts, sounds & schedules
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {[
          { k: "messageNotifications" as const, label: "Message Notifications", icon: <MessageCircle className="w-5 h-5" />, grad: "from-cyan-500/20 to-blue-500/10 border-cyan-500/30 text-cyan-400" },
          { k: "groupNotifications" as const, label: "Group Notifications", icon: <Users className="w-5 h-5" />, grad: "from-emerald-500/20 to-green-500/10 border-emerald-500/30 text-emerald-400" },
          { k: "inAppSounds" as const, label: "In-App Sounds", icon: <Volume2 className="w-5 h-5" />, grad: "from-pink-500/20 to-rose-500/10 border-pink-500/30 text-pink-400" },
          { k: "callNotifications" as const, label: "Call Notifications", icon: <Phone className="w-5 h-5" />, grad: "from-indigo-500/20 to-violet-500/10 border-indigo-500/30 text-indigo-400" },
          { k: "dndSchedule" as const, label: "Do Not Disturb", icon: <Moon className="w-5 h-5" />, grad: "from-purple-500/20 to-fuchsia-500/10 border-purple-500/30 text-purple-400" },
          { k: "beaconReelAlerts" as const, label: "Beacon & Reel Alerts", icon: <Anchor className="w-5 h-5" />, grad: "from-cyan-500/20 to-teal-500/10 border-cyan-500/30 text-cyan-400" },
          { k: "hymliAlerts" as const, label: "Hymli AI Alerts", icon: <Bot className="w-5 h-5" />, grad: "from-fuchsia-500/20 to-pink-500/10 border-fuchsia-500/30 text-fuchsia-400" },
          { k: "badgeCount" as const, label: "Badge Count", icon: <BadgeCheck className="w-5 h-5" />, grad: "from-amber-500/20 to-yellow-500/10 border-amber-500/30 text-amber-400" },
          { k: "emailNotifications" as const, label: "Email Notifications", icon: <Mail className="w-5 h-5" />, grad: "from-blue-500/20 to-sky-500/10 border-blue-500/30 text-blue-400" },
          { k: "resetSettings" as const, label: "Reset Settings", icon: <RotateCcw className="w-5 h-5" />, grad: "from-rose-500/20 to-red-500/10 border-rose-500/30 text-rose-400" },
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
            {view === "messageNotifications" && renderMessageNotifications()}
            {view === "groupNotifications" && renderGroupNotifications()}
            {view === "inAppSounds" && renderInAppSounds()}
            {view === "callNotifications" && renderCallNotifications()}
            {view === "dndSchedule" && renderDndSchedule()}
            {view === "beaconReelAlerts" && renderBeaconReelAlerts()}
            {view === "hymliAlerts" && renderHymliAlerts()}
            {view === "badgeCount" && renderBadgeCount()}
            {view === "emailNotifications" && renderEmailNotifications()}
            {view === "resetSettings" && renderResetSettings()}
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

export default NotificationHub;

