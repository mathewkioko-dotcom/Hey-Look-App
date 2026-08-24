import { supabase } from '../lib/supabase';
import { sendMessage } from './chatService.messages';
import { FeedPost, ReelItem, Profile, PostComment, ReactionType, PollData, PrivacyLevel } from '../types';

export interface StoryItem {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  media_url?: string;
  created_at: string;
  privacy_level?: PrivacyLevel;
  viewer_count?: number;
}

/**
 * Recursive tree builder for nested comments
 */
export function buildCommentTree(flatComments: any[], profileMap: Record<string, any>): PostComment[] {
  const commentMap: Record<string, PostComment> = {};
  const rootComments: PostComment[] = [];

  // First pass: format all comments
  flatComments.forEach((c) => {
    const authorProf = profileMap[c.user_id] || {};
    commentMap[c.id] = {
      id: c.id,
      user_id: c.user_id,
      user_name: authorProf.full_name || authorProf.username || 'HeyLook User',
      user_avatar: authorProf.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
      content: c.content || c.text || '',
      created_at: c.created_at ? new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
      likes_count: c.likes_count || 0,
      parent_id: c.parent_id || null,
      replies: [],
    };
  });

  // Second pass: attach children to parents or place in root
  flatComments.forEach((c) => {
    const commentNode = commentMap[c.id];
    if (c.parent_id && commentMap[c.parent_id]) {
      commentMap[c.parent_id].replies = commentMap[c.parent_id].replies || [];
      commentMap[c.parent_id].replies!.push(commentNode);
    } else {
      rootComments.push(commentNode);
    }
  });

  return rootComments;
}

export const feedService = {
  /**
   * Fetch real social posts from Supabase `posts` table with reshares, polls, canvas gradients, and reactions
   */
  async fetchPosts(currentUserId: string): Promise<FeedPost[]> {
    try {
      const { data: rawPosts, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !rawPosts) {
        console.warn('[FeedService] Fetch posts query info:', error?.message);
        return [];
      }

      // Extract unique user IDs for author profiles
      const userIds = Array.from(new Set(rawPosts.map((p: any) => p.user_id).filter(Boolean)));
      const postIds = rawPosts.map((p: any) => p.id);
      const sharedPostIds = Array.from(new Set(rawPosts.map((p: any) => p.shared_post_id).filter(Boolean)));

      // Fetch profile data
      let profileMap: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: profileRows } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds);
        if (profileRows) {
          profileRows.forEach((p: any) => {
            profileMap[p.id] = p;
          });
        }
      }

      // Fetch shared posts if any
      let sharedPostsMap: Record<string, any> = {};
      if (sharedPostIds.length > 0) {
        const { data: sPosts } = await supabase
          .from('posts')
          .select('*')
          .in('id', sharedPostIds);
        if (sPosts) {
          sPosts.forEach((sp: any) => {
            sharedPostsMap[sp.id] = sp;
          });
        }
      }

      // Fetch user reactions / likes
      let reactionsMap: Record<string, { top: ReactionType[]; total: number; userReaction?: ReactionType }> = {};
      if (postIds.length > 0) {
        const { data: likeRows } = await supabase
          .from('likes')
          .select('post_id, user_id, reaction_type')
          .in('post_id', postIds);

        if (likeRows) {
          const postReactionsGroup: Record<string, { counts: Record<ReactionType, number>; userReaction?: ReactionType }> = {};
          likeRows.forEach((l: any) => {
            if (!postReactionsGroup[l.post_id]) {
              postReactionsGroup[l.post_id] = { counts: { Like: 0, Love: 0, Haha: 0, Wow: 0, Sad: 0, Angry: 0 } };
            }
            const type = (l.reaction_type as ReactionType) || 'Like';
            postReactionsGroup[l.post_id].counts[type] = (postReactionsGroup[l.post_id].counts[type] || 0) + 1;

            if (currentUserId && l.user_id === currentUserId) {
              postReactionsGroup[l.post_id].userReaction = type;
            }
          });

          Object.keys(postReactionsGroup).forEach((pid) => {
            const group = postReactionsGroup[pid];
            const sorted = Object.entries(group.counts)
              .filter(([_, cnt]) => cnt > 0)
              .sort((a, b) => b[1] - a[1]);
            const top = sorted.slice(0, 3).map(([r]) => r as ReactionType);
            const total = Object.values(group.counts).reduce((a, b) => a + b, 0);

            reactionsMap[pid] = {
              top,
              total,
              userReaction: group.userReaction,
            };
          });
        }
      }

      // Fetch comments for these posts
      let commentsMap: Record<string, PostComment[]> = {};
      if (postIds.length > 0) {
        const { data: commentRows } = await supabase
          .from('comments')
          .select('*')
          .in('post_id', postIds)
          .order('created_at', { ascending: true });

        if (commentRows) {
          const rawCommentsByPost: Record<string, any[]> = {};
          commentRows.forEach((c: any) => {
            if (!rawCommentsByPost[c.post_id]) rawCommentsByPost[c.post_id] = [];
            rawCommentsByPost[c.post_id].push(c);
          });

          Object.keys(rawCommentsByPost).forEach((pid) => {
            commentsMap[pid] = buildCommentTree(rawCommentsByPost[pid], profileMap);
          });
        }
      }

      return rawPosts.map((p: any) => {
        const author = profileMap[p.user_id] || {};
        const postComments = commentsMap[p.id] || [];
        const reactInfo = reactionsMap[p.id] || {
          top: ['Like'] as ReactionType[],
          total: p.likes_count || 0,
          userReaction: undefined as ReactionType | undefined,
        };

        // Process shared post if exists
        let sharedPostObj: FeedPost | null = null;
        if (p.shared_post_id && sharedPostsMap[p.shared_post_id]) {
          const sp = sharedPostsMap[p.shared_post_id];
          const spAuthor = profileMap[sp.user_id] || {};
          sharedPostObj = {
            id: sp.id,
            author: {
              name: spAuthor.full_name || spAuthor.username || 'Original Author',
              username: spAuthor.username || 'author',
              avatar: spAuthor.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            },
            content: sp.content || '',
            image_url: sp.image_url,
            created_at: sp.created_at ? new Date(sp.created_at).toLocaleDateString() : '',
            likes_count: sp.likes_count || 0,
            comments_count: sp.comments_count || 0,
            shares_count: sp.shares_count || 0,
            is_liked: false,
            comments: [],
            background_style: sp.background_style,
            poll_data: sp.poll_data,
          };
        }

        return {
          id: p.id,
          user_id: p.user_id,
          author: {
            name: author.full_name || author.username || 'Nautical User',
            username: author.username || 'user',
            avatar: author.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            is_online: author.custom_status === 'In Focus' || author.is_online,
            custom_status: author.custom_status || 'In Focus',
          },
          content: p.content || '',
          image_url: p.image_url || p.media_url,
          created_at: p.created_at ? new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
          likes_count: reactInfo.total || p.likes_count || 0,
          comments_count: postComments.length || p.comments_count || 0,
          shares_count: p.shares_count || 0,
          is_liked: Boolean(reactInfo.userReaction),
          feeling_tag: p.feeling_tag,
          background_style: p.background_style,
          poll_data: p.poll_data,
          privacy_level: p.privacy_level || 'Public',
          shared_post_id: p.shared_post_id,
          shared_post: sharedPostObj,
          reactions_summary: {
            top_reactions: reactInfo.top,
            total_count: reactInfo.total,
            user_reaction: reactInfo.userReaction,
          },
          comments: postComments,
        };
      });
    } catch (err) {
      console.warn('[FeedService] Error fetching posts:', err);
      return [];
    }
  },

  /**
   * Create a post with Canvas Gradients, Interactive Consensus Poll, Privacy, or Reshares
   */
  async createPost(
    userId: string,
    content: string,
    imageUrl?: string | null,
    feelingTag?: string | null,
    backgroundStyle?: string | null,
    pollData?: PollData | null,
    privacyLevel: PrivacyLevel = 'Public',
    sharedPostId?: string | null
  ): Promise<FeedPost | null> {
    try {
      await supabase.from('profiles').upsert({
        id: userId,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

      const newPostRow: any = {
        user_id: userId,
        content,
        image_url: imageUrl || null,
        feeling_tag: feelingTag || null,
        background_style: backgroundStyle || null,
        poll_data: pollData || null,
        privacy_level: privacyLevel,
        shared_post_id: sharedPostId || null,
        likes_count: 0,
        comments_count: 0,
        shares_count: 0,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase.from('posts').insert(newPostRow).select().single();
      if (error || !data) {
        console.warn('[FeedService] Failed to insert post:', error?.message);
        return null;
      }

      return {
        id: data.id,
        user_id: userId,
        author: {
          name: 'You',
          username: 'current_user',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          is_online: true,
          custom_status: 'In Focus',
        },
        content: data.content,
        image_url: data.image_url,
        created_at: 'Just now',
        likes_count: 0,
        comments_count: 0,
        shares_count: 0,
        is_liked: false,
        feeling_tag: data.feeling_tag,
        background_style: data.background_style,
        poll_data: data.poll_data,
        privacy_level: data.privacy_level,
        shared_post_id: data.shared_post_id,
        reactions_summary: {
          top_reactions: ['Like'],
          total_count: 0,
        },
        comments: [],
      };
    } catch (err) {
      console.warn('[FeedService] Exception creating post:', err);
      return null;
    }
  },

  /**
   * 6-State Content Reaction Stream UPSERT
   */
  async setPostReaction(
    userId: string,
    postId: string,
    reactionType: ReactionType | null
  ): Promise<boolean> {
    try {
      if (!reactionType) {
        // Delete reaction
        await supabase.from('likes').delete().match({ user_id: userId, post_id: postId });
      } else {
        // UPSERT reaction strictly observing composite UNIQUE(post_id, user_id)
        const { error } = await supabase.from('likes').upsert(
          {
            user_id: userId,
            post_id: postId,
            reaction_type: reactionType,
            created_at: new Date().toISOString(),
          },
          { onConflict: 'post_id,user_id' }
        );

        if (error) {
          console.warn('[FeedService] Reaction UPSERT fallback:', error.message);
        }
      }
      return true;
    } catch (err) {
      console.warn('[FeedService] Error setting post reaction:', err);
      return false;
    }
  },

  /**
   * Interactive Consensus Poll Vote Handler
   */
  async votePoll(postId: string, optionId: string, userId: string): Promise<PollData | null> {
    try {
      // Try Postgres RPC first
      const { data: rpcData, error: rpcErr } = await supabase.rpc('cast_poll_vote', {
        p_post_id: postId,
        p_option_id: optionId,
        p_user_id: userId,
      });

      if (!rpcErr && rpcData) {
        return rpcData as PollData;
      }

      // Fallback: Client-side JSONB scrub & update
      const { data: postRow } = await supabase.from('posts').select('poll_data').eq('id', postId).single();
      if (!postRow || !postRow.poll_data) return null;

      const poll: PollData = postRow.poll_data;
      const updatedOptions = poll.options.map((opt) => {
        // Scrub user from all options first
        const votesCleaned = opt.votes.filter((id) => id !== userId);
        if (opt.id === optionId) {
          votesCleaned.push(userId);
        }
        return { ...opt, votes: votesCleaned };
      });

      const newPollData: PollData = { ...poll, options: updatedOptions };

      await supabase.from('posts').update({ poll_data: newPollData }).eq('id', postId);
      return newPollData;
    } catch (err) {
      console.warn('[FeedService] Error voting on poll:', err);
      return null;
    }
  },

  /**
   * Add a comment (supports infinite nested thread via parent_id)
   */
  async addComment(userId: string, postId: string, content: string, parentId?: string | null): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          user_id: userId,
          post_id: postId,
          content,
          parent_id: parentId || null,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.warn('[FeedService] Comment insert note:', error.message);
        return null;
      }
      return data;
    } catch (err) {
      console.warn('[FeedService] Exception adding comment:', err);
      return null;
    }
  },

  /**
   * Fetch active stories
   */
  async fetchStories(currentUserId: string): Promise<StoryItem[]> {
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data) return [];

      const visibleStories = data.filter((story: any) =>
        story.user_id === currentUserId ||
        story.privacy_level === 'Public' ||
        story.privacy_level === 'Anchors Only' ||
        !story.privacy_level
      );

      const userIds = Array.from(new Set(visibleStories.map((s: any) => s.user_id).filter(Boolean)));
      const ownStoryIds = visibleStories.filter((story: any) => story.user_id === currentUserId).map((story: any) => story.id);
      const viewerCounts = new Map<string, number>();
      if (ownStoryIds.length) {
        const { data: views } = await supabase.from('story_views').select('story_id').in('story_id', ownStoryIds);
        (views || []).forEach((view: any) => viewerCounts.set(view.story_id, (viewerCounts.get(view.story_id) || 0) + 1));
      }
      let profileMap: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('*').in('id', userIds);
        if (profiles) {
          profiles.forEach((p: any) => { profileMap[p.id] = p; });
        }
      }

      return visibleStories.map((s: any) => {
        const p = profileMap[s.user_id] || {};
        return {
          id: s.id,
          user_id: s.user_id,
          user_name: p.full_name || p.username || 'Story Creator',
          user_avatar: p.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          media_url: s.media_url || s.image_url || s.cover_url,
          created_at: s.created_at,
          privacy_level: s.privacy_level || 'Public',
          viewer_count: viewerCounts.get(s.id) || 0,
        };
      });
    } catch (err) {
      console.warn('[FeedService] Error fetching stories:', err);
      return [];
    }
  },

  /**
   * Upload story media to Supabase Storage when a local image is supplied.
   * Data URLs are converted to blob/file and stored in a dedicated public bucket.
   */
  async uploadStoryMedia(userId: string, mediaUrl: string): Promise<string> {
    try {
      if (!mediaUrl || !mediaUrl.startsWith('data:')) {
        return mediaUrl;
      }

      const response = await fetch(mediaUrl);
      const blob = await response.blob();
      const mimeType = blob.type || 'image/jpeg';
      const fileExt = mimeType.includes('video') ? 'mp4' : mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';
      const filePath = `story-media/${userId}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('story-media')
        .upload(filePath, blob, {
          contentType: mimeType,
          upsert: true,
        });

      if (error) {
        console.warn('[FeedService] Story storage upload failed:', error.message);
        return mediaUrl;
      }

      const { data: publicData } = supabase.storage.from('story-media').getPublicUrl(data.path);
      return publicData.publicUrl || mediaUrl;
    } catch (err) {
      console.warn('[FeedService] Story media upload exception:', err);
      return mediaUrl;
    }
  },

  /**
   * Create a new story
   */
  async createStory(
    userId: string,
    mediaUrl: string,
    privacyLevel: PrivacyLevel = 'Public'
  ): Promise<boolean> {
    try {
      const finalMediaUrl = await feedService.uploadStoryMedia(userId, mediaUrl);

      const { error } = await supabase.from('stories').insert({
        user_id: userId,
        media_url: finalMediaUrl,
        privacy_level: privacyLevel,
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.warn('[FeedService] Story insert failed:', error.message);
        return false;
      }

      return true;
    } catch (err) {
      console.warn('[FeedService] Exception creating story:', err);
      return false;
    }
  },

  async sendStoryReply(storyId: string, senderId: string, text: string): Promise<boolean> {
    const { data: story, error } = await supabase.from('stories').select('user_id, media_url').eq('id', storyId).single();
    if (error || !story || story.user_id === senderId) return false;
    try {
      await sendMessage({
        sender_id: senderId,
        receiver_id: story.user_id,
        text: `💬 Story reply: ${text}`,
        type: 'text',
        metadata: { story_id: storyId, story_media_url: story.media_url },
        created_at: new Date().toISOString(),
      });
      return true;
    } catch (err) {
      console.warn('[FeedService] Story reply failed:', err);
      return false;
    }
  },

  async setStoryReaction(storyId: string, userId: string, emoji: string | null): Promise<boolean> {
    const result = emoji
      ? await supabase.from('story_reactions').upsert({ story_id: storyId, user_id: userId, emoji }, { onConflict: 'story_id,user_id' })
      : await supabase.from('story_reactions').delete().eq('story_id', storyId).eq('user_id', userId);
    return !result.error;
  },

  async recordStoryView(storyId: string, viewerId: string): Promise<number> {
    await supabase.from('story_views').upsert({ story_id: storyId, viewer_id: viewerId }, { onConflict: 'story_id,viewer_id', ignoreDuplicates: true });
    const { count } = await supabase.from('story_views').select('viewer_id', { count: 'exact', head: true }).eq('story_id', storyId);
    return count || 0;
  },

  /**
   * Fetch real reels from Supabase `reels`
   */
  async fetchReels(currentUserId: string): Promise<ReelItem[]> {
    try {
      const { data: rawReels, error } = await supabase
        .from('reels')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !rawReels) {
        console.warn('[FeedService] Reels fetch note:', error?.message);
        return [];
      }

      const userIds = Array.from(new Set(rawReels.map((r: any) => r.user_id).filter(Boolean)));
      const reelIds = rawReels.map((reel: any) => reel.id);
      const [{ data: reelLikes }, { data: reelSaves }, { data: reelComments }] = await Promise.all([
        supabase.from('reel_likes').select('reel_id, user_id').in('reel_id', reelIds),
        supabase.from('reel_saves').select('reel_id, user_id').in('reel_id', reelIds),
        supabase.from('reel_comments').select('reel_id').in('reel_id', reelIds),
      ]);
      let profileMap: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('*').in('id', userIds);
        if (profiles) {
          profiles.forEach((p: any) => { profileMap[p.id] = p; });
        }
      }

      return rawReels.map((r: any) => {
        const p = profileMap[r.user_id] || {};
        return {
          id: r.id,
          user_id: r.user_id,
          author: {
            name: p.full_name || p.username || 'Reel Creator',
            username: p.username || 'creator',
            avatar: p.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          },
          caption: r.caption || r.description || '',
          song_title: r.song_title || 'HeyLook Nautical Sound',
          video_url: r.video_url || r.media_url || 'https://assets.mixkit.co/videos/preview/mixkit-tree-branches-in-the-breeze-1188-large.mp4',
          poster_url: r.poster_url || r.thumbnail_url || 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=800',
          likes_count: r.likes_count || 0,
          comments_count: (reelComments || []).filter((comment: any) => comment.reel_id === r.id).length || r.comments_count || 0,
          shares_count: r.shares_count || 0,
          saves_count: (reelSaves || []).filter((save: any) => save.reel_id === r.id).length || r.saves_count || 0,
          is_liked: (reelLikes || []).some((like: any) => like.reel_id === r.id && like.user_id === currentUserId),
        };
      });
    } catch (err) {
      console.warn('[FeedService] Error fetching reels:', err);
      return [];
    }
  },

  /**
   * Upload a new reel into Supabase `reels`
   */
  async uploadReelVideo(userId: string, file: File): Promise<string | null> {
    try {
      const extension = file.name.split('.').pop()?.toLowerCase() || 'mp4';
      const filePath = `reels/${userId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
      const { data, error } = await supabase.storage
        .from('chat-media')
        .upload(filePath, file, { contentType: file.type || 'video/mp4', upsert: false });
      if (error || !data) {
        console.warn('[FeedService] Reel video upload failed:', error?.message);
        return null;
      }
      const { data: publicData } = supabase.storage.from('chat-media').getPublicUrl(data.path);
      return publicData.publicUrl || null;
    } catch (err) {
      console.warn('[FeedService] Reel video upload exception:', err);
      return null;
    }
  },

  async createReel(
    userId: string,
    caption: string,
    videoUrl: string,
    songTitle?: string
  ): Promise<ReelItem | null> {
    try {
      const { data, error } = await supabase
        .from('reels')
        .insert({
          user_id: userId,
          caption,
          video_url: videoUrl,
          song_title: songTitle || 'Original Audio • HeyLook',
          likes_count: 0,
          comments_count: 0,
          shares_count: 0,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error || !data) {
        console.warn('[FeedService] Error inserting reel:', error?.message);
        return null;
      }

      return {
        id: data.id,
        user_id: userId,
        author: {
          name: 'You',
          username: 'current_user',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        },
        caption: data.caption,
        song_title: data.song_title,
        video_url: data.video_url,
        likes_count: 0,
        comments_count: 0,
        shares_count: 0,
        saves_count: 0,
        is_liked: false,
      };
    } catch (err) {
      console.warn('[FeedService] Exception creating reel:', err);
      return null;
    }
  },

  async setReelLike(reelId: string, userId: string, liked: boolean): Promise<boolean> {
    const result = liked
      ? await supabase.from('reel_likes').upsert({ reel_id: reelId, user_id: userId }, { onConflict: 'reel_id,user_id' })
      : await supabase.from('reel_likes').delete().eq('reel_id', reelId).eq('user_id', userId);
    return !result.error;
  },

  async setReelSave(reelId: string, userId: string, saved: boolean): Promise<boolean> {
    const result = saved
      ? await supabase.from('reel_saves').upsert({ reel_id: reelId, user_id: userId }, { onConflict: 'reel_id,user_id' })
      : await supabase.from('reel_saves').delete().eq('reel_id', reelId).eq('user_id', userId);
    return !result.error;
  },

  async addReelComment(reelId: string, userId: string, text: string, mediaUrl?: string): Promise<boolean> {
    const { error } = await supabase.from('reel_comments').insert({ reel_id: reelId, user_id: userId, text, media_url: mediaUrl || null });
    return !error;
  },

  async fetchReelComments(reelId: string): Promise<string[]> {
    const { data, error } = await supabase.from('reel_comments').select('text, media_url').eq('reel_id', reelId).order('created_at', { ascending: true });
    if (error || !data) return [];
    return data.map((comment: any) => comment.media_url ? `${comment.text} [media]` : comment.text);
  },

  async recordReelShare(reelId: string): Promise<boolean> {
    const { data: reel } = await supabase.from('reels').select('shares_count').eq('id', reelId).single();
    const { error } = await supabase.from('reels').update({ shares_count: (reel?.shares_count || 0) + 1 }).eq('id', reelId);
    return !error;
  },

  /**
   * Save / Sync profile changes to Supabase `profiles`
   */
  async updateProfile(userId: string, updates: Partial<Profile>): Promise<boolean> {
    try {
      const payload: any = {
        updated_at: new Date().toISOString(),
      };
      if (updates.full_name !== undefined) payload.full_name = updates.full_name;
      if (updates.username !== undefined) payload.username = updates.username;
      if (updates.avatar_url !== undefined) payload.avatar_url = updates.avatar_url;
      if (updates.bio !== undefined) payload.bio = updates.bio;
      if (updates.custom_status !== undefined) payload.custom_status = updates.custom_status;
      if (updates.nautical_presence !== undefined) payload.custom_status = updates.nautical_presence;

      const { error } = await supabase.from('profiles').update(payload).eq('id', userId);
      if (error) {
        console.warn('[FeedService] Profile update note:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('[FeedService] Exception updating profile:', err);
      return false;
    }
  },

  /**
   * Fetch profile stats from database counts
   */
  async getProfileStats(userId: string): Promise<{ postsCount: number; reelsCount: number }> {
    try {
      const [postsRes, reelsRes] = await Promise.all([
        supabase.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('reels').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      ]);

      return {
        postsCount: postsRes.count || 0,
        reelsCount: reelsRes.count || 0,
      };
    } catch (err) {
      return { postsCount: 0, reelsCount: 0 };
    }
  },
};
