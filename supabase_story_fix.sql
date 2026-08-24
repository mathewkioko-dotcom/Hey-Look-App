-- Story media bucket + stories table unblock.
-- Run this in your Supabase SQL editor.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS story_visibility TEXT NOT NULL DEFAULT 'Everyone';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_photo_visibility TEXT NOT NULL DEFAULT 'Everyone';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read profiles" ON public.profiles;
CREATE POLICY "Users can read profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

INSERT INTO storage.buckets (id, name, public)
VALUES ('story-media', 'story-media', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated users can upload story media" ON storage.objects;
CREATE POLICY "Authenticated users can upload story media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'story-media');

DROP POLICY IF EXISTS "Anyone can read story media" ON storage.objects;
CREATE POLICY "Anyone can read story media"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'story-media');

CREATE TABLE IF NOT EXISTS public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  privacy_level TEXT NOT NULL DEFAULT 'Public',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_story_privacy_level CHECK (privacy_level IN ('Public', 'Only Me', 'Anchors Only'))
);

ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS privacy_level TEXT NOT NULL DEFAULT 'Public';
ALTER TABLE public.stories ALTER COLUMN media_url SET NOT NULL;

ALTER TABLE public.stories DROP CONSTRAINT IF EXISTS check_story_privacy_level;
ALTER TABLE public.stories ADD CONSTRAINT check_story_privacy_level
  CHECK (privacy_level IN ('Public', 'Only Me', 'Anchors Only'));

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Stories visible to selected audience" ON public.stories;
CREATE POLICY "Stories visible to selected audience"
ON public.stories FOR SELECT TO authenticated
USING (privacy_level IN ('Public', 'Anchors Only') OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own stories" ON public.stories;
CREATE POLICY "Users can create their own stories"
ON public.stories FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own stories" ON public.stories;
CREATE POLICY "Users can update own stories"
ON public.stories FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own stories" ON public.stories;
CREATE POLICY "Users can delete own stories"
ON public.stories FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Chat media bucket and message permissions.
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('voice-notes', 'voice-notes', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated users can upload voice notes" ON storage.objects;
CREATE POLICY "Authenticated users can upload voice notes"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'voice-notes');

DROP POLICY IF EXISTS "Anyone can read voice notes" ON storage.objects;
CREATE POLICY "Anyone can read voice notes"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'voice-notes');

DROP POLICY IF EXISTS "Authenticated users can upload chat media" ON storage.objects;
CREATE POLICY "Authenticated users can upload chat media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat-media');

DROP POLICY IF EXISTS "Anyone can read chat media" ON storage.objects;
CREATE POLICY "Anyone can read chat media"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'chat-media');

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS text TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'text';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN DEFAULT true;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS delivery_state SMALLINT DEFAULT 1;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS status SMALLINT DEFAULT 1;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read their messages" ON public.messages;
CREATE POLICY "Users can read their messages" ON public.messages
  FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can update their messages" ON public.messages;
CREATE POLICY "Users can update their messages" ON public.messages
  FOR UPDATE TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can delete their messages" ON public.messages;
CREATE POLICY "Users can delete their messages" ON public.messages
  FOR DELETE TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Reels table used by the Reels tab.
CREATE TABLE IF NOT EXISTS public.reels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  caption TEXT NOT NULL DEFAULT '',
  video_url TEXT NOT NULL,
  song_title TEXT DEFAULT 'Original Audio • HeyLook',
  likes_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  shares_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.reels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reels ADD COLUMN IF NOT EXISTS saves_count INTEGER NOT NULL DEFAULT 0;
DROP POLICY IF EXISTS "Anyone can read reels" ON public.reels;
CREATE POLICY "Anyone can read reels" ON public.reels
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users can publish reels" ON public.reels;
CREATE POLICY "Users can publish reels" ON public.reels
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own reels" ON public.reels;
CREATE POLICY "Users can update own reels" ON public.reels
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own reels" ON public.reels;
CREATE POLICY "Users can delete own reels" ON public.reels
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.reel_saves (
  reel_id UUID NOT NULL REFERENCES public.reels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (reel_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.reel_likes (
  reel_id UUID NOT NULL REFERENCES public.reels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (reel_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.reel_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reel_id UUID NOT NULL REFERENCES public.reels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL DEFAULT '',
  media_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.reel_saves ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view reel saves" ON public.reel_saves;
CREATE POLICY "Authenticated users can view reel saves" ON public.reel_saves FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users can save reels" ON public.reel_saves;
CREATE POLICY "Users can save reels" ON public.reel_saves FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can unsave reels" ON public.reel_saves;
CREATE POLICY "Users can unsave reels" ON public.reel_saves FOR DELETE TO authenticated USING (auth.uid() = user_id);

ALTER TABLE public.reel_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view reel likes" ON public.reel_likes;
CREATE POLICY "Authenticated users can view reel likes" ON public.reel_likes FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users can like reels" ON public.reel_likes;
CREATE POLICY "Users can like reels" ON public.reel_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can unlike reels" ON public.reel_likes;
CREATE POLICY "Users can unlike reels" ON public.reel_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

ALTER TABLE public.reel_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view reel comments" ON public.reel_comments;
CREATE POLICY "Authenticated users can view reel comments" ON public.reel_comments FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users can comment on reels" ON public.reel_comments;
CREATE POLICY "Users can comment on reels" ON public.reel_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- One-way fleet membership used by Join Fleet / Mutiny and The Manifest.
CREATE TABLE IF NOT EXISTS public.user_blocks (
  blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (blocker_id, blocked_id),
  CONSTRAINT user_blocks_not_self CHECK (blocker_id <> blocked_id)
);

ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their blocks" ON public.user_blocks;
CREATE POLICY "Users can view their blocks" ON public.user_blocks FOR SELECT TO authenticated
  USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);
DROP POLICY IF EXISTS "Users can block users" ON public.user_blocks;
CREATE POLICY "Users can block users" ON public.user_blocks FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = blocker_id);
DROP POLICY IF EXISTS "Users can unblock users" ON public.user_blocks;
CREATE POLICY "Users can unblock users" ON public.user_blocks FOR DELETE TO authenticated
  USING (auth.uid() = blocker_id);

-- Durable, recipient-owned activity notifications.
CREATE TABLE IF NOT EXISTS public.call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  caller_name TEXT NOT NULL DEFAULT 'HeyLook User',
  caller_avatar TEXT NOT NULL DEFAULT '',
  call_type TEXT NOT NULL CHECK (call_type IN ('audio', 'video')),
  status TEXT NOT NULL CHECK (status IN ('connected', 'missed')),
  duration TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their call logs" ON public.call_logs;
CREATE POLICY "Users can view their call logs" ON public.call_logs FOR SELECT TO authenticated USING (auth.uid() = caller_id OR auth.uid() = receiver_id);
DROP POLICY IF EXISTS "Users can create their call logs" ON public.call_logs;
CREATE POLICY "Users can create their call logs" ON public.call_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = caller_id OR auth.uid() = receiver_id);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  kind TEXT NOT NULL,
  target_id UUID,
  message TEXT NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read their notifications" ON public.notifications;
CREATE POLICY "Users can read their notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = recipient_id);
DROP POLICY IF EXISTS "Users can mark their notifications read" ON public.notifications;
CREATE POLICY "Users can mark their notifications read" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = recipient_id) WITH CHECK (auth.uid() = recipient_id);
DROP POLICY IF EXISTS "Users can clear their notifications" ON public.notifications;
CREATE POLICY "Users can clear their notifications" ON public.notifications
  FOR DELETE TO authenticated USING (auth.uid() = recipient_id);

CREATE OR REPLACE FUNCTION public.create_activity_notification()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE recipient UUID; actor UUID; target UUID; kind_name TEXT; notification_text TEXT;
BEGIN
  IF TG_TABLE_NAME = 'messages' THEN
    recipient := NEW.receiver_id; actor := NEW.sender_id; target := NEW.id; kind_name := 'message';
    notification_text := COALESCE(NULLIF(NEW.text, ''), CASE WHEN NEW.type = 'video' THEN 'Sent you a video' WHEN NEW.type = 'image' THEN 'Sent you a photo' ELSE 'Sent you a message' END);
  ELSIF TG_TABLE_NAME = 'follows' THEN
    recipient := NEW.following_id; actor := NEW.follower_id; target := NEW.follower_id; kind_name := 'fleet'; notification_text := 'requested to join your fleet';
  ELSIF TG_TABLE_NAME = 'story_reactions' THEN
    SELECT user_id INTO recipient FROM stories WHERE id = NEW.story_id; actor := NEW.user_id; target := NEW.story_id; kind_name := 'story_reaction'; notification_text := 'reacted ' || NEW.emoji || ' to your story';
  ELSIF TG_TABLE_NAME = 'likes' THEN
    SELECT user_id INTO recipient FROM posts WHERE id = NEW.post_id; actor := NEW.user_id; target := NEW.post_id; kind_name := 'post_like'; notification_text := 'reacted ' || COALESCE(NEW.reaction_type, 'Like') || ' to your post';
  ELSIF TG_TABLE_NAME = 'comments' THEN
    SELECT user_id INTO recipient FROM posts WHERE id = NEW.post_id; actor := NEW.user_id; target := NEW.post_id; kind_name := 'comment'; notification_text := 'commented on your post';
  ELSE RETURN NEW;
  END IF;
  IF recipient IS NOT NULL AND actor IS DISTINCT FROM recipient THEN
    INSERT INTO notifications (recipient_id, actor_id, kind, target_id, message) VALUES (recipient, actor, kind_name, target, notification_text);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_new_message ON public.messages;
CREATE TRIGGER notify_new_message AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.create_activity_notification();
DROP TRIGGER IF EXISTS notify_new_follow ON public.follows;
CREATE TRIGGER notify_new_follow AFTER INSERT ON public.follows FOR EACH ROW EXECUTE FUNCTION public.create_activity_notification();
DROP TRIGGER IF EXISTS notify_story_reaction ON public.story_reactions;
CREATE TRIGGER notify_story_reaction AFTER INSERT ON public.story_reactions FOR EACH ROW EXECUTE FUNCTION public.create_activity_notification();
DROP TRIGGER IF EXISTS notify_post_like ON public.likes;
CREATE TRIGGER notify_post_like AFTER INSERT ON public.likes FOR EACH ROW EXECUTE FUNCTION public.create_activity_notification();
DROP TRIGGER IF EXISTS notify_post_comment ON public.comments;
CREATE TRIGGER notify_post_comment AFTER INSERT ON public.comments FOR EACH ROW EXECUTE FUNCTION public.create_activity_notification();

CREATE TABLE IF NOT EXISTS public.follows (
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CONSTRAINT follows_not_self CHECK (follower_id <> following_id)
);

ALTER TABLE public.follows ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE public.follows DROP CONSTRAINT IF EXISTS follows_status_check;
ALTER TABLE public.follows ADD CONSTRAINT follows_status_check CHECK (status IN ('pending', 'accepted', 'rejected', 'ignored'));

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view fleet memberships" ON public.follows;
CREATE POLICY "Authenticated users can view fleet memberships" ON public.follows
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users can join a fleet" ON public.follows;
CREATE POLICY "Users can join a fleet" ON public.follows
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);
DROP POLICY IF EXISTS "Users can mutiny from a fleet" ON public.follows;
CREATE POLICY "Users can mutiny from a fleet" ON public.follows
  FOR DELETE TO authenticated USING (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users can respond to fleet requests" ON public.follows;
CREATE POLICY "Users can respond to fleet requests" ON public.follows
  FOR UPDATE TO authenticated USING (auth.uid() = following_id) WITH CHECK (auth.uid() = following_id);

-- Story reactions and unique viewers.
CREATE TABLE IF NOT EXISTS public.story_reactions (
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (story_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.story_views (
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (story_id, viewer_id)
);

ALTER TABLE public.story_reactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view story reactions" ON public.story_reactions;
CREATE POLICY "Users can view story reactions" ON public.story_reactions
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users can react to stories" ON public.story_reactions;
CREATE POLICY "Users can react to stories" ON public.story_reactions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can change story reactions" ON public.story_reactions;
CREATE POLICY "Users can change story reactions" ON public.story_reactions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can remove story reactions" ON public.story_reactions;
CREATE POLICY "Users can remove story reactions" ON public.story_reactions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can record story views" ON public.story_views;
CREATE POLICY "Users can record story views" ON public.story_views
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = viewer_id);
DROP POLICY IF EXISTS "Story owners can view audience counts" ON public.story_views;
CREATE POLICY "Story owners can view audience counts" ON public.story_views
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.stories WHERE stories.id = story_views.story_id AND stories.user_id = auth.uid())
    OR viewer_id = auth.uid()
  );

-- ============================================================================
-- REALTIME PUBLICATION CHANGES — run this block ALONE (select just this
-- section and execute it separately from everything above). ALTER PUBLICATION
-- takes an AccessExclusiveLock and can deadlock against Supabase's Realtime
-- replication worker if it runs inside the same batch/transaction as other
-- DDL. If you still hit "deadlock detected", just re-run this block again —
-- it's a transient lock collision, not a logic error.
-- Each block also checks the target table actually exists first, so running
-- this before the CREATE TABLE statements above (or against a partially
-- migrated database) never throws "relation does not exist".
-- ============================================================================
DO $$
BEGIN
  IF to_regclass('public.messages') IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.notifications') IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.follows') IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'follows') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.follows;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.story_reactions') IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'story_reactions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.story_reactions;
  END IF;
END $$;
