import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { ReelItem, Profile } from "../../types";
import { feedService } from "../../services/feedService";
import { ReelsMenuModal } from "../reels/ReelsMenuModal";

interface ReelsTabProps {
  currentUser: Profile;
  isDark: boolean;
}

export const ReelsTab: React.FC<ReelsTabProps> = ({ currentUser, isDark }) => {
  const [reels, setReels] = useState<ReelItem[]>([]);
  const [activeReelIndex, setActiveReelIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [savedReels, setSavedReels] = useState<Record<string, boolean>>({});
  const [reelComments, setReelComments] = useState<Record<string, string[]>>({});
  const [commentInput, setCommentInput] = useState("");
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

  const currentReel = reels[activeReelIndex];

  const handleToggleLike = (reelId: string) => {
    setReels((prev) =>
      prev.map((r) => {
        if (r.id === reelId) {
          const newIsLiked = !r.is_liked;
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
  };

  const handleShare = async () => {
    if (!currentReel) return;
    const shareText = `${currentReel.author.name}: ${currentReel.caption}`;
    if (navigator.share) {
      await navigator.share({ title: "HeyLook Reel", text: shareText, url: currentReel.video_url }).catch(() => undefined);
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(currentReel.video_url);
    }
    setReels((prev) => prev.map((reel) => reel.id === currentReel.id ? { ...reel, shares_count: reel.shares_count + 1 } : reel));
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

  const toggleFollow = (username: string) => {
    setFollowingMap((prev) => ({ ...prev, [username]: !prev[username] }));
  };

  const handleUploadReelSubmit = async () => {
    if (!reelVideoUrl.trim() || !reelCaption.trim()) return;
    setIsPublishing(true);

    const created = await feedService.createReel(
      currentUser.id,
      reelCaption.trim(),
      reelVideoUrl.trim(),
      reelSongTitle.trim(),
    );

    if (created) {
      setReelCaption("");
      setReelVideoUrl("");
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
            onClick={handleDoubleTap}
            className="absolute inset-0 z-0 overflow-hidden cursor-pointer"
          >
            {currentReel && (
              <video
                key={currentReel.video_url}
                src={currentReel.video_url}
                poster={currentReel.poster_url}
                autoPlay
                loop
                muted={isMuted}
                playsInline
                className="w-full h-full object-cover"
              />
            )}

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
                onClick={() => setShowComments(true)}
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
                onClick={() => setSavedReels((prev) => ({ ...prev, [currentReel.id]: !prev[currentReel.id] }))}
                className="flex flex-col items-center gap-1 cursor-pointer focus:outline-none"
                aria-label={savedReels[currentReel.id] ? "Remove from saved reels" : "Save reel"}
              >
                <div className={`p-3 rounded-full backdrop-blur-md transition-all ${savedReels[currentReel.id] ? "bg-amber-400 text-slate-950" : "bg-black/40 hover:bg-black/60 text-white"}`}>
                  <Bookmark className="w-6 h-6" fill={savedReels[currentReel.id] ? "currentColor" : "none"} />
                </div>
                <span className="text-[10px] font-bold">{savedReels[currentReel.id] ? "Saved" : "Save"}</span>
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
                <img
                  src={currentReel.author.avatar}
                  alt={currentReel.author.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-pink-500"
                />
                <span className="font-bold text-sm">
                  @{currentReel.author.username}
                </span>

                <button
                  onClick={() => toggleFollow(currentReel.author.username)}
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
            <div className="absolute top-1/2 right-2 -translate-y-1/2 z-20 flex flex-col gap-2">
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
                !reelVideoUrl.trim() || !reelCaption.trim() || isPublishing
              }
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 font-bold text-sm text-white shadow-lg hover:scale-[1.02] transition-all disabled:opacity-40 cursor-pointer"
            >
{isPublishing ? "Publishing Reel..." : "Publish Reel"}
            </button>
          </div>
        </div>
      )}

      {/* REEL CONTEXT MENU MODAL */}
      <AnimatePresence>
        {showComments && currentReel && (
          <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowComments(false)}>
            <motion.div className="w-full max-w-md max-h-[65vh] overflow-y-auto rounded-t-3xl bg-slate-900 p-5 text-white" onClick={(event) => event.stopPropagation()} initial={{ y: 300 }} animate={{ y: 0 }}>
              <div className="flex items-center justify-between mb-4"><h3 className="font-bold">Crew Replies</h3><button onClick={() => setShowComments(false)} aria-label="Close comments"><X className="w-5 h-5" /></button></div>
              <div className="space-y-2 mb-4">{(reelComments[currentReel.id] || []).map((comment, index) => <p key={`${comment}-${index}`} className="p-2 rounded-xl bg-slate-800 text-xs">{comment}</p>)}{!(reelComments[currentReel.id] || []).length && <p className="text-xs text-slate-400">No replies yet. Start the conversation.</p>}</div>
              <div className="flex gap-2"><input value={commentInput} onChange={(event) => setCommentInput(event.target.value)} placeholder="Write a reply..." className="min-w-0 flex-1 rounded-xl bg-slate-800 px-3 py-2 text-xs outline-none" /><button onClick={() => { if (!commentInput.trim()) return; setReelComments((prev) => ({ ...prev, [currentReel.id]: [...(prev[currentReel.id] || []), commentInput.trim()] })); setCommentInput(""); }} className="rounded-xl bg-pink-500 px-3 text-xs font-bold">Reply</button></div>
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
