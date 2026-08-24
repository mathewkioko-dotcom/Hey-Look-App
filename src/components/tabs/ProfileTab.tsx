import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  User,
  Settings,
  Sun,
  Moon,
  LogOut,
  LogIn,
  Edit3,
  CheckCircle2,
  Grid,
  Film,
  Bookmark,
  Shield,
  Bell,
  Sparkles,
  Save,
  Anchor,
  Activity,
  Check,
  ChevronRight,
} from "lucide-react";
import { Profile, NauticalPresenceState } from "../../types";
import { feedService } from "../../services/feedService";
import {
  getCustomTypingPhrase,
  setCustomTypingPhrase,
} from "../../hooks/useTypingIndicator";
import { ProfileSettingsModal } from "../profile/ProfileSettingsModal";
import { PrivacyCenter } from "../settings/PrivacyCenter";
import { NotificationHub } from "../settings/NotificationHub";

/**
 * Normalize a NauticalPresenceState (which may be camel-headed like
 * "In Focus" or snake_case like "in_focus") into the snake_case form used by
 * the ProfileTab status selector.
 */
function normalizeNauticalState(
  value: NauticalPresenceState | undefined,
): "in_focus" | "adrift" | "last_anchored" {
  const normalized = (value || "in_focus").toLowerCase().replace(/\s+/g, "_");
  if (normalized === "adrift") return "adrift";
  if (normalized === "last_anchored") return "last_anchored";
  return "in_focus";
}

interface ProfileTabProps {
  currentUser: Profile;
  onUpdateProfile: (updated: Partial<Profile>) => void;
  onLogout: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  currentUser,
  onUpdateProfile,
  onLogout,
  isDark,
  onToggleTheme,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [fullNameInput, setFullNameInput] = useState(
    currentUser.full_name || "",
  );
  const [usernameInput, setUsernameInput] = useState(
    currentUser.username || "",
  );
  const [avatarUrlInput, setAvatarUrlInput] = useState(
    currentUser.avatar_url || "",
  );
  const [bioInput, setBioInput] = useState(
    currentUser.bio || "✨ Exploring Nautical Streams on HeyLook",
  );
  const [nauticalStatus, setNauticalStatus] = useState<
    "in_focus" | "adrift" | "last_anchored"
  >(normalizeNauticalState(currentUser.nautical_presence));

  const [dbPostsCount, setDbPostsCount] = useState<number>(0);
  const [dbReelsCount, setDbReelsCount] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [typingPhrase, setTypingPhrase] = useState<string>(
    getCustomTypingPhrase(),
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Sync state when currentUser prop changes
  useEffect(() => {
    setFullNameInput(currentUser.full_name || "");
    setUsernameInput(currentUser.username || "");
    setAvatarUrlInput(currentUser.avatar_url || "");
    setBioInput(currentUser.bio || "");
    setNauticalStatus(normalizeNauticalState(currentUser.nautical_presence));
  }, [currentUser]);

  // Fetch real statistics from database
  useEffect(() => {
    const loadStats = async () => {
      const stats = await feedService.getProfileStats(currentUser.id);
      setDbPostsCount(stats.postsCount);
      setDbReelsCount(stats.reelsCount);
    };
    loadStats();
  }, [currentUser.id]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    const updates: Partial<Profile> = {
      full_name: fullNameInput,
      username: usernameInput,
      avatar_url: avatarUrlInput,
      bio: bioInput,
      nautical_presence: nauticalStatus,
      is_online: nauticalStatus === "in_focus",
    };

    // Update parent state
    onUpdateProfile(updates);

    // Persist custom typing indicator phrase to localStorage
    setCustomTypingPhrase(typingPhrase);

    // Save to real Supabase `profiles` table
    await feedService.updateProfile(currentUser.id, updates);

    setIsSaving(false);
    setIsEditing(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between px-2">
        <h2 className="text-xl font-bold tracking-tight">
          Profile & Preferences
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSettingsOpen(true)}
            className={`p-2 rounded-xl border transition-all ${
              isDark
                ? "bg-slate-900 border-slate-800 text-cyan-400"
                : "bg-white border-slate-200 text-slate-700"
            }`}
            aria-label="Open Profile Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleTheme}
            className={`p-2 rounded-xl border transition-all ${
              isDark
                ? "bg-slate-900 border-slate-800 text-amber-400"
                : "bg-white border-slate-200 text-slate-700"
            }`}
          >
            {isDark ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Profile Card Header */}
      <div
        className={`rounded-3xl p-6 border shadow-lg relative overflow-hidden ${
          isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
        }`}
      >
        {/* Cover Background */}
        <div className="h-32 -mx-6 -mt-6 mb-12 bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 relative" />

        {/* Avatar & Online presence badge */}
        <div className="absolute top-20 left-8 flex items-end gap-4">
          <div className="relative">
            <img
              src={currentUser.avatar_url}
              alt={currentUser.full_name}
              className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-slate-900 shadow-xl"
            />
            <span
              className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 shadow-sm ${
                nauticalStatus === "in_focus"
                  ? "bg-emerald-500"
                  : nauticalStatus === "adrift"
                    ? "bg-amber-500"
                    : "bg-slate-500"
              }`}
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end mb-4">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 rounded-xl bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-semibold text-xs flex items-center gap-1.5 hover:bg-indigo-100 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit Profile
            </button>
          ) : (
            <button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          )}
        </div>

        {/* Profile Details or Edit Form */}
        <div className="space-y-4">
          {isEditing ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-400">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullNameInput}
                  onChange={(e) => setFullNameInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400">
                  Username
                </label>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400">
                  Avatar Image URL
                </label>
                <input
                  type="text"
                  value={avatarUrlInput}
                  onChange={(e) => setAvatarUrlInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400">
                  Bio
                </label>
                <textarea
                  value={bioInput}
                  onChange={(e) => setBioInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none"
                  rows={2}
                />
              </div>

              {/* Status Selector */}
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1 block">
                  Nautical Status:
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNauticalStatus("in_focus")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 ${
                      nauticalStatus === "in_focus"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    In Focus
                  </button>
                  <button
                    type="button"
                    onClick={() => setNauticalStatus("adrift")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 ${
                      nauticalStatus === "adrift"
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Adrift
                  </button>
                  <button
                    type="button"
                    onClick={() => setNauticalStatus("last_anchored")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 ${
                      nauticalStatus === "last_anchored"
                        ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/40"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    Anchored
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-slate-100">
                  {currentUser.full_name}
                </h3>
                <CheckCircle2 className="w-5 h-5 text-cyan-400" />
              </div>
              <p className="text-xs text-slate-400 font-medium">
                @{currentUser.username}
              </p>
              <p className="text-sm mt-2 leading-relaxed text-slate-300">
                {currentUser.bio || bioInput}
              </p>
            </div>
          )}

          {/* User Real DB Stats Row */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-around text-center">
            <div>
              <div className="text-lg font-bold text-slate-100">
                {dbPostsCount}
              </div>
              <div className="text-xs text-slate-400 font-medium">
                Published Posts
              </div>
            </div>
            <div>
              <div className="text-lg font-bold text-slate-100">
                {dbReelsCount}
              </div>
              <div className="text-xs text-slate-400 font-medium">
                Uploaded Reels
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                {nauticalStatus.replace("_", " ")}
              </div>
              <div className="text-xs text-slate-400 font-medium">
                Presence Status
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Settings & Logout Button */}
      <div
        className={`rounded-3xl border shadow-sm p-4 space-y-2 ${
          isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
        }`}
      >
        <div className="text-xs uppercase font-bold tracking-wider text-slate-400 px-2 mb-2">
          App Controls
        </div>

        {/* Custom Typing Indicator Setting */}
        <div className="p-3 mb-2 rounded-2xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            Custom Typing Indicator
          </label>
          <p className="text-[10px] text-slate-400 mb-2">
            Replaces the default "Typing..." label shown in the chat list when a
            contact is entering text.
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={typingPhrase}
              onChange={(e) => setTypingPhrase(e.target.value)}
              placeholder="e.g. Drafting..., Writing..., Thinking..."
              className="flex-1 px-3 py-2 text-sm rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-cyan-500"
            />
            <button
              onClick={() => setCustomTypingPhrase(typingPhrase)}
              className="px-3 py-2 rounded-xl bg-cyan-500 text-white text-xs font-bold hover:bg-cyan-400 transition-colors cursor-pointer shrink-0"
            >
              Save
            </button>
          </div>
        </div>

        <button
          onClick={onToggleTheme}
          className="w-full p-3 rounded-2xl flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm font-medium"
        >
          <div className="flex items-center gap-3">
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-500" />
            )}
            <span>App Appearance Theme</span>
          </div>
          <span className="text-xs text-slate-400 capitalize">
            {isDark ? "Dark Mode" : "Light Mode"}
          </span>
        </button>

        <button
          onClick={() => setPrivacyOpen(true)}
          className="w-full p-3 rounded-2xl flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm font-medium"
        >
          <Shield className="w-4 h-4 text-cyan-400" />
          <span>Privacy & Security Center</span>
          <ChevronRight className="w-4 h-4 text-slate-400 ml-auto" />
        </button>

        <button
          onClick={() => setNotificationsOpen(true)}
          className="w-full p-3 rounded-2xl flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm font-medium"
        >
          <Bell className="w-4 h-4 text-pink-400" />
          <span>Notification & Sound Hub</span>
          <ChevronRight className="w-4 h-4 text-slate-400 ml-auto" />
        </button>

        <button
          onClick={onLogout}
          className="w-full p-3 rounded-2xl flex items-center gap-3 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-sm font-semibold cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out of HeyLook</span>
        </button>

        <button
          onClick={onLogout}
          className="w-full p-3 rounded-2xl flex items-center gap-3 text-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 transition-colors text-sm font-semibold cursor-pointer"
        >
          <LogIn className="w-4 h-4" />
          <span>Log in with a different account</span>
        </button>
      </div>

      {/* Profile Settings Modal */}
      <ProfileSettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        currentUser={currentUser}
        onUpdateProfile={onUpdateProfile}
        isDark={isDark}
        onToggleTheme={onToggleTheme}
      />

      {/* Privacy & Security Center */}
      <PrivacyCenter
        isOpen={privacyOpen}
        onClose={() => setPrivacyOpen(false)}
        currentUserId={currentUser.id}
      />

      {/* Notification & Sound Hub */}
      <NotificationHub
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
    </div>
  );
};
