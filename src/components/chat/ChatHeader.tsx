import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  ChevronDown,
  Lock,
  CheckCircle2,
  X,
  Search,
  Pin,
  MoreVertical,
  Phone,
  Video,
  Palette,
  Sparkles,
  Activity,
  Radio,
} from "lucide-react";
import { AVAILABLE_MODELS, ModelOption } from "../../services/aiRouterService";
import { getLivePresenceLabel } from "../../hooks/usePresence";
import { Profile, Beacon } from "../../types";

interface ChatHeaderProps {
  activeConv: any;
  isVipPriority: boolean;
  targetUserOnline: boolean;
  targetLastSeen?: string;
  livePresence?: any;
  selectedModelId: string;
  isModelDropdownOpen: boolean;
  onToggleModelDropdown: () => void;
  onSelectModel: (model: ModelOption) => void;
  onOpenProfile: () => void;
  onToggleSearch: () => void;
  onToggleRoomMenu: () => void;
  onOpenCanvas: () => void;
  onStartCall: (kind: "audio" | "video") => void;
  onBack?: () => void;
  isSearching: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onCloseSearch: () => void;
  pinnedMessage: any;
  onUnpin: () => void;
  anchoredBeacon?: Beacon | null;
  onOpenBeaconViewer?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  activeConv,
  isVipPriority,
  targetUserOnline,
  targetLastSeen,
  livePresence,
  selectedModelId,
  isModelDropdownOpen,
  onToggleModelDropdown,
  onSelectModel,
  onOpenProfile,
  onToggleSearch,
  onToggleRoomMenu,
  onOpenCanvas,
  onStartCall,
  onBack,
  isSearching,
  searchQuery,
  onSearchChange,
  onCloseSearch,
  pinnedMessage,
  onUnpin,
  anchoredBeacon,
  onOpenBeaconViewer,
}) => {
  return (
    <div className="p-3 px-4 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-xl flex flex-col gap-2 z-20 shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden p-2 rounded-xl text-slate-400 hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          {/* User Avatar - Clicking opens User Profile Card */}
          <div
            onClick={onOpenProfile}
            className="relative cursor-pointer group"
            title="View User Profile Card"
          >
            <img
              src={activeConv.user.avatar}
              alt={activeConv.user.name}
              className={`w-10 h-10 rounded-full object-cover border-2 transition-all ${
                isVipPriority
                  ? "border-amber-400 ring-2 ring-amber-400/50 scale-105"
                  : "border-white/20 group-hover:border-cyan-400"
              }`}
            />
            <span
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0b101b] ${
                targetUserOnline
                  ? "bg-emerald-400 animate-pulse"
                  : "bg-slate-500"
              }`}
            />
          </div>

          {/* Name & Dynamic Nautical Presence */}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3
                onClick={onOpenProfile}
                className="font-bold text-sm sm:text-base text-slate-100 hover:text-cyan-300 cursor-pointer transition-colors"
              >
                {activeConv.user.name}
              </h3>
              {isVipPriority && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  VIP
                </span>
              )}

              {/* Model Selector Header Dropdown */}
              <div className="relative z-30">
                <button
                  onClick={onToggleModelDropdown}
                  className="px-2.5 py-0.5 rounded-lg bg-slate-800/90 hover:bg-slate-800 border border-cyan-500/30 text-[11px] text-cyan-300 font-semibold flex items-center gap-1.5 hover:border-cyan-400 transition cursor-pointer shadow-sm"
                  title="Select Active AI Model & Fleet Tier"
                >
                  <Sparkles className="w-3 h-3 text-cyan-400 fill-cyan-400/30 shrink-0" />
                  <span className="truncate max-w-[120px] sm:max-w-[170px]">
                    {AVAILABLE_MODELS.find((m) => m.id === selectedModelId)
                      ?.name || "Hymli AI Core"}
                  </span>
                  <ChevronDown
                    className={`w-3 h-3 text-cyan-400 transition-transform duration-200 ${
                      isModelDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isModelDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1.5 w-72 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl">
                    <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 mb-1 flex items-center justify-between">
                      <span>Active Fleet AI Model</span>
                      <span className="text-cyan-400 font-mono">
                        M-Pesa Tier
                      </span>
                    </div>
                    <div className="space-y-1">
                      {AVAILABLE_MODELS.map((model) => {
                        const isActive = selectedModelId === model.id;
                        return (
                          <button
                            key={model.id}
                            onClick={() => onSelectModel(model)}
                            className={`w-full text-left px-3 py-2 rounded-xl transition flex items-center justify-between gap-2 cursor-pointer ${
                              isActive
                                ? "bg-cyan-500/20 border border-cyan-500/40 text-cyan-200 font-bold"
                                : "hover:bg-slate-800/80 text-slate-200"
                            }`}
                          >
                            <div className="flex flex-col gap-0.5">
                              <div className="text-xs font-semibold flex items-center gap-1.5">
                                <span>{model.name}</span>
                                {isActive && (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {model.isFree
                                  ? "100% Free • Unlimited"
                                  : `${model.priceLabel} • High Reasoning`}
                              </div>
                            </div>
                            <div className="shrink-0">
                              {model.isFree ? (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  FREE
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                  <Lock className="w-2.5 h-2.5" />{" "}
                                  {model.priceLabel}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {livePresence ? (
                <div className="flex items-center gap-1.5 text-xs font-medium mt-0.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      livePresence.presence === "In Focus"
                        ? "bg-emerald-400 animate-pulse"
                        : livePresence.presence === "Adrift"
                          ? "bg-amber-400"
                          : "bg-slate-500"
                    }`}
                  />
                  <span
                    className={
                      livePresence.presence === "In Focus"
                        ? "text-emerald-400 font-semibold"
                        : livePresence.presence === "Adrift"
                          ? "text-amber-400 font-semibold"
                          : "text-slate-400"
                    }
                  >
                    {getLivePresenceLabel(
                      livePresence.presence,
                      livePresence.last_anchored,
                      targetLastSeen,
                    )}
                  </span>
                </div>
              ) : targetUserOnline ? (
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-semibold">🟢 Anchored</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mt-0.5">
                  <span>
                    {getLivePresenceLabel?.(
                      undefined,
                      undefined,
                      targetLastSeen,
                    )}
                  </span>
                </div>
              )}

              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 flex items-center gap-1">
                <Activity className="w-3 h-3 text-cyan-400" />
                <span>Harmonious 98%</span>
              </span>
            </div>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenCanvas}
            className="p-2 rounded-xl text-slate-300 hover:text-cyan-400 hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1"
            title="Interactive Multimodal Canvas (Sketch / Mind Map / Magic Erase)"
          >
            <Palette className="w-4 h-4 text-cyan-400" />
          </button>

          <button
            onClick={() => onStartCall("audio")}
            className="p-2 rounded-xl text-slate-300 hover:text-cyan-400 hover:bg-slate-800 transition-colors cursor-pointer"
            title="Voice Call"
          >
            <Phone className="w-4 h-4" />
          </button>

          <button
            onClick={() => onStartCall("video")}
            className="p-2 rounded-xl text-slate-300 hover:text-indigo-400 hover:bg-slate-800 transition-colors cursor-pointer"
            title="Video Call"
          >
            <Video className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleSearch}
            className="p-2 rounded-xl text-slate-300 hover:text-cyan-400 hover:bg-slate-800 transition-colors cursor-pointer"
            title="Search Messages"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Top-Right Room Settings Toggle */}
          <button
            onClick={onToggleRoomMenu}
            className="p-2 rounded-xl text-slate-300 hover:text-cyan-400 hover:bg-slate-800 transition-colors cursor-pointer"
            title="Room Controls & Security"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search Bar Dropdown */}
      <AnimatePresence>
        {isSearching && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="pt-2 border-t border-slate-800/80 flex items-center gap-2"
          >
            <div className="flex-1 relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Deep search transcript..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:outline-none text-slate-100"
              />
            </div>
            <button
              onClick={onCloseSearch}
              className="p-1.5 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pinned Message Bar */}
      {pinnedMessage && (
        <div className="flex items-center justify-between p-2 px-3 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-xs">
          <div className="flex items-center gap-2 truncate">
            <Pin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="font-bold text-cyan-300 shrink-0">Pinned:</span>
            <span className="text-slate-200 truncate">
              {pinnedMessage.text}
            </span>
          </div>
          <button
            onClick={onUnpin}
            className="text-slate-400 hover:text-white shrink-0 ml-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Anchored Beacon Story-Ring Strip */}
      {anchoredBeacon && (
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={onOpenBeaconViewer}
            className="p-1 group/beacon cursor-pointer outline-none"
            title={`View anchored Beacon from ${anchoredBeacon.author.name}`}
          >
            <span className="w-11 h-11 rounded-full p-[2px] inline-flex items-center justify-center bg-gradient-to-tr from-pink-500 via-rose-500 to-cyan-400 hover:scale-105 transition-transform">
              <span className="w-10 h-10 rounded-full bg-slate-900 border-2 border-slate-900 flex items-center justify-center overflow-hidden">
                {anchoredBeacon.media_type === "text" ? (
                  <Radio className="w-5 h-5 text-pink-400 animate-pulse" />
                ) : anchoredBeacon.content_url ? (
                  <img
                    src={anchoredBeacon.content_url}
                    alt="Beacon thumbnail"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                )}
              </span>
            </span>
          </button>
          <div className="flex flex-col text-left min-w-0">
            <span className="text-[11px] font-bold text-pink-300 flex items-center gap-1 truncate">
              <Radio className="w-3 h-3 text-pink-400 animate-pulse" />
              Anchored Beacon
            </span>
            <span className="text-[10px] text-slate-400 truncate">
              {anchoredBeacon.text_content ||
                `${anchoredBeacon.media_type} update`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
