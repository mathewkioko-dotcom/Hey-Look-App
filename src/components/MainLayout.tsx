import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MessageCircle,
  Newspaper,
  Film,
  User,
  Search,
  Bell,
  Sun,
  Moon,
  Sparkles,
  LogOut,
} from "lucide-react";
import { ActiveTab, Profile } from "../types";
import { ChatsTab } from "./tabs/ChatsTab";
import { FeedTab } from "./tabs/FeedTab";
import { ReelsTab } from "./tabs/ReelsTab";
import { ProfileTab } from "./tabs/ProfileTab";
import { AuthScreen } from "./AuthScreen";
import { useCall } from "../context/CallContext";
import { CallOverlay } from "./CallOverlay";

interface MainLayoutProps {
  currentUser: Profile;
  onUpdateProfile: (updated: Partial<Profile>) => void;
  onLogout: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  currentUser,
  onUpdateProfile,
  onLogout,
  isDark,
  onToggleTheme,
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>("chats");
  const [globalSearch, setGlobalSearch] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);

  // ---- GLOBAL WEBRTC CALL STATE ----
  // Consumed from the shared CallProvider (mounted at the app root in App.tsx)
  // so the incoming-call signaling listener and ringing chime stay ACTIVE
  // across all tabs (Chats, Feed, Reels, Profile) — a single shared instance,
  // not a separate one created here.
  const webrtc = useCall();

  // Authentication & Routing Fallback
  if (!currentUser || !currentUser.id) {
    return (
      <AuthScreen
        isDark={isDark}
        onToggleTheme={onToggleTheme}
        onLoginSuccess={(profile) => onUpdateProfile(profile)}
      />
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-300 ${
        isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
      }`}
    >
      {/* TOP GLOBAL HEADER BAR */}
      <header
        className={`sticky top-0 z-40 border-b backdrop-blur-xl px-4 py-3 transition-colors ${
          isDark
            ? "bg-slate-900/80 border-slate-800"
            : "bg-white/80 border-slate-200 shadow-sm"
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-0.5 shadow-md shadow-indigo-500/20">
              <div
                className={`w-full h-full rounded-[14px] flex items-center justify-center ${
                  isDark ? "bg-slate-900" : "bg-white"
                }`}
              >
                <Sparkles className="w-5 h-5 text-indigo-500" />
              </div>
            </div>
            <div className="hidden sm:block">
              <span className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                HeyLook
              </span>
              <span className="block text-[10px] text-slate-400 font-semibold tracking-wider">
                WHATSAPP • FB • IG
              </span>
            </div>
          </div>

          {/* Global Search Bar */}
          <div className="flex-1 max-w-md relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search chats, posts, reels, or people..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-2xl bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-indigo-500 focus:outline-none transition-all"
            />
          </div>

          {/* User Controls */}
          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2.5 rounded-2xl text-slate-500 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-pink-500 animate-ping" />
              </button>

              {/* Notification Popover */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className={`absolute right-0 mt-2 w-80 rounded-3xl p-4 shadow-2xl border z-50 ${
                      isDark
                        ? "bg-slate-900 border-slate-800"
                        : "bg-white border-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                      <h4 className="font-bold text-xs uppercase tracking-wider">
                        Notifications
                      </h4>
                      <span className="text-[10px] text-indigo-500 font-semibold">
                        Mark read
                      </span>
                    </div>
                    <div className="space-y-3 text-xs">
                      <div className="flex items-start gap-2.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <div>
                          <p className="font-medium">
                            <span className="font-bold">Sara Chen</span> sent
                            you a message in WhatsApp mode
                          </p>
                          <span className="text-[10px] text-slate-400">
                            5m ago
                          </span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="w-2 h-2 rounded-full bg-pink-500 mt-1.5 shrink-0" />
                        <div>
                          <p className="font-medium">
                            <span className="font-bold">Alex Rivera</span> liked
                            your Reel post
                          </p>
                          <span className="text-[10px] text-slate-400">
                            1h ago
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Light / Dark Mode Toggle Button */}
            <button
              onClick={onToggleTheme}
              className={`p-2.5 rounded-2xl transition-all ${
                isDark
                  ? "bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
              }`}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            {/* User Avatar Badge Button */}
            <button
              onClick={() => setActiveTab("profile")}
              className="relative p-0.5 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 hover:scale-105 transition-transform"
            >
              <img
                src={currentUser.avatar_url}
                alt={currentUser.full_name}
                className="w-9 h-9 rounded-full object-cover border-2 border-white dark:border-slate-900"
              />
              {currentUser.is_online && (
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* MAIN BODY CONTENT CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 pb-20 md:pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {activeTab === "chats" && (
              <ChatsTab
                currentUser={currentUser}
                isDark={isDark}
                webrtc={webrtc}
              />
            )}
            {activeTab === "feed" && (
              <FeedTab currentUser={currentUser} isDark={isDark} />
            )}
            {activeTab === "reels" && (
              <ReelsTab currentUser={currentUser} isDark={isDark} />
            )}
            {activeTab === "profile" && (
              <ProfileTab
                currentUser={currentUser}
                onUpdateProfile={onUpdateProfile}
                onLogout={onLogout}
                isDark={isDark}
                onToggleTheme={onToggleTheme}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 4-TAB BOTTOM NAVIGATION BAR (Responsive Mobile & Desktop Dock) */}
      <nav
        className={`fixed bottom-0 inset-x-0 z-50 border-t backdrop-blur-2xl transition-colors ${
          isDark
            ? "bg-slate-900/90 border-slate-800/80 shadow-2xl"
            : "bg-white/90 border-slate-200 shadow-lg"
        }`}
      >
        <div className="max-w-md mx-auto flex items-center justify-around p-2 py-2.5">
          {/* Tab 1: WhatsApp Chats */}
          <button
            onClick={() => setActiveTab("chats")}
            className={`flex flex-col items-center gap-1 p-1.5 px-4 rounded-2xl transition-all cursor-pointer ${
              activeTab === "chats"
                ? "text-emerald-500 font-bold bg-emerald-500/10 scale-105"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            }`}
          >
            <div className="relative">
              <MessageCircle className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <span className="text-[11px] font-semibold">Chats</span>
          </button>

          {/* Tab 2: Facebook Feed */}
          <button
            onClick={() => setActiveTab("feed")}
            className={`flex flex-col items-center gap-1 p-1.5 px-4 rounded-2xl transition-all cursor-pointer ${
              activeTab === "feed"
                ? "text-blue-500 font-bold bg-blue-500/10 scale-105"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            }`}
          >
            <Newspaper className="w-5 h-5" />
            <span className="text-[11px] font-semibold">Feed</span>
          </button>

          {/* Tab 3: Instagram Reels */}
          <button
            onClick={() => setActiveTab("reels")}
            className={`flex flex-col items-center gap-1 p-1.5 px-4 rounded-2xl transition-all cursor-pointer ${
              activeTab === "reels"
                ? "text-pink-500 font-bold bg-pink-500/10 scale-105"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            }`}
          >
            <Film className="w-5 h-5" />
            <span className="text-[11px] font-semibold">Reels</span>
          </button>

          {/* Tab 4: Profile */}
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex flex-col items-center gap-1 p-1.5 px-4 rounded-2xl transition-all cursor-pointer ${
              activeTab === "profile"
                ? "text-indigo-500 font-bold bg-indigo-500/10 scale-105"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-[11px] font-semibold">Profile</span>
          </button>
        </div>
      </nav>

      {/* GLOBAL CALL OVERLAY — renders above all tabs so incoming calls are
          visible & answerable from anywhere in the app */}
      {(webrtc.callState !== "idle" || webrtc.incomingCall) && (
        <CallOverlay
          currentUser={currentUser}
          callState={webrtc.callState}
          callType={webrtc.callType}
          targetUser={webrtc.targetUser}
          incomingCall={webrtc.incomingCall}
          localStream={webrtc.localStream}
          remoteStream={webrtc.remoteStream}
          isMuted={webrtc.isMuted}
          isCameraOff={webrtc.isCameraOff}
          callDuration={webrtc.callDuration}
          onAccept={webrtc.acceptCall}
          onDecline={webrtc.declineCall}
          onEndCall={webrtc.endCall}
          onToggleMute={webrtc.toggleMute}
          onToggleCamera={webrtc.toggleCamera}
        />
      )}
    </div>
  );
};
