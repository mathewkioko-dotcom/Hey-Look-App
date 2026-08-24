-- Story media bucket + stories table unblock.
-- Run this in your Supabase SQL editor.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

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

-- Enable database INSERT events for the app's real-time notifications.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;

-- One-way fleet membership used by Join Fleet / Mutiny and The Manifest.
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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'story_reactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.story_reactions;
  END IF;
END $$;

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
