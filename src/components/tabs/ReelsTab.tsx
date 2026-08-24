import React, { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Heart,
  MessageCircle,
  Share2,
  Music,
  Volume2,
  VolumeX,
  Plus,
  X,
  Video,
  Sparkles,
  RefreshCw,
  Film,
  MoreVertical,
  Bookmark,
  Pause,
  Play,
  Settings2,
} from "lucide-react";
import { ReelItem, Profile } from "../../types";
import { feedService } from "../../services/feedService";
import { fetchAllProfiles } from "../../services/chatService.profiles";
import { ReelsMenuModal } from "../reels/ReelsMenuModal";
import { sendMessage } from "../../services/chatService.messages";
import { supabase } from "../../lib/supabase";

interface ReelsTabProps {
  currentUser: Profile;
  isDark: boolean;
  /** When set, jump to this reel once it's loaded (e.g. opened from Home). */
  initialReelId?: string | null;
  onInitialReelConsumed?: () => void;
}

export const ReelsTab: React.FC<ReelsTabProps> = ({ currentUser, isDark, initialReelId, onInitialReelConsumed }) => {
  const [reels, setReels] = useState<ReelItem[]>([]);
  const [activeReelIndex, setActiveReelIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const [isFastForwarding, setIsFastForwarding] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const longPressTimer = useRef<number | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [savedReels, setSavedReels] = useState<Record<string, boolean>>({});
  const [reelComments, setReelComments] = useState<Record<string, string[]>>({});
  const [commentInput, setCommentInput] = useState("");
  const [commentMedia, setCommentMedia] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const [shareProfiles, setShareProfiles] = useState<Profile[]>([]);
  const [profileToView, setProfileToView] = useState<Profile | null>(null);
  const [mentionMatches, setMentionMatches] = useState<Profile[]>([]);
  const [doubleTapHeart, setDoubleTapHeart] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Upload Reel Modal
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [reelCaption, setReelCaption] = useState("");
  const [reelVideoUrl, setReelVideoUrl] = useState("");
  const [reelVideoFile, setReelVideoFile] = useState<File | null>(null);
  const [reelFileName, setReelFileName] = useState("");
  const [reelSongTitle, setReelSongTitle] = useState("HeyLook Original Audio");
  const [isPublishing, setIsPublishing] = useState(false);

  // Reel context menu modal
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const loadReels = async () => {
    setIsLoading(true);
    const fetchedReels = await feedService.fetchReels(currentUser.id);
    setReels(fetchedReels);
    setIsLoading(false);
  };

  useEffect(() => {
    loadReels();
  }, [currentUser.id]);

  // Jump to the reel requested from Home, once the reels list has loaded.
  useEffect(() => {
    if (!initialReelId || !reels.length) return;
    const index = reels.findIndex((reel) => reel.id === initialReelId);
    if (index >= 0) setActiveReelIndex(index);
    onInitialReelConsumed?.();
  }, [initialReelId, reels]);

  const currentReel = reels[activeReelIndex];

  const renderCommentsOverlay = () => {
    if (!showComments || !currentReel) return null;
    return createPortal(
      <motion.div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowComments(false)}>
        <motion.div className="w-full max-w-md max-h-[75dvh] overflow-y-auto rounded-t-3xl bg-slate-900 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] text-white" onClick={(event) => event.stopPropagation()} initial={{ y: 300 }} animate={{ y: 0 }}>
          <div className="flex items-center justify-between mb-4"><h3 className="font-bold">Crew Replies</h3><button onClick={() => setShowComments(false)} aria-label="Close comments"><X className="w-5 h-5" /></button></div>
          <div className="space-y-2 mb-4">{(reelComments[currentReel.id] || []).map((comment, index) => <p key={`${comment}-${index}`} className="p-2 rounded-xl bg-slate-800 text-xs">{comment}</p>)}{!(reelComments[currentReel.id] || []).length && <p className="text-xs text-slate-400">No replies yet. Start the conversation.</p>}</div>
          <div className="flex gap-2"><input value={commentInput} onChange={(event) => { const value = event.target.value; setCommentInput(value); const match = value.match(/@([\w]*)$/); if (match) void fetchAllProfiles(currentUser.id).then((profiles) => setMentionMatches(profiles.filter((profile) => profile.full_name.toLowerCase().includes(match[1].toLowerCase()) || profile.username.toLowerCase().includes(match[1].toLowerCase())).slice(0, 5))); else setMentionMatches([]); }} placeholder="Write a reply..." className="min-w-0 flex-1 rounded-xl bg-slate-800 px-3 py-2 text-xs outline-none" /><button onClick={() => { if (!commentInput.trim() && !commentMedia) return; const label = commentInput.trim() || "Media reply"; void feedService.addReelComment(currentReel.id, currentUser.id, label, commentMedia).then((sent) => { if (!sent) return; setReelComments((prev) => ({ ...prev, [currentReel.id]: [...(prev[currentReel.id] || []), commentMedia ? `${label} [media]` : label] })); setReels((prev) => prev.map((reel) => reel.id === currentReel.id ? { ...reel, comments_count: reel.comments_count + 1 } : reel)); setCommentInput(""); setCommentMedia(""); }); }} className="rounded-xl bg-pink-500 px-3 text-xs font-bold">Reply</button></div>
          {mentionMatches.length > 0 && <div className="flex flex-wrap gap-1">{mentionMatches.map((profile) => <button key={profile.id} onClick={() => { setCommentInput((value) => value.replace(/@([\w]*)$/, `@${profile.username} `)); setMentionMatches([]); }} className="rounded-lg bg-slate-800 px-2 py-1 text-[10px]">@{profile.username}</button>)}</div>}
          <div className="flex items-center gap-2 mt-2"><label className="rounded-xl border border-slate-700 px-3 py-2 text-[10px] cursor-pointer">Add image/GIF<input type="file" accept="image/*,.gif" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file && file.size <= 2 * 1024 * 1024) { const reader = new FileReader(); reader.onload = () => setCommentMedia(String(reader.result || "")); reader.readAsDataURL(file); } }} /></label><button onClick={() => setCommentMedia("https://media.giphy.com/media/3o7TKsQY8z7Qf1mZfG/giphy.gif")} className="rounded-xl border border-slate-700 px-3 py-2 text-[10px]">GIF</button>{commentMedia && <span className="text-[10px] text-pink-300">Media attached</span>}</div>
        </motion.div>
      </motion.div>,
      document.body,
    );
  };

  const handleToggleLike = (reelId: string) => {
    const reel = reels.find((item) => item.id === reelId);
    if (!reel) return;
    const nextLiked = !reel.is_liked;
    setReels((prev) =>
      prev.map((r) => {
        if (r.id === reelId) {
          const newIsLiked = nextLiked;
          return {
            ...r,
            is_liked: newIsLiked,
            likes_count: newIsLiked
              ? r.likes_count + 1
              : Math.max(0, r.likes_count - 1),
          };
        }
        return r;
      }),
    );
    void feedService.setReelLike(reelId, currentUser.id, nextLiked);
  };

  const handleShare = async () => {
    if (!currentReel) return;
    setShareOpen(true);
    const profiles = await fetchAllProfiles(currentUser.id);
    setShareProfiles(profiles.filter((profile) => profile.id !== currentUser.id).slice(0, 12));
  };

  const shareReelWith = async (profile: Profile) => {
    if (!currentReel) return;
    const shareText = `${currentReel.author.name}: ${currentReel.caption}`;
    await navigator.clipboard?.writeText(`${shareText}\n${currentReel.video_url}`);
    await sendMessage({ sender_id: currentUser.id, receiver_id: profile.id, text: `🎬 Shared reel: ${shareText}\n${currentReel.video_url}`, type: "text", created_at: new Date().toISOString() });
    setShareOpen(false);
    setReels((prev) => prev.map((reel) => reel.id === currentReel.id ? { ...reel, shares_count: reel.shares_count + 1 } : reel));
    void feedService.recordReelShare(currentReel.id);
  };

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play();
      setIsPaused(false);
    } else {
      video.pause();
      setIsPaused(true);
    }
  };

  const startFastForward = () => {
    if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
    longPressTimer.current = window.setTimeout(() => {
      if (videoRef.current) videoRef.current.playbackRate = 2;
      setIsFastForwarding(true);
    }, 350);
  };

  const stopFastForward = () => {
    if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
    longPressTimer.current = null;
    if (videoRef.current) videoRef.current.playbackRate = 1;
    setIsFastForwarding(false);
  };

  const handleDoubleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!currentReel) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setDoubleTapHeart({ x, y });
    if (!currentReel.is_liked) {
      handleToggleLike(currentReel.id);
    }
    setTimeout(() => setDoubleTapHeart(null), 900);
  };

  const toggleFollow = async (username: string) => {
    if (!currentReel?.user_id || currentReel.user_id === currentUser.id) return;
    const currentlyJoined = followingMap[username];
    setFollowingMap((prev) => ({ ...prev, [username]: !currentlyJoined }));
    const result = currentlyJoined
      ? await supabase.from("follows").delete().eq("follower_id", currentUser.id).eq("following_id", currentReel.user_id)
      : await supabase.from("follows").delete().eq("follower_id", currentUser.id).eq("following_id", currentReel.user_id).in("status", ["rejected", "ignored"]).then(async (cleanup) => cleanup.error ? cleanup : supabase.from("follows").insert({ follower_id: currentUser.id, following_id: currentReel.user_id, status: "pending" }));
    if (result.error) setFollowingMap((prev) => ({ ...prev, [username]: currentlyJoined }));
  };

  const handleUploadReelSubmit = async () => {
    if ((!reelVideoUrl.trim() && !reelVideoFile) || !reelCaption.trim()) return;
    setIsPublishing(true);

    let videoUrl = reelVideoUrl.trim();
    if (reelVideoFile) {
      const uploadedUrl = await feedService.uploadReelVideo(currentUser.id, reelVideoFile);
      if (!uploadedUrl) {
        setIsPublishing(false);
        return;
      }
      videoUrl = uploadedUrl;
    }

    const created = await feedService.createReel(
      currentUser.id,
      reelCaption.trim(),
      videoUrl,
      reelSongTitle.trim(),
    );

    if (created) {
      setReelCaption("");
      setReelVideoUrl("");
      setReelVideoFile(null);
      setReelFileName("");
      setIsUploadModalOpen(false);
      await loadReels();
    }
    setIsPublishing(false);
  };

  const sampleVideoOptions = [
    {
      title: "Nature Breeze",
      url: "https://assets.mixkit.co/videos/preview/mixkit-tree-branches-in-the-breeze-1188-large.mp4",
    },
    {
      title: "Sunset Plateau",
      url: "https://assets.mixkit.co/videos/preview/mixkit-set-of-plateaus-seen-from-the-sky-in-a-sunset-26070-large.mp4",
    },
    {
      title: "Ocean Waves",
      url: "https://assets.mixkit.co/videos/preview/mixkit-waves-in-the-water-1164-large.mp4",
    },
  ];

  return (
    <div className="max-w-md mx-auto h-[calc(100vh-8.5rem)] relative rounded-3xl overflow-hidden shadow-2xl bg-black text-white flex flex-col justify-between select-none border border-slate-800">
      {/* Top Bar Header */}
      <div className="absolute top-0 left-0 right-0 z-30 p-4 bg-gradient-to-b from-black/90 via-black/40 to-transparent flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-ping" />
          <h2 className="font-extrabold tracking-wider text-base">
            Reels Stream
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-3 py-1 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold text-xs shadow-lg hover:scale-105 transition-all flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Upload Reel</span>
          </button>
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-black/80 transition-colors"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3 z-10">
          <RefreshCw className="w-8 h-8 text-pink-500 animate-spin" />
          <p className="text-xs font-mono text-slate-400">
            Loading Supabase Reel Stream...
          </p>
        </div>
      ) : reels.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 z-10 bg-slate-950">
          <div className="p-4 rounded-3xl bg-pink-500/10 text-pink-500 border border-pink-500/20">
            <Film className="w-10 h-10" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">
              No reels uploaded yet
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Be the first to upload a short video stream to the Supabase
              database.
            </p>
          </div>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 font-bold text-xs text-white shadow-lg hover:scale-105 transition-all cursor-pointer"
          >
            Upload First Reel
          </button>
        </div>
      ) : (
        <>
          {/* Main Video Player */}
          <div
            onClick={(event) => { if (!isFastForwarding) togglePlayback(); handleDoubleTap(event); }}
            onPointerDown={startFastForward}
            onPointerUp={stopFastForward}
            onPointerLeave={stopFastForward}
            className="absolute inset-0 z-0 overflow-hidden cursor-pointer"
          >
            {currentReel && (
              <video
                ref={videoRef}
                key={currentReel.video_url}
                src={currentReel.video_url}
                poster={currentReel.poster_url}
                autoPlay
                loop={!isAutoScroll}
                muted={isMuted}
                playsInline
                onEnded={() => { if (isAutoScroll && reels.length > 1) setActiveReelIndex((prev) => (prev + 1) % reels.length); }}
                className="w-full h-full object-cover"
              />
            )}

            <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              {isFastForwarding ? <span className="rounded-full bg-black/60 px-3 py-2 text-xs font-bold">2× speed</span> : isPaused ? <Pause className="h-12 w-12 text-white/80" /> : null}
            </div>

            {/* Double Tap Floating Heart */}
            <AnimatePresence>
              {doubleTapHeart && (
                <motion.div
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{ scale: [0, 1.4, 1], opacity: [1, 1, 0] }}
                  exit={{ opacity: 0 }}
                  style={{
                    top: doubleTapHeart.y - 30,
                    left: doubleTapHeart.x - 30,
                  }}
                  className="absolute z-40 pointer-events-none"
                >
                  <Heart className="w-16 h-16 text-rose-500 fill-rose-500 drop-shadow-lg" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Overlay Ambient Gradient */}
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/90 via-transparent to-black/30 pointer-events-none" />

          {/* Right Sidebar Controls */}
          {currentReel && (
            <div className="absolute right-3 bottom-20 z-20 flex flex-col items-center gap-5">
              <button onClick={() => setIsAutoScroll((value) => !value)} className="flex flex-col items-center gap-1" aria-label="Toggle automatic reel scrolling"><div className={`rounded-full p-2.5 ${isAutoScroll ? "bg-cyan-500 text-slate-950" : "bg-black/40 text-white"}`}><Settings2 className="h-5 w-5" /></div><span className="text-[10px] font-bold">Auto</span></button>
              <button onClick={togglePlayback} className="flex flex-col items-center gap-1" aria-label={isPaused ? "Play reel" : "Pause reel"}><div className="rounded-full bg-black/40 p-2.5 text-white">{isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}</div><span className="text-[10px] font-bold">{isPaused ? "Play" : "Pause"}</span></button>
              <button
                onClick={() => handleToggleLike(currentReel.id)}
                className="group flex flex-col items-center gap-1 cursor-pointer focus:outline-none"
              >
                <div
                  className={`p-3 rounded-full backdrop-blur-md transition-all ${
                    currentReel.is_liked
                      ? "bg-rose-500 text-white shadow-lg shadow-rose-500/40 scale-110"
                      : "bg-black/40 hover:bg-black/60 text-white"
                  }`}
                >
                  <Heart
                    className={`w-6 h-6 ${currentReel.is_liked ? "fill-current" : ""}`}
                  />
                </div>
                <span className="text-xs font-bold drop-shadow-md">
                  {currentReel.likes_count}
                </span>
              </button>

              <button
                onClick={() => { setShowComments(true); void feedService.fetchReelComments(currentReel.id).then((comments) => setReelComments((prev) => ({ ...prev, [currentReel.id]: comments }))); }}
                className="flex flex-col items-center gap-1 cursor-pointer focus:outline-none"
              >
                <div className="p-3 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-all">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold drop-shadow-md">
                  {currentReel.comments_count}
                </span>
              </button>

              <button onClick={handleShare} className="flex flex-col items-center gap-1 cursor-pointer focus:outline-none" aria-label="Share reel">
                <div className="p-3 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-all">
                  <Share2 className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold drop-shadow-md">
                  {currentReel.shares_count}
                </span>
              </button>

              <button
                onClick={() => { const nextSaved = !savedReels[currentReel.id]; setSavedReels((prev) => ({ ...prev, [currentReel.id]: nextSaved })); setReels((prev) => prev.map((reel) => reel.id === currentReel.id ? { ...reel, saves_count: Math.max(0, reel.saves_count + (nextSaved ? 1 : -1)) } : reel)); void feedService.setReelSave(currentReel.id, currentUser.id, nextSaved); }}
                className="flex flex-col items-center gap-1 cursor-pointer focus:outline-none"
                aria-label={savedReels[currentReel.id] ? "Remove from saved reels" : "Save reel"}
              >
                <div className={`p-3 rounded-full backdrop-blur-md transition-all ${savedReels[currentReel.id] ? "bg-amber-400 text-slate-950" : "bg-black/40 hover:bg-black/60 text-white"}`}>
                  <Bookmark className="w-6 h-6" fill={savedReels[currentReel.id] ? "currentColor" : "none"} />
                </div>
                <span className="text-[10px] font-bold">{currentReel.saves_count} {savedReels[currentReel.id] ? "Saved" : "Saves"}</span>
              </button>

<motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                className="w-10 h-10 rounded-full border-2 border-slate-700 bg-slate-900 overflow-hidden shadow-lg p-1"
              >
                <img
                  src={currentReel.author.avatar}
                  alt="Audio disc"
                  className="w-full h-full rounded-full object-cover"
                />
              </motion.div>

              <button
                onClick={() => setIsMenuOpen(true)}
                className="flex flex-col items-center gap-1 cursor-pointer focus:outline-none"
                aria-label="Reel options"
              >
                <div className="p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-all">
                  <MoreVertical className="w-5 h-5" />
                </div>
              </button>
            </div>
          )}

          {/* Bottom Info Author Caption Overlay */}
          {currentReel && (
            <div className="relative z-20 p-5 pr-16 space-y-3 mt-auto">
              <div className="flex items-center gap-2">
                <button onClick={() => setProfileToView({ id: currentReel.author.username, username: currentReel.author.username, full_name: currentReel.author.name, avatar_url: currentReel.author.avatar })} className="shrink-0">
                  <img
                    src={currentReel.author.avatar}
                    alt={currentReel.author.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-pink-500"
                  />
                </button>
                <button onClick={() => setProfileToView({ id: currentReel.author.username, username: currentReel.author.username, full_name: currentReel.author.name, avatar_url: currentReel.author.avatar })} className="font-bold text-sm">
                  @{currentReel.author.username}
                </button>

                <button
                  onClick={() => void toggleFollow(currentReel.author.username)}
                  className={`ml-1 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    followingMap[currentReel.author.username]
                      ? "bg-slate-800 text-slate-300"
                      : "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md"
                  }`}
                >
                  {followingMap[currentReel.author.username]
                    ? "Mutiny"
                    : "Recruit to Crew"}
                </button>
              </div>

              <p className="text-xs font-normal leading-relaxed text-slate-100 line-clamp-2 drop-shadow-sm">
                {currentReel.caption}
              </p>

              <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                <Music className="w-3.5 h-3.5 text-pink-400 animate-spin" />
                <span className="truncate">{currentReel.song_title}</span>
              </div>
            </div>
          )}

          {/* Vertical Reel Switch Controls */}
          {reels.length > 1 && (
            <div className="hidden sm:flex absolute top-1/2 right-2 -translate-y-1/2 z-20 flex-col gap-2">
              <button
                onClick={() =>
                  setActiveReelIndex((prev) => Math.max(0, prev - 1))
                }
                disabled={activeReelIndex === 0}
                className="p-2 rounded-full bg-black/60 text-white disabled:opacity-30 hover:bg-black cursor-pointer"
              >
                ▲
              </button>
              <button
                onClick={() =>
                  setActiveReelIndex((prev) =>
                    Math.min(reels.length - 1, prev + 1),
                  )
                }
                disabled={activeReelIndex === reels.length - 1}
                className="p-2 rounded-full bg-black/60 text-white disabled:opacity-30 hover:bg-black cursor-pointer"
              >
                ▼
              </button>
            </div>
          )}
        </>
      )}

      {/* UPLOAD REEL MODAL */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-white">Upload New Reel</h3>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400">
                Choose Video From Device
              </label>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (!file.type.startsWith("video/")) return;
                  if (file.size > 100 * 1024 * 1024) return;
                  setReelVideoFile(file);
                  setReelFileName(file.name);
                  setReelVideoUrl("");
                }}
                className="w-full mt-1 px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white file:mr-2 file:rounded-lg file:border-0 file:bg-pink-500 file:px-2 file:py-1 file:text-[10px] file:font-bold file:text-white"
              />
              {reelFileName && <p className="mt-1 text-[10px] text-pink-300">Selected: {reelFileName}</p>}
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400">
                Video Stream URL (MP4)
              </label>
              <input
                type="text"
                placeholder="https://..."
                value={reelVideoUrl}
                onChange={(e) => setReelVideoUrl(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none"
              />
            </div>

            {/* Quick sample video selector */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-semibold uppercase">
                Or Pick Sample Video:
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {sampleVideoOptions.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => setReelVideoUrl(opt.url)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-pink-500/20 hover:border-pink-500 border border-slate-700 text-[10px] text-slate-200 truncate cursor-pointer"
                  >
                    {opt.title}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400">
                Reel Caption
              </label>
              <textarea
                placeholder="Write a captivating reel description..."
                value={reelCaption}
                onChange={(e) => setReelCaption(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none"
                rows={2}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400">
                Audio Track Title
              </label>
              <input
                type="text"
                value={reelSongTitle}
                onChange={(e) => setReelSongTitle(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none"
              />
            </div>

            <button
              onClick={handleUploadReelSubmit}
                disabled={
                (!reelVideoUrl.trim() && !reelVideoFile) || !reelCaption.trim() || isPublishing
              }
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 font-bold text-sm text-white shadow-lg hover:scale-[1.02] transition-all disabled:opacity-40 cursor-pointer"
            >
{isPublishing ? "Publishing Reel..." : "Publish Reel"}
            </button>
          </div>
        </div>
      )}

      {/* REEL CONTEXT MENU MODAL */}
      {renderCommentsOverlay()}
      {profileToView && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4" onClick={() => setProfileToView(null)}><div className="w-full max-w-sm rounded-3xl bg-slate-900 p-6 text-center" onClick={(event) => event.stopPropagation()}><img src={profileToView.avatar_url} alt={profileToView.full_name} className="mx-auto h-20 w-20 rounded-full object-cover" /><h3 className="mt-3 font-bold text-white">{profileToView.full_name}</h3><p className="text-xs text-slate-400">@{profileToView.username}</p><button onClick={() => setProfileToView(null)} className="mt-4 rounded-xl bg-pink-500 px-4 py-2 text-xs font-bold">Close Profile</button></div></div>}
      <AnimatePresence>
        {shareOpen && currentReel && (
          <motion.div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShareOpen(false)}>
            <motion.div className="w-full max-w-md rounded-t-3xl bg-slate-900 p-5 text-white" onClick={(event) => event.stopPropagation()} initial={{ y: 300 }} animate={{ y: 0 }}>
              <div className="flex items-center justify-between mb-4"><h3 className="font-bold">Share with crew</h3><button onClick={() => setShareOpen(false)}><X className="w-5 h-5" /></button></div>
              <div className="grid grid-cols-4 gap-3">{shareProfiles.map((profile) => <button key={profile.id} onClick={() => void shareReelWith(profile)} className="flex flex-col items-center gap-1"><img src={profile.avatar_url} alt={profile.full_name} className="w-12 h-12 rounded-full object-cover" /><span className="w-full truncate text-[10px]">{profile.full_name}</span></button>)}</div>
              {!shareProfiles.length && <p className="text-xs text-slate-400">No other crew members found.</p>}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <ReelsMenuModal
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        reel={currentReel || null}
        currentUserId={currentUser.id}
      />
    </div>
  );
};
