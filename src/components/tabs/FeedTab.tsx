import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ThumbsUp,
  MessageSquare,
  Repeat,
  Image as ImageIcon,
  Smile,
  Globe,
  Lock,
  Anchor as AnchorIcon,
  Bookmark,
  Sparkles,
  X,
  RefreshCw,
  BarChart2,
  Palette,
  Send,
  Plus
} from 'lucide-react';
import { FeedPost, Profile, ReactionType, PollData, PrivacyLevel } from '../../types';
import { feedService, StoryItem } from '../../services/feedService';
import { ReactionPicker, REACTION_CONFIG } from '../ReactionPicker';
import { ReactionBadgeArray } from '../ReactionBadgeArray';
import { CommentTree } from '../CommentTree';

interface FeedTabProps {
  currentUser: Profile;
  isDark: boolean;
}

export const CANVAS_GRADIENTS: { id: string; name: string; css: string }[] = [
  { id: 'none', name: 'Standard', css: '' },
  { id: 'sunset', name: 'Sunset Pulse', css: 'bg-gradient-to-tr from-rose-600 via-pink-600 to-amber-500 text-white' },
  { id: 'ocean', name: 'Deep Ocean', css: 'bg-gradient-to-tr from-cyan-700 via-blue-800 to-indigo-950 text-white' },
  { id: 'cyber', name: 'Cosmic Cyber', css: 'bg-gradient-to-tr from-purple-800 via-fuchsia-700 to-pink-600 text-white' },
  { id: 'aurora', name: 'Neon Aurora', css: 'bg-gradient-to-tr from-emerald-600 via-teal-700 to-cyan-900 text-white' },
];

export const FeedTab: React.FC<FeedTabProps> = ({ currentUser, isDark }) => {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Composer state
  const [newPostText, setNewPostText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [feelingTag, setFeelingTag] = useState<string>('feeling excited ✨');
  const [selectedGradient, setSelectedGradient] = useState<string>('');
  const [privacyLevel, setPrivacyLevel] = useState<PrivacyLevel>('Public');

  // Poll Builder state
  const [showPollBuilder, setShowPollBuilder] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['Option 1', 'Option 2']);

  // Reshare state
  const [resharePostTarget, setResharePostTarget] = useState<FeedPost | null>(null);
  const [reshareCommentary, setReshareCommentary] = useState('');

  // Active Reaction Picker target
  const [activeReactionPickerPostId, setActiveReactionPickerPostId] = useState<string | null>(null);

  // Active Comment Post ID
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);

  // Bookmarks
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Record<string, boolean>>({});

  // Story Creation Modal
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [storyMediaInput, setStoryMediaInput] = useState('');
  const [storyPrivacyLevel, setStoryPrivacyLevel] = useState<PrivacyLevel>('Public');
  const [isPublishingStory, setIsPublishingStory] = useState(false);
  const [storyFileName, setStoryFileName] = useState('');

  // Story viewer state
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [storyProgress, setStoryProgress] = useState(0);
  const storyTimerRef = useRef<number | null>(null);

  // Load Real Supabase Posts & Stories
  const loadData = async () => {
    setIsLoading(true);
    const [fetchedPosts, fetchedStories] = await Promise.all([
      feedService.fetchPosts(currentUser.id),
      feedService.fetchStories(currentUser.id),
    ]);
    setPosts(fetchedPosts);
    setStories(fetchedStories);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [currentUser.id]);

  // 1. Reaction Toggle & Picker Handler
  const handleSelectReaction = async (postId: string, reaction: ReactionType) => {
    setActiveReactionPickerPostId(null);

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const currentSummary = p.reactions_summary || { top_reactions: [], total_count: 0 };
        const isAlreadyUserReaction = currentSummary.user_reaction === reaction;
        const nextUserReaction = isAlreadyUserReaction ? undefined : reaction;
        const countDiff = isAlreadyUserReaction ? -1 : currentSummary.user_reaction ? 0 : 1;

        return {
          ...p,
          is_liked: !isAlreadyUserReaction,
          reactions_summary: {
            ...currentSummary,
            user_reaction: nextUserReaction,
            total_count: Math.max(0, currentSummary.total_count + countDiff),
            top_reactions: Array.from(new Set([reaction, ...currentSummary.top_reactions])).slice(0, 3),
          },
        };
      })
    );

    await feedService.setPostReaction(currentUser.id, postId, reaction);
  };

  // 2. Simple Like Button Click
  const handleToggleLikeDefault = async (postId: string) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    const currentReaction = post.reactions_summary?.user_reaction;
    const targetReaction: ReactionType = currentReaction ? (null as any) : 'Like';
    handleSelectReaction(postId, targetReaction || 'Like');
  };

  // 3. Create Post Handler
  const handleCreatePost = async () => {
    if (!newPostText.trim() && !selectedImage && !showPollBuilder) return;

    let pollDataObj: PollData | null = null;
    if (showPollBuilder && pollQuestion.trim() && pollOptions.filter(o => o.trim()).length >= 2) {
      pollDataObj = {
        question: pollQuestion.trim(),
        options: pollOptions
          .filter((o) => o.trim())
          .map((text, idx) => ({ id: `opt_${idx}_${Date.now()}`, text: text.trim(), votes: [] })),
      };
    }

    const created = await feedService.createPost(
      currentUser.id,
      newPostText.trim(),
      selectedImage,
      feelingTag,
      selectedGradient || null,
      pollDataObj,
      privacyLevel
    );

    if (created) {
      setPosts((prev) => [
        {
          ...created,
          author: {
            name: currentUser.full_name || 'HeyLook User',
            username: currentUser.username || 'user',
            avatar: currentUser.avatar_url,
            is_online: true,
            custom_status: 'In Focus',
          },
        },
        ...prev,
      ]);
    }

    // Reset composer
    setNewPostText('');
    setSelectedImage(null);
    setSelectedGradient('');
    setShowPollBuilder(false);
    setPollQuestion('');
    setPollOptions(['Option 1', 'Option 2']);
  };

  // 4. Consensus Poll Vote Handler
  const handleVotePoll = async (postId: string, optionId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId || !p.poll_data) return p;
        const updatedOptions = p.poll_data.options.map((opt) => {
          const cleaned = opt.votes.filter((id) => id !== currentUser.id);
          if (opt.id === optionId) cleaned.push(currentUser.id);
          return { ...opt, votes: cleaned };
        });
        return {
          ...p,
          poll_data: { ...p.poll_data, options: updatedOptions },
        };
      })
    );

    await feedService.votePoll(postId, optionId, currentUser.id);
  };

  // 5. Reshare Post Submit
  const handlePublishReshare = async () => {
    if (!resharePostTarget) return;

    const created = await feedService.createPost(
      currentUser.id,
      reshareCommentary.trim() || `Reshared ${resharePostTarget.author.name}'s post`,
      null,
      'resharing 🔁',
      null,
      null,
      'Public',
      resharePostTarget.id
    );

    if (created) {
      setPosts((prev) => [
        {
          ...created,
          shared_post: resharePostTarget,
          author: {
            name: currentUser.full_name || 'HeyLook User',
            username: currentUser.username || 'user',
            avatar: currentUser.avatar_url,
            is_online: true,
            custom_status: 'In Focus',
          },
        },
        ...prev,
      ]);
    }

    setResharePostTarget(null);
    setReshareCommentary('');
  };

  // 6. Infinite Threaded Comment Reply
  const handleAddCommentReply = async (postId: string, parentId: string | null, text: string) => {
    if (!text.trim()) return;

    await feedService.addComment(currentUser.id, postId, text, parentId);
    // Reload posts to update recursive comment tree structure cleanly
    const updatedPosts = await feedService.fetchPosts(currentUser.id);
    setPosts(updatedPosts);
  };

  // Story Submit
  const handleStoryFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setStoryMediaInput(String(reader.result || ''));
      setStoryFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleCreateStorySubmit = async () => {
    if (!storyMediaInput.trim()) return;
    setIsPublishingStory(true);

    try {
      const success = await feedService.createStory(
        currentUser.id,
        storyMediaInput.trim(),
        storyPrivacyLevel
      );

      if (success) {
        setStoryMediaInput('');
        setStoryFileName('');
        setIsStoryModalOpen(false);
        const updatedStories = await feedService.fetchStories(currentUser.id);
        setStories(updatedStories);
      }
    } finally {
      setIsPublishingStory(false);
    }
  };

  const openStory = (index: number) => {
    setActiveStoryIndex(index);
    setStoryProgress(0);
  };

  const closeStory = () => {
    if (storyTimerRef.current) {
      window.clearTimeout(storyTimerRef.current);
      storyTimerRef.current = null;
    }
    setActiveStoryIndex(null);
    setStoryProgress(0);
  };

  const goToStory = (offset: number) => {
    if (activeStoryIndex === null || stories.length === 0) return;
    const nextIndex = Math.min(stories.length - 1, Math.max(0, activeStoryIndex + offset));
    setActiveStoryIndex(nextIndex);
    setStoryProgress(0);
  };

  useEffect(() => {
    if (activeStoryIndex === null || stories.length === 0) {
      setStoryProgress(0);
      return;
    }

    const start = Date.now();
    const step = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(100, (elapsed / 5000) * 100);
      setStoryProgress(progress);

      if (progress >= 100) {
        setActiveStoryIndex((current) => {
          if (current === null || stories.length === 0) return current;
          return current >= stories.length - 1 ? 0 : current + 1;
        });
        setStoryProgress(0);
        return;
      }

      storyTimerRef.current = window.setTimeout(step, 50);
    };

    storyTimerRef.current = window.setTimeout(step, 50);

    return () => {
      if (storyTimerRef.current) {
        window.clearTimeout(storyTimerRef.current);
        storyTimerRef.current = null;
      }
    };
  }, [activeStoryIndex, stories.length]);

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Top Header Mode Indicator */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <h2 className="text-xl font-bold tracking-tight text-slate-100">Social Matrix</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Refresh Social Stream"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
          <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 font-semibold border border-cyan-500/20">
            Nautical Realtime Stream
          </span>
        </div>
      </div>

      {/* Stories Tray Carousel */}
      <div className="flex items-center gap-3 overflow-x-auto py-2 scrollbar-none">
        <motion.div
          whileHover={{ scale: 1.03 }}
          onClick={() => setIsStoryModalOpen(true)}
          className={`relative w-28 h-44 rounded-2xl overflow-hidden shrink-0 shadow-md cursor-pointer border flex flex-col items-center justify-center p-3 text-center transition-all ${
            isDark
              ? 'bg-slate-900 border-cyan-500/30 hover:border-cyan-400'
              : 'bg-white border-cyan-200 hover:border-cyan-400'
          }`}
        >
          <div className="p-3 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white mb-2 shadow-lg shadow-cyan-500/30">
            <Plus className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold leading-tight">Create Story</span>
          <span className="text-[10px] text-slate-400 mt-0.5">Share moment</span>
        </motion.div>

        {stories.map((story, index) => (
          <motion.div
            key={story.id}
            whileHover={{ scale: 1.03 }}
            onClick={() => openStory(index)}
            className={`relative w-28 h-44 rounded-2xl overflow-hidden shrink-0 shadow-md cursor-pointer border ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}
          >
            <img
              src={story.media_url || story.user_avatar}
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute top-2 left-2 p-0.5 rounded-full bg-gradient-to-tr from-cyan-400 to-indigo-500">
              <img
                src={story.user_avatar}
                alt={story.user_name}
                className="w-8 h-8 rounded-full object-cover border-2 border-slate-900"
              />
            </div>
            <span className="absolute bottom-2 left-2 right-2 text-xs font-semibold text-white truncate">
              {story.user_name}
            </span>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {activeStoryIndex !== null && stories[activeStoryIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="relative w-full max-w-md h-[72vh] overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950 shadow-2xl"
            >
              <button
                onClick={closeStory}
                className="absolute right-3 top-3 z-20 rounded-full bg-black/40 p-2 text-white hover:bg-black/60"
                aria-label="Close story"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="absolute inset-x-0 top-0 z-20 p-3">
                <div className="flex gap-1.5">
                  {stories.map((story, index) => (
                    <div key={`${story.id}-bar`} className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/25">
                      <div
                        className={`h-full rounded-full transition-all duration-200 ${
                          index < activeStoryIndex ? 'bg-white' : index === activeStoryIndex ? 'bg-white' : 'bg-transparent'
                        }`}
                        style={{
                          width:
                            index < activeStoryIndex ? '100%' : index === activeStoryIndex ? `${storyProgress}%` : '0%',
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <img
                src={stories[activeStoryIndex].media_url || stories[activeStoryIndex].user_avatar}
                alt={`${stories[activeStoryIndex].user_name}'s story`}
                className="h-full w-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              <div className="absolute bottom-0 left-0 right-0 z-10 p-4">
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={stories[activeStoryIndex].user_avatar}
                    alt={stories[activeStoryIndex].user_name}
                    className="h-10 w-10 rounded-full border-2 border-white/60 object-cover"
                  />
                  <div>
                    <p className="text-sm font-semibold text-white">{stories[activeStoryIndex].user_name}</p>
                    <p className="text-[10px] text-slate-200">
                      {new Date(stories[activeStoryIndex].created_at).toLocaleTimeString([], {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => goToStory(-1)}
                className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white hover:bg-black/50"
                aria-label="Previous story"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[2]">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>

              <button
                onClick={() => goToStory(1)}
                className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white hover:bg-black/50"
                aria-label="Next story"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[2]">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ADVANCED DIGITAL PUBLISHING COMPOSER */}
      <div
        className={`p-4 rounded-3xl border shadow-xl relative transition-all ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center gap-3 mb-3">
          <img
            src={currentUser.avatar_url}
            alt={currentUser.full_name}
            className="w-10 h-10 rounded-full object-cover border border-slate-700"
          />

          <div className="flex-1 flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-300">
              Publish Stream • {currentUser.full_name}
            </h4>

            {/* Privacy Selector Dropdown */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300">
              {privacyLevel === 'Public' && <Globe className="w-3 h-3 text-cyan-400" />}
              {privacyLevel === 'Only Me' && <Lock className="w-3 h-3 text-rose-400" />}
              {privacyLevel === 'Anchors Only' && <AnchorIcon className="w-3 h-3 text-amber-400" />}
              <select
                value={privacyLevel}
                onChange={(e) => setPrivacyLevel(e.target.value as PrivacyLevel)}
                className="bg-transparent text-[11px] font-semibold text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="Public">Public 🌐</option>
                <option value="Only Me">Only Me 🔒</option>
                <option value="Anchors Only">Anchors Only ⚓</option>
              </select>
            </div>
          </div>
        </div>

        {/* Text Area with Optional Canvas Gradient Card Preview */}
        <div
          className={`rounded-2xl transition-all p-3 ${
            selectedGradient
              ? `${selectedGradient} min-h-36 flex items-center justify-center p-6 text-center font-black text-xl shadow-lg`
              : 'bg-slate-950/60 border border-slate-800'
          }`}
        >
          <textarea
            rows={selectedGradient ? 3 : 2}
            placeholder={`What's on your mind, ${currentUser.full_name?.split(' ')[0]}?`}
            value={newPostText}
            onChange={(e) => setNewPostText(e.target.value)}
            className={`w-full bg-transparent focus:outline-none resize-none text-sm transition-all ${
              selectedGradient ? 'text-white placeholder:text-white/70 text-center font-bold text-lg' : 'text-slate-100 placeholder:text-slate-500'
            }`}
          />
        </div>

        {/* Selected Image Attachment Preview */}
        {selectedImage && (
          <div className="relative mt-3 rounded-2xl overflow-hidden max-h-60 border border-slate-800">
            <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-black"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Interactive Consensus Poll Builder Block */}
        {showPollBuilder && (
          <div className="mt-3 p-3.5 rounded-2xl bg-slate-950 border border-cyan-500/30 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-cyan-400">
              <span className="flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4" /> Interactive Consensus Poll
              </span>
              <button
                onClick={() => setShowPollBuilder(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              placeholder="Ask a poll question..."
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
            />

            <div className="space-y-2">
              {pollOptions.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={`Option ${idx + 1}`}
                    value={opt}
                    onChange={(e) => {
                      const updated = [...pollOptions];
                      updated[idx] = e.target.value;
                      setPollOptions(updated);
                    }}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none"
                  />
                  {pollOptions.length > 2 && (
                    <button
                      onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}
                      className="text-rose-400 p-1 hover:bg-rose-500/20 rounded"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
              {pollOptions.length < 4 && (
                <button
                  onClick={() => setPollOptions([...pollOptions, `Option ${pollOptions.length + 1}`])}
                  className="text-xs text-cyan-400 font-semibold hover:underline flex items-center gap-1 mt-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Option
                </button>
              )}
            </div>
          </div>
        )}

        {/* Gradient Selection Palette Row */}
        <div className="flex items-center gap-2 mt-3 overflow-x-auto py-1">
          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 shrink-0">
            <Palette className="w-3.5 h-3.5 text-cyan-400" /> Canvas:
          </span>
          {CANVAS_GRADIENTS.map((g) => (
            <button
              key={g.id}
              onClick={() => setSelectedGradient(selectedGradient === g.css ? '' : g.css)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all border shrink-0 ${
                g.css
                  ? `${g.css} border-transparent shadow-sm`
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              } ${selectedGradient === g.css ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900' : ''}`}
            >
              {g.name}
            </button>
          ))}
        </div>

        {/* Bottom Actions Row */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-medium text-slate-400">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => {
                const samples = [
                  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
                  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800',
                  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
                ];
                setSelectedImage(samples[Math.floor(Math.random() * samples.length)]);
              }}
              className="flex items-center gap-1.5 p-1.5 px-2.5 rounded-xl hover:bg-slate-800 text-emerald-400 transition-colors cursor-pointer"
            >
              <ImageIcon className="w-4 h-4" />
              <span>Image</span>
            </button>

            <button
              onClick={() => setShowPollBuilder(!showPollBuilder)}
              className="flex items-center gap-1.5 p-1.5 px-2.5 rounded-xl hover:bg-slate-800 text-cyan-400 transition-colors cursor-pointer"
            >
              <BarChart2 className="w-4 h-4" />
              <span>Poll</span>
            </button>

            <button
              onClick={() => {
                const tags = ['feeling productive ☕', 'feeling excited 🎉', 'feeling creative 🎨', 'in focus ⚓'];
                setFeelingTag(tags[(tags.indexOf(feelingTag) + 1) % tags.length]);
              }}
              className="flex items-center gap-1.5 p-1.5 px-2.5 rounded-xl hover:bg-slate-800 text-amber-400 transition-colors cursor-pointer"
            >
              <Smile className="w-4 h-4" />
              <span className="truncate max-w-[100px]">{feelingTag}</span>
            </button>
          </div>

          <button
            onClick={handleCreatePost}
            disabled={!newPostText.trim() && !selectedImage && !showPollBuilder}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-40 cursor-pointer"
          >
            Publish Post
          </button>
        </div>
      </div>

      {/* FEED POSTS STREAM */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 space-y-3">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono">Fetching Supabase Social Stream...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="p-10 text-center rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto border border-cyan-500/20">
            <Sparkles className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-200">No social posts yet</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Be the first to share an update with the HeyLook community! Write a post above.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => {
            const isBookmarked = bookmarkedPosts[post.id];
            const reactionSummary = post.reactions_summary || { top_reactions: ['Like'], total_count: post.likes_count || 0 };

            return (
              <motion.div
                key={post.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className={`rounded-3xl border shadow-xl overflow-hidden relative transition-all ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                {/* Post Header */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={post.author.avatar}
                      alt={post.author.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-700"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-sm leading-tight text-slate-100">
                          {post.author.name}
                        </h4>
                        {post.feeling_tag && (
                          <span className="text-xs text-slate-400 font-normal">
                            is {post.feeling_tag}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                        <span>@{post.author.username}</span>
                        <span>•</span>
                        <span>{post.created_at}</span>
                        <span>•</span>
                        {post.privacy_level === 'Only Me' ? (
                          <Lock className="w-3 h-3 text-rose-400" />
                        ) : post.privacy_level === 'Anchors Only' ? (
                          <AnchorIcon className="w-3 h-3 text-amber-400" />
                        ) : (
                          <Globe className="w-3 h-3 text-slate-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setBookmarkedPosts((prev) => ({ ...prev, [post.id]: !prev[post.id] }))}
                    className={`p-2 rounded-xl transition-colors ${
                      isBookmarked ? 'text-cyan-400 bg-cyan-950/40' : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <Bookmark className="w-4 h-4" />
                  </button>
                </div>

                {/* Post Body: Canvas Gradient vs Standard Text */}
                {post.background_style ? (
                  <div className={`p-8 ${post.background_style} text-center font-black text-xl leading-snug shadow-inner my-1`}>
                    <p className="max-w-md mx-auto drop-shadow-md">{post.content}</p>
                  </div>
                ) : (
                  <p className="px-4 pb-3 text-sm leading-relaxed whitespace-pre-line text-slate-200">
                    {post.content}
                  </p>
                )}

                {/* Post Image Attachment */}
                {post.image_url && (
                  <div className="w-full max-h-96 overflow-hidden bg-slate-950">
                    <img
                      src={post.image_url}
                      alt="Post media"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                )}

                {/* Consensus Poll Display */}
                {post.poll_data && (
                  <div className="mx-4 mb-4 p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <h5 className="font-bold text-xs text-cyan-300 flex items-center gap-1.5">
                      <BarChart2 className="w-4 h-4" /> {post.poll_data.question}
                    </h5>
                    <div className="space-y-2">
                      {post.poll_data.options.map((opt) => {
                        const totalVotes = post.poll_data!.options.reduce((acc, o) => acc + o.votes.length, 0);
                        const pct = totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0;
                        const hasVoted = opt.votes.includes(currentUser.id);

                        return (
                          <div
                            key={opt.id}
                            onClick={() => handleVotePoll(post.id, opt.id)}
                            className={`relative p-2.5 rounded-xl border text-xs font-semibold cursor-pointer overflow-hidden transition-all ${
                              hasVoted
                                ? 'border-cyan-500 bg-cyan-950/30 text-cyan-200'
                                : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            {/* Vote Percentage Fill Bar */}
                            <div
                              className="absolute inset-y-0 left-0 bg-cyan-500/20 transition-all duration-500 pointer-events-none"
                              style={{ width: `${pct}%` }}
                            />
                            <div className="relative flex items-center justify-between z-10">
                              <span className="truncate">{opt.text}</span>
                              <span className="font-mono text-[10px] text-slate-400 ml-2">
                                {pct}% ({opt.votes.length})
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Reshared Original Post Envelope */}
                {post.shared_post && (
                  <div className="mx-4 mb-4 p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2">
                      <img
                        src={post.shared_post.author.avatar}
                        alt=""
                        className="w-7 h-7 rounded-full object-cover"
                      />
                      <div>
                        <span className="font-bold text-xs text-slate-200">{post.shared_post.author.name}</span>
                        <span className="text-[10px] text-slate-400 ml-1.5">@{post.shared_post.author.username}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{post.shared_post.content}</p>
                    {post.shared_post.image_url && (
                      <img
                        src={post.shared_post.image_url}
                        alt=""
                        className="w-full h-40 object-cover rounded-xl mt-1"
                      />
                    )}
                  </div>
                )}

                {/* Reactions Summary Bar */}
                <div className="p-3 px-4 flex items-center justify-between text-xs text-slate-400 border-b border-slate-800">
                  <ReactionBadgeArray
                    topReactions={reactionSummary.top_reactions}
                    totalCount={reactionSummary.total_count}
                    userReaction={reactionSummary.user_reaction}
                    onClick={() => setActiveReactionPickerPostId(post.id)}
                  />

                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span>{post.comments.length || post.comments_count} comments</span>
                    <span>•</span>
                    <span>{post.shares_count || 0} reshares</span>
                  </div>
                </div>

                {/* Action Buttons Row with Reaction Picker Popup */}
                <div className="p-1 px-4 flex items-center justify-around border-b border-slate-800 text-xs font-semibold relative">
                  {/* Floating 6-State Reaction Picker */}
                  <ReactionPicker
                    isOpen={activeReactionPickerPostId === post.id}
                    onSelectReaction={(r) => handleSelectReaction(post.id, r)}
                  />

                  {/* Reaction Button (Long Press / Click) */}
                  <button
                    onClick={() => handleToggleLikeDefault(post.id)}
                    onMouseEnter={() => setActiveReactionPickerPostId(post.id)}
                    className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      reactionSummary.user_reaction
                        ? `${REACTION_CONFIG[reactionSummary.user_reaction]?.color || 'text-cyan-400'} bg-cyan-500/10`
                        : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-sm">
                      {reactionSummary.user_reaction
                        ? REACTION_CONFIG[reactionSummary.user_reaction]?.emoji
                        : '👍'}
                    </span>
                    <span>{reactionSummary.user_reaction || 'Like'}</span>
                  </button>

                  <button
                    onClick={() => setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)}
                    className="flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 text-slate-400 hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4 text-cyan-400" />
                    <span>Comment</span>
                  </button>

                  <button
                    onClick={() => setResharePostTarget(post)}
                    className="flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 text-slate-400 hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    <Repeat className="w-4 h-4 text-indigo-400" />
                    <span>Reshare</span>
                  </button>
                </div>

                {/* Expandable Infinite Threaded Comment Drawer */}
                {activeCommentPostId === post.id && (
                  <div className="p-4 bg-slate-950/70 space-y-4">
                    <CommentTree
                      comments={post.comments}
                      currentUser={currentUser}
                      onAddReply={(parentId, text) => handleAddCommentReply(post.id, parentId, text)}
                    />

                    {/* Root Comment Input */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                      <img
                        src={currentUser.avatar_url}
                        alt={currentUser.full_name}
                        className="w-7 h-7 rounded-full object-cover shrink-0"
                      />
                      <input
                        type="text"
                        placeholder="Write a comment..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = (e.target as HTMLInputElement).value;
                            if (val) {
                              handleAddCommentReply(post.id, null, val);
                              (e.target as HTMLInputElement).value = '';
                            }
                          }
                        }}
                        className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 text-xs text-white border border-slate-800 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* RESHARE MODAL OVERLAY */}
      {resharePostTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <Repeat className="w-5 h-5 text-indigo-400" /> Reshare Post
              </h3>
              <button
                onClick={() => setResharePostTarget(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <textarea
              rows={3}
              placeholder="Add your thoughts or commentary..."
              value={reshareCommentary}
              onChange={(e) => setReshareCommentary(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
            />

            {/* Target Post Preview */}
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2">
                <img
                  src={resharePostTarget.author.avatar}
                  alt=""
                  className="w-6 h-6 rounded-full object-cover"
                />
                <span className="font-bold text-xs text-slate-200">{resharePostTarget.author.name}</span>
              </div>
              <p className="text-xs text-slate-400 truncate">{resharePostTarget.content}</p>
            </div>

            <button
              onClick={handlePublishReshare}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-sm transition-all cursor-pointer shadow-lg"
            >
              Publish Reshare
            </button>
          </div>
        </div>
      )}

      {/* STORY CREATION MODAL */}
      {isStoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-white">Publish New Story</h3>
              <button
                onClick={() => setIsStoryModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400">Story Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleStoryFileSelect}
                className="w-full mt-1 px-3 py-2 text-sm rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none file:mr-3 file:rounded-full file:border-0 file:bg-cyan-600 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
              />
              {storyFileName && (
                <p className="mt-2 text-[11px] text-cyan-300">Selected: {storyFileName}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400">Or use an image URL</label>
              <input
                type="text"
                placeholder="https://images.unsplash.com/..."
                value={storyMediaInput}
                onChange={(e) => {
                  setStoryMediaInput(e.target.value);
                  if (e.target.value.trim() && storyFileName) setStoryFileName('');
                }}
                className="w-full mt-1 px-3 py-2 text-sm rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400">Who can see this story?</label>
              <select
                value={storyPrivacyLevel}
                onChange={(e) => setStoryPrivacyLevel(e.target.value as PrivacyLevel)}
                className="w-full mt-1 px-3 py-2 text-sm rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none"
              >
                <option value="Public">Everyone</option>
                <option value="Anchors Only">Other HeyLook users</option>
                <option value="Only Me">Only me</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              {[
                'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500',
                'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=500',
                'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500',
              ].map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => setStoryMediaInput(sample)}
                  className="flex-1 h-14 rounded-xl overflow-hidden border border-slate-700 hover:border-cyan-500"
                >
                  <img src={sample} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            <button
              onClick={handleCreateStorySubmit}
              disabled={!storyMediaInput.trim() || isPublishingStory}
              className="w-full py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm transition-all disabled:opacity-40 cursor-pointer"
            >
              {isPublishingStory ? 'Publishing Story...' : 'Publish Story'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
