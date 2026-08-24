import React, { useEffect, useState } from "react";
import { Heart, MessageCircle, Share2, Bookmark, X, Home, Send, Users, Plus, Pause, Play } from "lucide-react";
import { CallLog, FeedPost, Profile } from "../../types";
import { feedService, StoryItem } from "../../services/feedService";
import { supabase } from "../../lib/supabase";
import { fetchAllProfiles } from "../../services/chatService.profiles";
import { fetchRecentCallLogs } from "../../services/chatService.calls";
import { useCall } from "../../context/CallContext";

interface HomeTabProps {
  currentUser: Profile;
  isDark: boolean;
}

export const HomeTab: React.FC<HomeTabProps> = ({ currentUser, isDark }) => {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [activeStory, setActiveStory] = useState<StoryItem | null>(null);
  const [joinedFleet, setJoinedFleet] = useState<Record<string, boolean>>({});
  const [savedPosts, setSavedPosts] = useState<Record<string, boolean>>({});
  const [commentOpen, setCommentOpen] = useState<Record<string, boolean>>({});
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [recentCalls, setRecentCalls] = useState<CallLog[]>([]);
  const { startCall } = useCall();
  const [otherUsers, setOtherUsers] = useState<Profile[]>([]);
  const [newPostText, setNewPostText] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [showStoryComposer, setShowStoryComposer] = useState(false);
  const [storyUrl, setStoryUrl] = useState("");
  const [storyFile, setStoryFile] = useState<File | null>(null);
  const [storyGroupsIndex, setStoryGroupsIndex] = useState(0);
  const [storyItemIndex, setStoryItemIndex] = useState(0);
  const [storyPaused, setStoryPaused] = useState(false);
  const [profileToView, setProfileToView] = useState<Profile | null>(null);
  const [storyLiked, setStoryLiked] = useState<Record<string, boolean>>({});
  const [storyReply, setStoryReply] = useState("");

  const loadHome = async () => {
    setLoading(true);
    const [homePosts, homeStories] = await Promise.all([
      feedService.fetchPosts(currentUser.id),
      feedService.fetchStories(currentUser.id),
    ]);
    const calls = await fetchRecentCallLogs(currentUser.id);
    setPosts(homePosts);
    setStories(homeStories);
    setRecentCalls(calls);
    const profiles = await fetchAllProfiles(currentUser.id);
    setOtherUsers(profiles.filter((profile) => profile.id !== currentUser.id).slice(0, 24));
    const authorIds = homePosts.map((post) => post.user_id).filter((id): id is string => Boolean(id) && id !== currentUser.id);
    if (authorIds.length) {
      const { data } = await supabase.from("follows").select("following_id, status").eq("follower_id", currentUser.id).in("following_id", authorIds);
      setJoinedFleet(Object.fromEntries((data || []).map((row: any) => [row.following_id, row.status === "accepted"])));
    }
    setLoading(false);
  };

  useEffect(() => { void loadHome(); }, [currentUser.id]);

  const storyGroups = Array.from(stories.reduce((groups, story) => {
    const group = groups.get(story.user_id) || [];
    group.push(story);
    groups.set(story.user_id, group);
    return groups;
  }, new Map<string, StoryItem[]>()).values());
  const viewedStory = storyGroups[storyGroupsIndex]?.[storyItemIndex] || null;

  const moveStory = (direction: number) => {
    if (!viewedStory) return;
    const nextItem = storyItemIndex + direction;
    if (nextItem >= 0 && nextItem < storyGroups[storyGroupsIndex].length) setStoryItemIndex(nextItem);
    else if (direction > 0 && storyGroups.length > 1) { const nextGroup = (storyGroupsIndex + 1) % storyGroups.length; setStoryGroupsIndex(nextGroup); setStoryItemIndex(0); }
    else if (direction < 0 && storyGroups.length > 1) { const nextGroup = (storyGroupsIndex - 1 + storyGroups.length) % storyGroups.length; setStoryGroupsIndex(nextGroup); setStoryItemIndex(storyGroups[nextGroup].length - 1); }
  };

  const openStoryGroup = (index: number) => {
    setStoryGroupsIndex(index);
    setStoryItemIndex(0);
    setStoryPaused(false);
    setActiveStory(storyGroups[index]?.[0] || null);
  };
  const toggleLike = async (post: FeedPost) => {
    const nextLiked = !post.is_liked;
    setPosts((items) => items.map((item) => item.id === post.id ? { ...item, is_liked: nextLiked, likes_count: Math.max(0, item.likes_count + (nextLiked ? 1 : -1)) } : item));
    await feedService.setPostReaction(currentUser.id, post.id, nextLiked ? "Like" : null);
  };

  const toggleFleet = async (post: FeedPost) => {
    if (!post.user_id || post.user_id === currentUser.id) return;
    const accepted = joinedFleet[post.user_id];
    setJoinedFleet((items) => ({ ...items, [post.user_id as string]: !accepted }));
    const result = accepted
      ? await supabase.from("follows").delete().eq("follower_id", currentUser.id).eq("following_id", post.user_id)
      : await supabase.from("follows").delete().eq("follower_id", currentUser.id).eq("following_id", post.user_id).in("status", ["rejected", "ignored"]).then(async (cleanup) => cleanup.error ? cleanup : supabase.from("follows").insert({ follower_id: currentUser.id, following_id: post.user_id, status: "pending" }));
    if (result.error) setJoinedFleet((items) => ({ ...items, [post.user_id as string]: accepted }));
  };

  const addComment = async (post: FeedPost) => {
    const text = commentText[post.id]?.trim();
    if (!text) return;
    await feedService.addComment(currentUser.id, post.id, text);
    setCommentText((items) => ({ ...items, [post.id]: "" }));
    const refreshed = await feedService.fetchPosts(currentUser.id);
    setPosts(refreshed);
  };

  const publishTextPost = async () => {
    if (!newPostText.trim() || isPublishing) return;
    setIsPublishing(true);
    const created = await feedService.createPost(currentUser.id, newPostText.trim());
    if (created) {
      setPosts((items) => [{ ...created, author: { name: currentUser.full_name, username: currentUser.username, avatar: currentUser.avatar_url } }, ...items]);
      setNewPostText("");
    }
    setIsPublishing(false);
  };

  const callBack = async (call: CallLog) => {
    const otherUserId = call.caller_id === currentUser.id ? call.receiver_id : call.caller_id;
    const profile = otherUserId === call.caller_id
      ? { id: call.caller_id, username: call.caller_name, full_name: call.caller_name, avatar_url: call.caller_avatar }
      : await import("../../services/chatService.profiles").then(({ fetchProfileById }) => fetchProfileById(otherUserId));
    if (profile) await startCall(profile, call.call_type);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-12">
      <header className="flex items-center gap-2 px-2">
        <Home className="h-5 w-5 text-cyan-400" />
        <div><h2 className="text-xl font-bold text-slate-100">Home</h2><p className="text-xs text-slate-400">Stories and updates from HeyLook</p></div>
      </header>

      <section className="flex gap-3 overflow-x-auto px-1 pb-1 scrollbar-none">
        <button onClick={() => setShowStoryComposer(true)} className="relative flex w-20 shrink-0 flex-col items-center gap-1 text-center">
          <img src={currentUser.avatar_url} alt={currentUser.full_name} className="h-14 w-14 rounded-full border-2 border-cyan-400 object-cover" />
          <span className="absolute left-12 top-9 flex h-6 w-6 items-center justify-center rounded-full border-2 border-slate-950 bg-cyan-500 text-slate-950"><Plus className="h-4 w-4" /></span>
          <span className="w-full truncate text-[10px] text-slate-300">Your story</span>
        </button>
        {storyGroups.filter((group) => group[0].user_id !== currentUser.id).map((group) => {
          const story = group[0];
          return <button key={story.user_id} onClick={() => openStoryGroup(storyGroups.indexOf(group))} className="flex w-20 shrink-0 flex-col items-center gap-1 text-center">
            <img src={story.user_avatar} alt={story.user_name} className="h-14 w-14 rounded-full border-2 border-pink-500 object-cover" />
            <span className="w-full truncate text-[10px] text-slate-300">{story.user_name}</span>
          </button>;
        })}
      </section>

      <section className={`rounded-2xl border p-4 ${isDark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}>
        <div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-bold text-slate-100">Calls</h3><span className="text-[10px] text-slate-500">Recent log</span></div>
        <div className="space-y-2">{recentCalls.length === 0 ? <p className="text-xs text-slate-500">No calls recorded yet.</p> : recentCalls.map((call) => { const incoming = call.receiver_id === currentUser.id; const name = incoming ? call.caller_name : "You"; return <div key={call.id} className="flex items-center gap-3 rounded-xl bg-slate-950 p-3"><img src={call.caller_avatar} alt={name} className="h-9 w-9 rounded-full object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-slate-200">{name} <span className={call.status === "missed" ? "text-rose-400" : "text-emerald-400"}>{call.status === "missed" ? "Missed" : "Connected"}</span></p><p className="text-[10px] text-slate-500">{call.call_type === "video" ? "Video" : "Voice"} • {new Date(call.created_at).toLocaleString()} {call.duration ? `• ${call.duration}` : ""}</p></div><button onClick={() => void callBack(call)} className="rounded-xl bg-cyan-500 px-3 py-2 text-[10px] font-bold text-slate-950">Call</button></div>; })}</div>
      </section>

      <section className={`rounded-2xl border p-4 ${isDark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}>
        <div className="flex gap-2"><img src={currentUser.avatar_url} alt={currentUser.full_name} className="h-9 w-9 rounded-full object-cover" /><input value={newPostText} onChange={(event) => setNewPostText(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void publishTextPost(); } }} placeholder="Share an update with the fleet..." className="min-w-0 flex-1 rounded-xl bg-slate-950 px-3 py-2 text-xs text-white outline-none" /><button onClick={() => void publishTextPost()} disabled={!newPostText.trim() || isPublishing} className="rounded-xl bg-cyan-500 px-3 text-slate-950 disabled:opacity-40"><Send className="h-4 w-4" /></button></div>
      </section>

      {loading ? <p className="py-12 text-center text-xs text-slate-400">Loading Home...</p> : posts.slice(0, 20).map((post) => (
        <article key={post.id} className={`overflow-hidden rounded-2xl border ${isDark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}>
          <div className="flex items-center gap-3 p-4">
            <img src={post.author.avatar} alt={post.author.name} className="h-10 w-10 rounded-full object-cover" />
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-100">{post.author.name}</p><p className="text-[10px] text-slate-400">{post.created_at}</p></div>
            {post.user_id && post.user_id !== currentUser.id && <button onClick={() => void toggleFleet(post)} className={`rounded-xl px-3 py-1.5 text-[10px] font-bold ${joinedFleet[post.user_id] ? "bg-slate-800 text-slate-300" : "bg-cyan-500 text-slate-950"}`}>{joinedFleet[post.user_id] ? "Mutiny" : "Join Fleet"}</button>}
          </div>
          <p className="px-4 pb-3 text-sm leading-relaxed text-slate-200 whitespace-pre-line">{post.content}</p>
          {post.image_url && <img src={post.image_url} alt="Post" className="max-h-80 w-full object-cover" />}
          <div className="flex items-center justify-between border-t border-slate-800 px-4 py-2 text-xs text-slate-400"><span>{post.likes_count} likes</span><span>{post.comments_count} comments</span><span>{post.shares_count} shares</span></div>
          <div className="grid grid-cols-4 border-t border-slate-800 text-xs font-semibold text-slate-300">
            <button onClick={() => void toggleLike(post)} className={`flex items-center justify-center gap-1 py-3 ${post.is_liked ? "text-rose-400" : ""}`}><Heart className="h-4 w-4" fill={post.is_liked ? "currentColor" : "none"} />Like</button>
            <button onClick={() => setCommentOpen((items) => ({ ...items, [post.id]: !items[post.id] }))} className="flex items-center justify-center gap-1 py-3"><MessageCircle className="h-4 w-4" />Comment</button>
            <button onClick={() => { void navigator.clipboard?.writeText(post.content); }} className="flex items-center justify-center gap-1 py-3"><Share2 className="h-4 w-4" />Share</button>
            <button onClick={() => setSavedPosts((items) => ({ ...items, [post.id]: !items[post.id] }))} className={`flex items-center justify-center gap-1 py-3 ${savedPosts[post.id] ? "text-amber-400" : ""}`}><Bookmark className="h-4 w-4" fill={savedPosts[post.id] ? "currentColor" : "none"} />Save</button>
          </div>
          {commentOpen[post.id] && <div className="flex gap-2 border-t border-slate-800 p-3"><input value={commentText[post.id] || ""} onChange={(event) => setCommentText((items) => ({ ...items, [post.id]: event.target.value }))} placeholder="Write a comment..." className="min-w-0 flex-1 rounded-xl bg-slate-950 px-3 py-2 text-xs text-white outline-none" /><button onClick={() => void addComment(post)} className="rounded-xl bg-cyan-500 px-3 text-slate-950"><Send className="h-4 w-4" /></button></div>}
        </article>
      ))}

      <section className={`rounded-2xl border p-4 ${isDark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}>
        <div className="mb-3 flex items-center gap-2"><Users className="h-4 w-4 text-cyan-400" /><h3 className="text-sm font-bold text-slate-100">Other users</h3></div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{otherUsers.map((profile) => <div key={profile.id} className="flex min-w-0 items-center gap-2"><button className="min-w-0" onClick={() => setProfileToView(profile)}><img src={profile.avatar_url} alt={profile.full_name} className="h-11 w-11 rounded-full object-cover ring-2 ring-slate-700" /></button><div className="min-w-0 flex-1"><button onClick={() => setProfileToView(profile)} className="block w-full truncate text-left text-[10px] font-bold text-slate-300">{profile.full_name}</button><button onClick={() => { const accepted = joinedFleet[profile.id]; setJoinedFleet((items) => ({ ...items, [profile.id]: !accepted })); void (accepted ? supabase.from('follows').delete().eq('follower_id', currentUser.id).eq('following_id', profile.id) : supabase.from('follows').insert({ follower_id: currentUser.id, following_id: profile.id, status: 'pending' })); }} className="text-[10px] font-bold text-cyan-400">{joinedFleet[profile.id] ? 'Mutiny' : 'Join Fleet'}</button></div></div>)}</div>
        {!otherUsers.length && <p className="text-xs text-slate-500">No other users available yet.</p>}
      </section>

      {activeStory && viewedStory && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4" onClick={() => setActiveStory(null)}><div className="relative h-[75vh] w-full max-w-sm overflow-hidden rounded-3xl bg-slate-950" onClick={(event) => event.stopPropagation()}><button onClick={() => setActiveStory(null)} className="absolute right-3 top-3 z-10 rounded-full bg-black/50 p-2 text-white"><X className="h-5 w-5" /></button><button onClick={() => moveStory(-1)} className="absolute left-2 top-1/2 z-10 rounded-full bg-black/50 p-3 text-white">‹</button><button onClick={() => moveStory(1)} className="absolute right-2 top-1/2 z-10 rounded-full bg-black/50 p-3 text-white">›</button>{viewedStory.media_url?.startsWith('data:video') || viewedStory.media_url?.match(/\.(mp4|webm|mov)(\?|$)/i) ? <video src={viewedStory.media_url} autoPlay={!storyPaused} controls playsInline className="h-full w-full object-cover" /> : <img src={viewedStory.media_url || viewedStory.user_avatar} alt={viewedStory.user_name} className="h-full w-full object-cover" />}<button onClick={() => setStoryPaused((paused) => !paused)} className="absolute bottom-36 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/60 p-3 text-white" aria-label={storyPaused ? 'Play story' : 'Pause story'}>{storyPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}</button><div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 p-4 pt-16"><div className="flex items-center gap-2"><button onClick={() => { const next = !storyLiked[viewedStory.id]; setStoryLiked((items) => ({ ...items, [viewedStory.id]: next })); void feedService.setStoryReaction(viewedStory.id, currentUser.id, next ? '❤️' : null); }} className="rounded-xl bg-black/50 px-3 py-2 text-xs font-bold">{storyLiked[viewedStory.id] ? 'Liked ❤️' : 'Like 🤍'}</button>{['👍', '😂', '🔥'].map((emoji) => <button key={emoji} onClick={() => void feedService.setStoryReaction(viewedStory.id, currentUser.id, emoji)} className="rounded-xl bg-black/50 px-2 py-2 text-sm">{emoji}</button>)}</div><div className="mt-2 flex gap-2"><input value={storyReply} onChange={(event) => setStoryReply(event.target.value)} placeholder="Reply to story..." className="min-w-0 flex-1 rounded-xl bg-black/50 px-3 py-2 text-xs text-white outline-none" /><button onClick={() => { if (!storyReply.trim()) return; void feedService.sendStoryReply(viewedStory.id, currentUser.id, storyReply.trim()).then((sent) => { if (sent) setStoryReply(''); }); }} className="rounded-xl bg-cyan-500 px-3 py-2 text-xs font-bold text-slate-950">Reply</button></div><p className="mt-2 text-sm font-bold text-white">{viewedStory.user_name}</p><p className="text-[10px] text-slate-300">{new Date(viewedStory.created_at).toLocaleString()}</p></div></div></div>}
      {showStoryComposer && <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-4" onClick={() => setShowStoryComposer(false)}><div className="w-full max-w-sm space-y-4 rounded-3xl bg-slate-900 p-5" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between"><h3 className="font-bold text-white">Add Story</h3><button onClick={() => setShowStoryComposer(false)} className="text-slate-400"><X className="h-5 w-5" /></button></div><input type="file" accept="image/*,video/*" onChange={(event) => { const file = event.target.files?.[0]; if (!file || file.size > 50 * 1024 * 1024) return; setStoryFile(file); const reader = new FileReader(); reader.onload = () => setStoryUrl(String(reader.result || '')); reader.readAsDataURL(file); }} className="w-full text-xs text-white" /><input value={storyUrl.startsWith('data:') ? '' : storyUrl} onChange={(event) => setStoryUrl(event.target.value)} placeholder="Or paste story media URL..." className="w-full rounded-xl bg-slate-950 px-3 py-2 text-xs text-white outline-none" /><button onClick={() => { if (!storyUrl.trim() || isPublishing) return; setIsPublishing(true); void feedService.createStory(currentUser.id, storyUrl.trim()).then((success) => { if (success) { setStoryUrl(''); setStoryFile(null); setShowStoryComposer(false); void loadHome(); } setIsPublishing(false); }); }} disabled={!storyUrl.trim() || isPublishing} className="w-full rounded-xl bg-cyan-500 py-3 text-xs font-bold text-slate-950 disabled:opacity-40">{isPublishing ? "Publishing..." : "Publish Story"}</button></div></div>}
      {profileToView && <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/80 p-4" onClick={() => setProfileToView(null)}><div className="w-full max-w-sm rounded-3xl bg-slate-900 p-6 text-center" onClick={(event) => event.stopPropagation()}><img src={profileToView.avatar_url} alt={profileToView.full_name} className="mx-auto h-20 w-20 rounded-full object-cover" /><h3 className="mt-3 font-bold text-white">{profileToView.full_name}</h3><p className="text-xs text-slate-400">@{profileToView.username}</p><button onClick={() => setProfileToView(null)} className="mt-4 rounded-xl bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950">Close Profile</button></div></div>}
    </div>
  );
};
