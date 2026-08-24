import React, { useEffect, useState } from "react";
import { Heart, MessageCircle, Share2, Bookmark, X, Home, Send, Users } from "lucide-react";
import { FeedPost, Profile } from "../../types";
import { feedService, StoryItem } from "../../services/feedService";
import { supabase } from "../../lib/supabase";
import { fetchAllProfiles } from "../../services/chatService.profiles";

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
  const [otherUsers, setOtherUsers] = useState<Profile[]>([]);
  const [newPostText, setNewPostText] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  const loadHome = async () => {
    setLoading(true);
    const [homePosts, homeStories] = await Promise.all([
      feedService.fetchPosts(currentUser.id),
      feedService.fetchStories(currentUser.id),
    ]);
    setPosts(homePosts);
    setStories(homeStories);
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
      : await supabase.from("follows").upsert({ follower_id: currentUser.id, following_id: post.user_id, status: "pending" }, { onConflict: "follower_id,following_id" });
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

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-12">
      <header className="flex items-center gap-2 px-2">
        <Home className="h-5 w-5 text-cyan-400" />
        <div><h2 className="text-xl font-bold text-slate-100">Home</h2><p className="text-xs text-slate-400">Stories and updates from HeyLook</p></div>
      </header>

      <section className="flex gap-3 overflow-x-auto px-1 pb-1 scrollbar-none">
        <button onClick={() => setActiveStory({ id: "create", user_id: currentUser.id, user_name: currentUser.full_name, user_avatar: currentUser.avatar_url, media_url: currentUser.avatar_url, created_at: new Date().toISOString() })} className="flex w-20 shrink-0 flex-col items-center gap-1 text-center">
          <img src={currentUser.avatar_url} alt={currentUser.full_name} className="h-14 w-14 rounded-full border-2 border-cyan-400 object-cover" />
          <span className="w-full truncate text-[10px] text-slate-300">Your story</span>
        </button>
        {stories.filter((story) => story.user_id !== currentUser.id).map((story) => (
          <button key={story.id} onClick={() => setActiveStory(story)} className="flex w-20 shrink-0 flex-col items-center gap-1 text-center">
            <img src={story.user_avatar} alt={story.user_name} className="h-14 w-14 rounded-full border-2 border-pink-500 object-cover" />
            <span className="w-full truncate text-[10px] text-slate-300">{story.user_name}</span>
          </button>
        ))}
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
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">{otherUsers.map((profile) => <button key={profile.id} className="flex min-w-0 flex-col items-center gap-1" onClick={() => setActiveStory({ id: `profile-${profile.id}`, user_id: profile.id, user_name: profile.full_name, user_avatar: profile.avatar_url, media_url: profile.avatar_url, created_at: new Date().toISOString() })}><img src={profile.avatar_url} alt={profile.full_name} className="h-12 w-12 rounded-full object-cover ring-2 ring-slate-700" /><span className="w-full truncate text-[10px] text-slate-300">{profile.full_name}</span></button>)}</div>
        {!otherUsers.length && <p className="text-xs text-slate-500">No other users available yet.</p>}
      </section>

      {activeStory && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4" onClick={() => setActiveStory(null)}><div className="relative h-[75vh] w-full max-w-sm overflow-hidden rounded-3xl bg-slate-950" onClick={(event) => event.stopPropagation()}><button onClick={() => setActiveStory(null)} className="absolute right-3 top-3 z-10 rounded-full bg-black/50 p-2 text-white"><X className="h-5 w-5" /></button><img src={activeStory.media_url || activeStory.user_avatar} alt={activeStory.user_name} className="h-full w-full object-cover" /><div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 p-4 pt-16"><p className="text-sm font-bold text-white">{activeStory.user_name}</p><p className="text-[10px] text-slate-300">{new Date(activeStory.created_at).toLocaleString()}</p></div></div></div>}
    </div>
  );
};
