import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Clock,
  Send,
  Lock,
  MessageSquare,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Eye,
  Radio,
  Flame,
  Volume2,
  Users,
  CornerDownRight,
  Trash2,
  Edit3,
  Check,
  Info,
  Disc,
  Activity,
  Zap,
Waves,
  RadioTower,
  SlidersHorizontal,
} from "lucide-react";
import { Beacon, BeaconComment, Profile } from "../types";
import { loadGoogleFont } from "./BeaconModal";
import { supabase } from "../lib/supabase";
import { BeaconControls } from "./beacons/BeaconControls";

interface BeaconViewerProps {
  beacons: Beacon[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  currentUser: Profile;
  onAddComment: (beaconId: string, comment: BeaconComment) => void;
  onViewBeacon?: (beaconId: string) => void;
  onDeleteBeacon?: (beaconId: string) => void;
  onEditBeacon?: (updatedBeacon: Beacon) => void;
}

/** 10 Animated Audio Playback Visualizer Components */
const AudioVisualizerRenderer: React.FC<{
  type?: string;
  isPlaying: boolean;
}> = ({ type = "frequency", isPlaying }) => {
  switch (type) {
    case "sonar":
      return (
        <div className="relative w-36 h-36 mx-auto flex items-center justify-center my-2">
          <div
            className="absolute inset-0 rounded-full border border-cyan-500/30 animate-ping"
            style={{ animationDuration: isPlaying ? "2s" : "4s" }}
          />
          <div
            className="absolute inset-2 rounded-full border border-indigo-500/40 animate-ping"
            style={{ animationDuration: isPlaying ? "1.5s" : "0s" }}
          />
          <div className="w-16 h-16 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <RadioTower
              className={`w-8 h-8 text-cyan-300 ${isPlaying ? "animate-bounce" : ""}`}
            />
          </div>
        </div>
      );

    case "neon":
      return (
        <div className="flex items-center justify-center gap-1.5 h-16 my-2">
          {[60, 90, 40, 100, 70, 85, 45, 95, 30, 75, 55, 100].map((h, i) => (
            <div
              key={i}
              className={`w-1.5 rounded-full transition-all duration-300 ${
                isPlaying
                  ? "bg-gradient-to-t from-pink-500 to-cyan-400 shadow-md shadow-cyan-400/50 animate-pulse"
                  : "bg-slate-700 h-3"
              }`}
              style={{
                height: isPlaying ? `${h}%` : "12px",
                animationDelay: `${i * 0.08}s`,
              }}
            />
          ))}
        </div>
      );

    case "ripples":
      return (
        <div className="relative w-32 h-32 mx-auto flex items-center justify-center my-2">
          {[1, 2, 3].map((r) => (
            <div
              key={r}
              className={`absolute rounded-full border-2 border-cyan-400/40 ${
                isPlaying ? "animate-ping" : "opacity-20"
              }`}
              style={{
                width: `${r * 30}%`,
                height: `${r * 30}%`,
                animationDuration: `${r * 0.8}s`,
              }}
            />
          ))}
          <Waves className="w-8 h-8 text-cyan-300 z-10" />
        </div>
      );

    case "orbital":
      return (
        <div className="relative w-32 h-32 mx-auto flex items-center justify-center my-2">
          <div
            className={`w-full h-full rounded-full border border-dashed border-cyan-400/50 ${isPlaying ? "animate-spin" : ""}`}
            style={{ animationDuration: "6s" }}
          />
          <div className="absolute w-4 h-4 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/80 top-0" />
          <div className="absolute w-3 h-3 rounded-full bg-pink-500 shadow-lg shadow-pink-500/80 bottom-0" />
          <Zap className="w-6 h-6 text-cyan-300 absolute" />
        </div>
      );

    case "cassette":
      return (
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 my-2 max-w-xs mx-auto">
          <div className="flex items-center justify-around">
            <div
              className={`w-10 h-10 rounded-full border-4 border-slate-700 border-t-cyan-400 ${isPlaying ? "animate-spin" : ""}`}
            >
              <div className="w-2 h-2 rounded-full bg-cyan-400 m-auto mt-2" />
            </div>
            <div className="h-4 w-16 bg-slate-800 rounded flex items-center justify-center text-[9px] font-mono text-cyan-300">
              HARBOR-TAPE
            </div>
            <div
              className={`w-10 h-10 rounded-full border-4 border-slate-700 border-t-pink-400 ${isPlaying ? "animate-spin" : ""}`}
            >
              <div className="w-2 h-2 rounded-full bg-pink-400 m-auto mt-2" />
            </div>
          </div>
        </div>
      );

    case "vinyl":
      return (
        <div className="relative w-32 h-32 mx-auto flex items-center justify-center my-2">
          <div
            className={`w-full h-full rounded-full bg-slate-950 border-4 border-slate-800 shadow-2xl flex items-center justify-center ${isPlaying ? "animate-spin" : ""}`}
            style={{ animationDuration: "3s" }}
          >
            <div className="w-12 h-12 rounded-full bg-cyan-500/30 border border-cyan-400/60 flex items-center justify-center">
              <Disc className="w-6 h-6 text-cyan-300" />
            </div>
          </div>
        </div>
      );

    case "matrix":
      return (
        <div className="flex items-center justify-around h-16 bg-slate-950/80 p-2 rounded-xl border border-emerald-500/30 font-mono text-[10px] text-emerald-400 overflow-hidden my-2">
          {[1, 2, 3, 4, 5, 6].map((col) => (
            <div
              key={col}
              className={`flex flex-col gap-1 ${isPlaying ? "animate-pulse" : ""}`}
            >
              <span>01</span>
              <span>10</span>
              <span>11</span>
            </div>
          ))}
        </div>
      );

    case "laser":
      return (
        <div className="relative w-full h-16 bg-slate-950/80 rounded-xl overflow-hidden my-2 border border-cyan-500/30 flex items-center justify-center">
          <div
            className={`absolute h-0.5 bg-gradient-to-r from-cyan-400 via-pink-500 to-indigo-500 w-full ${isPlaying ? "animate-pulse" : ""}`}
          />
          <Activity className="w-8 h-8 text-cyan-300 z-10 animate-bounce" />
        </div>
      );

    case "telemetry":
      return (
        <div className="p-3 bg-slate-950/90 rounded-xl border border-cyan-400/40 my-2 font-mono text-[10px] text-cyan-300 flex items-center justify-between">
          <span>RF: 433.92MHz</span>
          <div className="flex items-center gap-1">
            <div
              className={`w-2 h-2 rounded-full bg-cyan-400 ${isPlaying ? "animate-ping" : ""}`}
            />
            <span>SIGNAL OK</span>
          </div>
        </div>
      );

    case "frequency":
    default:
      return (
        <div className="flex items-center justify-center gap-1 h-16 my-2">
          {[40, 70, 30, 90, 60, 100, 45, 80, 50, 85, 35, 65, 75, 95].map(
            (h, i) => (
              <div
                key={i}
                className={`w-1 bg-cyan-400 rounded-full transition-all duration-200 ${isPlaying ? "animate-pulse" : "h-2"}`}
                style={{
                  height: isPlaying ? `${h}%` : "8px",
                  animationDelay: `${i * 0.05}s`,
                }}
              />
            ),
          )}
        </div>
      );
  }
};

export const BeaconViewer: React.FC<BeaconViewerProps> = ({
  beacons,
  initialIndex = 0,
  isOpen,
  onClose,
  currentUser,
  onAddComment,
  onViewBeacon,
  onDeleteBeacon,
  onEditBeacon,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [commentText, setCommentText] = useState("");
  const [isPrivateDmReply, setIsPrivateDmReply] = useState(false);

  // Creator view mode sub-tabs
  const [creatorTab, setCreatorTab] = useState<"viewers" | "comments">(
    "comments",
  );
  const [creatorReplyText, setCreatorReplyText] = useState("");

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editedCaption, setEditedCaption] = useState("");
  const [showEditedAuditModal, setShowEditedAuditModal] = useState(false);

  // Beacon Controls state
  const [controlsOpen, setControlsOpen] = useState(false);

  // Audio Playback State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const currentBeacon = beacons[currentIndex] || null;
  const isCreator =
    currentUser && currentBeacon
      ? currentUser.id === currentBeacon.user_id
      : false;

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    if (!currentBeacon || !isOpen) return;

    if (currentBeacon.font_family) {
      loadGoogleFont(currentBeacon.font_family);
    }
    if (currentBeacon.caption_font_family) {
      loadGoogleFont(currentBeacon.caption_font_family);
    }
    setEditedCaption(currentBeacon.text_content || "");
    setIsEditing(false);
    setShowEditedAuditModal(false);
    setIsPlayingAudio(false);

    let viewTimer: NodeJS.Timeout | null = null;

    // Only record views if viewer is not creator and viewer stays open for >= 1.5s
    if (currentUser && currentUser.id !== currentBeacon.user_id) {
      viewTimer = setTimeout(async () => {
        if (onViewBeacon) {
          onViewBeacon(currentBeacon.id);
        }
        try {
          await supabase.from("beacon_views").upsert({
            beacon_id: currentBeacon.id,
            user_id: currentUser.id,
            viewed_at: new Date().toISOString(),
          });
        } catch (err) {
          console.warn("[BeaconViewer] Exception recording view:", err);
        }
      }, 1500);
    }

    return () => {
      if (viewTimer) clearTimeout(viewTimer);
    };
  }, [currentIndex, currentBeacon?.id, isOpen, currentUser?.id]);

  // HUD Countdown Timer preserving original expiration clock
  useEffect(() => {
    if (!currentBeacon) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expireTime = new Date(currentBeacon.expires_at).getTime();
      const diff = Math.max(0, expireTime - now);

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [currentBeacon?.expires_at, currentIndex]);

  if (!isOpen || !currentBeacon) return null;

  const handleNext = () => {
    if (currentIndex < beacons.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        "Are you sure you want to submerge and delete this Beacon?",
      )
    )
      return;

    try {
      await supabase.from("beacons").delete().eq("id", currentBeacon.id);
    } catch (err) {
      console.warn("Beacon delete note:", err);
    }

    if (onDeleteBeacon) {
      onDeleteBeacon(currentBeacon.id);
    }

    if (beacons.length <= 1) {
      onClose();
    } else if (currentIndex >= beacons.length - 1) {
      setCurrentIndex(beacons.length - 2);
    }
  };

  const handleSaveEdit = async () => {
    if (!editedCaption.trim()) return;

    const originalCap =
      currentBeacon.original_caption || currentBeacon.text_content || "";
    const updatedBeacon: Beacon = {
      ...currentBeacon,
      text_content: editedCaption.trim(),
      is_edited: true,
      original_caption: originalCap,
      edited_at: new Date().toISOString(),
      // Preserves original expires_at strictly
    };

    try {
      await supabase
        .from("beacons")
        .update({
          text_content: editedCaption.trim(),
          is_edited: true,
          original_caption: originalCap,
          edited_at: new Date().toISOString(),
        })
        .eq("id", currentBeacon.id);
    } catch (err) {
      console.warn("Beacon update note:", err);
    }

    if (onEditBeacon) {
      onEditBeacon(updatedBeacon);
    }

    setIsEditing(false);
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const newComment: BeaconComment = {
      id: `comment_${Date.now()}`,
      user_id: currentUser.id,
      user_name: currentUser.full_name || currentUser.username,
      user_avatar: currentUser.avatar_url,
      text: commentText.trim(),
      created_at: new Date().toISOString(),
      is_private_dm: isPrivateDmReply || !currentBeacon.allow_public_comments,
    };

    onAddComment(currentBeacon.id, newComment);
    setCommentText("");
  };

  const handleCreatorReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!creatorReplyText.trim()) return;

    const creatorComment: BeaconComment = {
      id: `comment_creator_${Date.now()}`,
      user_id: currentUser.id,
      user_name: `${currentUser.full_name || currentUser.username} (Creator)`,
      user_avatar: currentUser.avatar_url,
      text: creatorReplyText.trim(),
      created_at: new Date().toISOString(),
      is_private_dm: false,
    };

    onAddComment(currentBeacon.id, creatorComment);
    setCreatorReplyText("");
  };

  const handleQuickReaction = (emoji: string) => {
    const reactionComment: BeaconComment = {
      id: `react_${Date.now()}`,
      user_id: currentUser.id,
      user_name: currentUser.full_name || currentUser.username,
      user_avatar: currentUser.avatar_url,
      text: emoji,
      created_at: new Date().toISOString(),
    };
    onAddComment(currentBeacon.id, reactionComment);
  };

  const pad = (num: number) => String(num).padStart(2, "0");
  const externalViewers = (currentBeacon.viewed_by || []).filter(
    (id) => id !== currentBeacon.user_id,
  );
  const mediaUrl =
    currentBeacon.content_url || (currentBeacon as any).media_url || "";

  return (
    /* REQUIREMENT 1: FULLSCREEN IMMERSIVE CONTAINER WITH CLEAN DARK OUTER BACKDROP */
    <div className="fixed inset-0 z-50 w-screen h-screen bg-black/95 flex flex-col justify-between p-4 sm:p-6 overflow-hidden text-slate-100">
      {/* Audit Log Modal for Edited Beacons */}
      {showEditedAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-sm w-full space-y-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-cyan-400" />
                Beacon Edit Audit History
              </span>
              <button
                onClick={() => setShowEditedAuditModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">
                  ORIGINAL CAPTION:
                </span>
                <p className="p-2.5 rounded-xl bg-slate-950 text-slate-200 border border-slate-800 italic">
                  "
                  {currentBeacon.original_caption ||
                    "No previous text recorded"}
                  "
                </p>
              </div>
              {currentBeacon.edited_at && (
                <div>
                  <span className="text-slate-400 block text-[10px]">
                    EDITED TIMESTAMP:
                  </span>
                  <span className="text-cyan-400 font-mono text-[11px]">
                    {new Date(currentBeacon.edited_at).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Top Header Controls & HUD Bar */}
      <div className="relative z-20 space-y-3 bg-gradient-to-b from-black via-black/80 to-transparent p-2 sm:p-4 rounded-b-2xl">
        {/* Story Progress Bars */}
        <div className="flex items-center gap-1.5">
          {beacons.map((b, idx) => (
            <div
              key={b.id}
              className="h-1 flex-1 bg-slate-800 rounded-full overflow-hidden"
            >
              <div
                className={`h-full transition-all duration-300 ${
                  idx < currentIndex
                    ? "w-full bg-cyan-400"
                    : idx === currentIndex
                      ? "w-full bg-cyan-400 animate-pulse"
                      : "w-0"
                }`}
              />
            </div>
          ))}
        </div>

        {/* Author Meta & Countdown HUD */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={
                currentBeacon.author.avatar ||
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200"
              }
              alt={currentBeacon.author.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-cyan-400 shadow-md"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">
                  {currentBeacon.author.name}
                </span>
                <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />

                {/* Edited Badge */}
                {currentBeacon.is_edited && (
                  <button
                    onClick={() => setShowEditedAuditModal(true)}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-2.5 h-2.5" />
                    <span>(Edited)</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                <span>TTL: {currentBeacon.ttl_setting}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-cyan-300">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  HUD: {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:
                  {pad(timeLeft.seconds)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Creator Action Buttons (Trash & Edit) */}
{isCreator && (
              <>
                <button
                  onClick={() => setControlsOpen(true)}
                  className="p-2 rounded-full bg-slate-800 text-amber-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
                  title="Beacon Controls"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="p-2 rounded-full bg-slate-800 text-cyan-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
                  title="Edit Caption"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-2 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                  title="Submerge & Delete Beacon"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Fullscreen Stage Container */}
      <div className="relative z-10 flex-1 flex flex-col justify-center items-center px-2 sm:px-6 py-4 text-center overflow-y-auto">
        {/* Navigation Touch Areas */}
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-0 transition-all z-20 cursor-pointer shadow-xl border border-slate-800"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={handleNext}
          className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 transition-all z-20 cursor-pointer shadow-xl border border-slate-800"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentBeacon.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md sm:max-w-lg space-y-4"
          >
            {/* REQUIREMENT 1: BACKGROUND AURA KEEPS STRICTLY INSIDE INNER CONTENT CARD BOX */}
            <div
              className={`p-6 rounded-2xl shadow-2xl border border-white/10 transition-all duration-500 relative overflow-hidden text-center ${
                !currentBeacon.custom_hex
                  ? `bg-gradient-to-br ${currentBeacon.bg_gradient || "from-cyan-900 via-indigo-900 to-slate-950"}`
                  : ""
              }`}
              style={
                currentBeacon.custom_hex
                  ? { background: currentBeacon.custom_hex }
                  : undefined
              }
            >
              <div className="absolute inset-0 bg-slate-950/35 backdrop-blur-[2px] pointer-events-none" />

              <div className="relative z-10 space-y-4">
                {/* Media Renderer */}
                {currentBeacon.media_type === "video" && mediaUrl && (
                  <video
                    src={mediaUrl}
                    controls
                    autoPlay
                    loop
                    playsInline
                    className="w-full max-h-[55vh] object-contain rounded-xl shadow-2xl border border-white/10"
                  />
                )}

                {(currentBeacon.media_type === "image" ||
                  currentBeacon.media_type === ("photo" as any)) &&
                  mediaUrl && (
                    <img
                      src={mediaUrl}
                      alt="Beacon"
                      className="w-full max-h-[55vh] object-contain rounded-xl shadow-2xl border border-white/10"
                    />
                  )}

                {/* REQUIREMENT 4: 10 AUDIO PLAYBACK VISUALIZERS */}
                {currentBeacon.media_type === "audio" && (
                  <div className="p-4 rounded-xl bg-slate-950/90 border border-cyan-400/40 shadow-xl space-y-3">
                    <div className="flex items-center justify-center gap-2 text-cyan-300">
                      <Volume2 className="w-5 h-5 animate-pulse" />
                      <span className="font-bold text-xs uppercase tracking-wider">
                        {currentBeacon.audio_visualizer || "Frequency"}{" "}
                        Visualizer
                      </span>
                    </div>

                    <AudioVisualizerRenderer
                      type={currentBeacon.audio_visualizer}
                      isPlaying={isPlayingAudio}
                    />

                    {mediaUrl && (
                      <audio
                        ref={audioRef}
                        src={mediaUrl}
                        controls
                        onPlay={() => setIsPlayingAudio(true)}
                        onPause={() => setIsPlayingAudio(false)}
                        onEnded={() => setIsPlayingAudio(false)}
                        className="w-full mt-2"
                      />
                    )}
                  </div>
                )}

                {/* Inline Editing Mode or Rendered Caption */}
                {isEditing ? (
                  <div className="p-3 rounded-xl bg-slate-950/90 border border-cyan-400 space-y-2">
                    <textarea
                      value={editedCaption}
                      onChange={(e) => setEditedCaption(e.target.value)}
                      className="w-full p-2.5 rounded-lg bg-slate-900 text-white text-xs border border-slate-700 focus:outline-none focus:border-cyan-400"
                      rows={3}
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-300"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        className="px-3 py-1.5 rounded-lg bg-cyan-500 text-slate-950 text-xs font-bold flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Save Edit
                      </button>
                    </div>
                  </div>
                ) : (
                  currentBeacon.text_content && (
                    <div className="p-4 rounded-xl bg-slate-950/75 border border-white/10 backdrop-blur-md shadow-lg">
                      <p
                        style={{
                          fontFamily:
                            currentBeacon.media_type === "text"
                              ? currentBeacon.font_family || undefined
                              : currentBeacon.caption_font_family ||
                                currentBeacon.font_family ||
                                undefined,
                        }}
                        className="font-medium text-white leading-relaxed text-base"
                      >
                        "{currentBeacon.text_content}"
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/80 border border-slate-800 text-xs text-slate-400">
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span>{externalViewers.length} Harbor Viewers</span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Creator vs External Viewer Control Panel */}
      {isCreator ? (
        <div className="relative z-20 bg-slate-950 border-t border-slate-800 max-w-lg mx-auto w-full rounded-t-2xl overflow-hidden">
          <div className="flex items-center border-b border-slate-800 bg-slate-900/90">
            <button
              onClick={() => setCreatorTab("viewers")}
              className={`flex-1 py-3 px-4 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
                creatorTab === "viewers"
                  ? "border-cyan-400 text-cyan-300 bg-cyan-500/10"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>👁️ Viewers List ({externalViewers.length})</span>
            </button>

            <button
              onClick={() => setCreatorTab("comments")}
              className={`flex-1 py-3 px-4 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
                creatorTab === "comments"
                  ? "border-cyan-400 text-cyan-300 bg-cyan-500/10"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>
                💬 Comments & Replies ({currentBeacon.comments?.length || 0})
              </span>
            </button>
          </div>

          <div className="p-4 max-h-44 overflow-y-auto">
            {creatorTab === "viewers" ? (
              <div className="space-y-2 text-left">
                <h4 className="text-[11px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  Beacon Viewers List (Excluding Creator)
                </h4>
                {externalViewers.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {externalViewers.map((viewerHandle, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-cyan-300 font-mono flex items-center gap-2"
                      >
                        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                        <span>@{viewerHandle}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic py-3 text-center">
                    No external harbor members have viewed this Beacon yet.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3 text-left">
                {currentBeacon.comments && currentBeacon.comments.length > 0 ? (
                  <div className="space-y-2">
                    {currentBeacon.comments.map((c) => (
                      <div
                        key={c.id}
                        className="text-xs p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-cyan-300">
                            {c.user_name}
                          </span>
                          {c.is_private_dm && (
                            <span className="text-[10px] text-amber-400 font-mono flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" /> Private DM
                            </span>
                          )}
                        </div>
                        <p className="text-slate-200">{c.text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic text-center py-2">
                    No comments on this Beacon yet.
                  </p>
                )}

                <form
                  onSubmit={handleCreatorReply}
                  className="flex items-center gap-2 pt-2"
                >
                  <input
                    type="text"
                    value={creatorReplyText}
                    onChange={(e) => setCreatorReplyText(e.target.value)}
                    placeholder="Reply as Creator..."
                    className="flex-1 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="submit"
                    disabled={!creatorReplyText.trim()}
                    className="px-3 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 disabled:opacity-40 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <CornerDownRight className="w-3.5 h-3.5" />
                    <span>Reply</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="relative z-20 p-4 bg-slate-950 border-t border-slate-800 space-y-3 max-w-lg mx-auto w-full rounded-t-2xl">
          <div className="flex items-center justify-center gap-3">
            {["❤️", "👍", "🔥", "🌊", "⚡"].map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleQuickReaction(emoji)}
                className="w-9 h-9 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-base flex items-center justify-center transition-all hover:scale-125 cursor-pointer shadow-md"
              >
                {emoji}
              </button>
            ))}
          </div>

          <form onSubmit={handleSendComment} className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span className="flex items-center gap-1 font-semibold">
                {currentBeacon.allow_public_comments ? (
                  <MessageSquare className="w-3 h-3 text-cyan-400" />
                ) : (
                  <Lock className="w-3 h-3 text-amber-400" />
                )}
                {currentBeacon.allow_public_comments
                  ? "Public Thread Comment"
                  : "Private DM Only"}
              </span>

              {currentBeacon.allow_public_comments && (
                <button
                  type="button"
                  onClick={() => setIsPrivateDmReply(!isPrivateDmReply)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${
                    isPrivateDmReply
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      : "bg-slate-800 text-slate-400 border-slate-700"
                  }`}
                >
                  {isPrivateDmReply
                    ? "🔒 Sending as Private DM"
                    : "🌐 Sending as Public"}
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={
                  !currentBeacon.allow_public_comments || isPrivateDmReply
                    ? "Reply privately via direct message..."
                    : "Add public thread comment to Beacon..."
                }
                className="flex-1 px-4 py-2.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
              />
<button
                type="submit"
                disabled={!commentText.trim()}
                className="p-2.5 rounded-full bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 disabled:opacity-40 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Live Beacon & Story Controls Modal */}
      <BeaconControls
        isOpen={controlsOpen}
        onClose={() => setControlsOpen(false)}
        beacon={currentBeacon}
      />
    </div>
  );
};
