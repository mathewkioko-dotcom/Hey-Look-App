import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Shield,
  Lock,
  ShieldAlert,
  QrCode,
  Trash2,
  Download,
  FolderPlus,
  Sparkles,
  Zap,
  Type,
  Palette,
  Bot,
  Briefcase,
} from "lucide-react";

export type RoomSettingsTab = "security" | "efficiency" | "visual" | "automations";
export type RoomModalType =
  | "barcode"
  | "assets"
  | "transcript"
  | "crm"
  | "devices"
  | null;
export type WallpaperTheme = "default" | "nautical" | "midnight" | "cyberpunk";

interface RoomSettingsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: RoomSettingsTab;
  onTabChange: (tab: RoomSettingsTab) => void;
  // Security
  isLocked: boolean;
  onToggleLock: () => void;
  isWatermarkActive: boolean;
  onToggleWatermark: () => void;
  onOpenModal: (modal: NonNullable<RoomModalType>) => void;
  onClearHistory: () => void;
  // Efficiency
  onGenerateSummary: () => void;
  // Visual
  focusMode: boolean;
  onToggleFocusMode: () => void;
  presentationFont: boolean;
  onTogglePresentationFont: () => void;
  moodWallpaper: WallpaperTheme;
  onChangeWallpaper: () => void;
  // Automations
  autoReplyBot: boolean;
  onToggleAutoReply: () => void;
}

export const RoomSettingsSidebar: React.FC<RoomSettingsSidebarProps> = ({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  isLocked,
  onToggleLock,
  isWatermarkActive,
  onToggleWatermark,
  onOpenModal,
  onClearHistory,
  onGenerateSummary,
  focusMode,
  onToggleFocusMode,
  presentationFont,
  onTogglePresentationFont,
  moodWallpaper,
  onChangeWallpaper,
  autoReplyBot,
  onToggleAutoReply,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: "100%" }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: "100%" }}
          className="absolute top-0 right-0 bottom-0 w-80 bg-slate-900 border-l border-slate-800 shadow-2xl z-40 p-4 flex flex-col gap-4 text-xs overflow-y-auto"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-sm text-white">
                Room Controls & Security
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
            <button
              onClick={() => onTabChange("security")}
              className={`px-3 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${
                activeTab === "security"
                  ? "bg-cyan-600 text-white shadow-lg shadow-cyan-500/30"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              🔒 Security
            </button>
            <button
              onClick={() => onTabChange("efficiency")}
              className={`px-3 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${
                activeTab === "efficiency"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              ⚡ Efficiency
            </button>
            <button
              onClick={() => onTabChange("visual")}
              className={`px-3 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${
                activeTab === "visual"
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/30"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              🎨 Visual
            </button>
            <button
              onClick={() => onTabChange("automations")}
              className={`px-3 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${
                activeTab === "automations"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              🤖 Auto
            </button>
          </div>

          {/* SECURITY CONTROLS */}
          {activeTab === "security" && (
            <div className="space-y-2">
              <button
                onClick={onToggleLock}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-slate-200 hover:border-cyan-500/50"
              >
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-rose-400" />
                  <span>Room Lockdown State</span>
                </div>
                <span
                  className={`font-bold ${isLocked ? "text-rose-400" : "text-slate-500"}`}
                >
                  {isLocked ? "ON" : "OFF"}
                </span>
              </button>

              <button
                onClick={onToggleWatermark}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-slate-200 hover:border-cyan-500/50"
              >
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-cyan-400" />
                  <span>Watermark Leak Shield</span>
                </div>
                <span
                  className={`font-bold ${isWatermarkActive ? "text-cyan-400" : "text-slate-500"}`}
                >
                  {isWatermarkActive ? "ON" : "OFF"}
                </span>
              </button>

              <button
                onClick={() => onOpenModal("barcode")}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-slate-200 hover:border-cyan-500/50"
              >
                <QrCode className="w-4 h-4 text-emerald-400" />
                <span>Cryptographic Security Barcode</span>
              </button>

              <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-500/30 space-y-2">
                <p className="text-[11px] font-bold text-rose-300 uppercase tracking-wide">⚠️ Danger Zone</p>
                <button
                  onClick={() => {
                    if (window.confirm("Clear all messages in this chat from your device? The other person's messages will not be affected.")) {
                      onClearHistory();
                    }
                  }}
                  className="w-full p-3 rounded-xl bg-rose-600 hover:bg-rose-500 border border-rose-400 flex items-center justify-center gap-2 text-white font-bold text-sm transition-all shadow-lg shadow-rose-500/20 hover:shadow-rose-500/40"
                >
                  <Trash2 className="w-5 h-5" />
                  <span>Clear Chat (Local Only)</span>
                </button>
                <p className="text-[10px] text-rose-300/70">Deletes messages from your device only. Other user's chat remains unchanged.</p>
              </div>
            </div>
          )}

          {/* EFFICIENCY CONTROLS */}
          {activeTab === "efficiency" && (
            <div className="space-y-2">
              <button
                onClick={() => onOpenModal("transcript")}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-slate-200 hover:border-indigo-500/50"
              >
                <Download className="w-4 h-4 text-indigo-400" />
                <span>Export PDF Transcript</span>
              </button>

              <button
                onClick={() => onOpenModal("assets")}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-slate-200 hover:border-indigo-500/50"
              >
                <FolderPlus className="w-4 h-4 text-amber-400" />
                <span>Shared Asset Vault</span>
              </button>

              <button
                onClick={onGenerateSummary}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-slate-200 hover:border-indigo-500/50"
              >
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Ollama AI Milestone Summary</span>
              </button>
            </div>
          )}

          {/* VISUAL CONTROLS */}
          {activeTab === "visual" && (
            <div className="space-y-2">
              <button
                onClick={onToggleFocusMode}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-slate-200"
              >
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Focus Canvas Mode</span>
                </div>
                <span
                  className={`font-bold ${focusMode ? "text-amber-400" : "text-slate-500"}`}
                >
                  {focusMode ? "ON" : "OFF"}
                </span>
              </button>

              <button
                onClick={onTogglePresentationFont}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-slate-200"
              >
                <div className="flex items-center gap-2">
                  <Type className="w-4 h-4 text-cyan-400" />
                  <span>Presentation Serif Typography</span>
                </div>
                <span
                  className={`font-bold ${presentationFont ? "text-cyan-400" : "text-slate-500"}`}
                >
                  {presentationFont ? "ON" : "OFF"}
                </span>
              </button>

              <button
                onClick={onChangeWallpaper}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-slate-200"
              >
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-purple-400" />
                  <span>Mood Wallpaper Theme</span>
                </div>
                <span className="font-bold text-purple-300 uppercase">
                  {moodWallpaper}
                </span>
              </button>
            </div>
          )}

          {/* AUTOMATIONS */}
          {activeTab === "automations" && (
            <div className="space-y-2">
              <button
                onClick={onToggleAutoReply}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-slate-200"
              >
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-indigo-400" />
                  <span>Auto-Reply Bot</span>
                </div>
                <span
                  className={`font-bold ${autoReplyBot ? "text-indigo-400" : "text-slate-500"}`}
                >
                  {autoReplyBot ? "ON" : "OFF"}
                </span>
              </button>

              <button
                onClick={() => onOpenModal("crm")}
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
  );
};
