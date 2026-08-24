-- ============================================================================
-- HEYLOOK NAUTICAL SOCIAL PLATFORM - PRODUCTION SUPABASE SQL MIGRATION
-- Architecture: Nautical Presence Engine, Message Delivery State Vector,
-- Vanishing Engine (pg_cron), 6-State Reactions, Polls & Canvas Gradients,
-- Reshare Engine, and Infinite Threaded Comments.
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- ----------------------------------------------------------------------------
-- 1. NAUTICAL PRESENCE ENGINE (PROFILES TABLE)
-- ----------------------------------------------------------------------------

-- Ensure public.profiles table exists
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drop legacy online/seen columns if present
ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_online;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS last_seen;

-- Inject nautical presence state columns with strict check constraint
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS custom_status TEXT DEFAULT 'In Focus';
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS check_custom_status_nautical;
ALTER TABLE public.profiles ADD CONSTRAINT check_custom_status_nautical 
  CHECK (custom_status IN ('In Focus', 'Adrift', 'Last Anchored'));

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_anchored TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Trigger function to auto-initialize profiles upon auth registration
CREATE OR REPLACE FUNCTION public.handle_new_user_presence()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url, custom_status, last_anchored)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || SUBSTRING(NEW.id::text FROM 1 FOR 8)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Nautical Explorer'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'),
    'In Focus',
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET custom_status = 'In Focus',
      last_anchored = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created_presence ON auth.users;
CREATE TRIGGER on_auth_user_created_presence
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_presence();

-- Create posts before dependent reaction tables.
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT,
  image_url TEXT,
  feeling_tag TEXT,
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  shares_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. MESSAGES & NAUTICAL DELIVERY STATE VECTOR & VANISHING ENGINE
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT,
  text TEXT,
  status SMALLINT DEFAULT 1,
  is_read BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  type TEXT DEFAULT 'text',
  image_url TEXT,
  video_url TEXT,
  audio_url TEXT,
  audio_duration TEXT,
  is_encrypted BOOLEAN DEFAULT true,
  reply_to_id UUID,
  reply_preview JSONB,
  call_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  edited_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS room_id UUID;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS status SMALLINT DEFAULT 1;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS check_messages_status_range;
ALTER TABLE public.messages ADD CONSTRAINT check_messages_status_range
  CHECK (status IN (0, 1, 2, 3));

CREATE INDEX IF NOT EXISTS idx_messages_room_id ON public.messages(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON public.messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON public.messages(is_read);

-- Ensure audio_url / audio_duration columns exist for voice note messaging
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS audio_url TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS audio_duration TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS video_url TEXT;

-- STORAGE BUCKET: chat-media
-- Create this public bucket for photo and video messages.
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated users can upload chat media" ON storage.objects;
CREATE POLICY "Authenticated users can upload chat media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat-media');

DROP POLICY IF EXISTS "Anyone can read chat media" ON storage.objects;
CREATE POLICY "Anyone can read chat media"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'chat-media');

-- STORAGE BUCKET: story-media
-- Create this public bucket for story images.
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

-- ==============================================================
-- STORAGE BUCKET: voice-notes
-- Create a public storage bucket for voice note audio clips.
-- Run this in the Supabase Dashboard -> Storage -> New Bucket,
-- set name = "voice-notes" and Public = ON, OR use the SQL below.
-- ==============================================================
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('voice-notes', 'voice-notes', true)
-- ON CONFLICT (id) DO NOTHING;

-- Delivery state vector: 0 = Stranded, 1 = Launched, 2 = Docked, 3 = Submerged
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS delivery_state SMALLINT DEFAULT 1;
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS check_delivery_state_range;
ALTER TABLE public.messages ADD CONSTRAINT check_delivery_state_range 
  CHECK (delivery_state IN (0, 1, 2, 3));

-- Vanishing Engine Timestamp column
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS burn_at TIMESTAMP WITH TIME ZONE NULL;

-- Optimized Index for Vanishing Message Purge
CREATE INDEX IF NOT EXISTS idx_messages_burn_at ON public.messages(burn_at) WHERE burn_at IS NOT NULL;

-- High-performance pg_cron purging job executing every 60 seconds
SELECT cron.schedule(
  'purge_vanishing_messages_job',
  '* * * * *',
  $$ DELETE FROM public.messages WHERE burn_at IS NOT NULL AND burn_at < NOW() $$
);

-- ----------------------------------------------------------------------------
-- 3. 6-STATE CONTENT REACTION STREAM (LIKES TABLE)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL DEFAULT 'Like',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_reaction_type CHECK (reaction_type IN ('Like', 'Love', 'Haha', 'Wow', 'Sad', 'Angry')),
  CONSTRAINT unique_user_post_reaction UNIQUE (post_id, user_id)
);

-- Index for real-time reaction counting
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON public.likes(post_id);

-- ----------------------------------------------------------------------------
-- 4. PUBLISHING COMPOSER, CANVAS GRADIENTS, POLLS, PRIVACY & RESHARES
-- ----------------------------------------------------------------------------

-- Stories are visible according to the author's selected audience.
CREATE TABLE IF NOT EXISTS public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  privacy_level TEXT NOT NULL DEFAULT 'Public',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_story_privacy_level CHECK (privacy_level IN ('Public', 'Only Me', 'Anchors Only'))
);

ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS privacy_level TEXT NOT NULL DEFAULT 'Public';
ALTER TABLE public.stories DROP CONSTRAINT IF EXISTS check_story_privacy_level;
ALTER TABLE public.stories ADD CONSTRAINT check_story_privacy_level
  CHECK (privacy_level IN ('Public', 'Only Me', 'Anchors Only'));

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Stories visible to selected audience" ON public.stories;
CREATE POLICY "Stories visible to selected audience" ON public.stories
  FOR SELECT TO authenticated
  USING (privacy_level IN ('Public', 'Anchors Only') OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own stories" ON public.stories;
CREATE POLICY "Users can create their own stories" ON public.stories
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Text Canvas Gradient layout code column
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS background_style TEXT NULL;

-- Interactive Consensus Poll JSONB data layout
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS poll_data JSONB NULL;

-- Privacy Scoping Level
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS privacy_level TEXT DEFAULT 'Public';
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS check_privacy_level;
ALTER TABLE public.posts ADD CONSTRAINT check_privacy_level 
  CHECK (privacy_level IN ('Public', 'Only Me', 'Anchors Only'));

-- Self-referencing foreign key for Reshare Engine
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS shared_post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL;

-- RLS Policy for Privacy Level 'Only Me'
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public and Authorized Post Visibility" ON public.posts;
CREATE POLICY "Public and Authorized Post Visibility" ON public.posts
  FOR SELECT
  USING (
    privacy_level = 'Public' OR
    (privacy_level = 'Only Me' AND auth.uid() = user_id) OR
    (privacy_level = 'Anchors Only' AND auth.role() = 'authenticated')
  );

-- ----------------------------------------------------------------------------
-- 5. INFINITE THREADED COMMENT TREE MATRIX
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Self-referencing foreign key for infinite nested comment tree
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id);

-- ----------------------------------------------------------------------------
-- 5b. MESSAGE ACTION ENGINE TABLES
--      1. message_reactions   - emoji reactions on messages w/ sub-categories
--      2. starred_messages    - bookmarked messages in named collections
--      3. message_reports     - moderation reports (Spam / Harassment / Misinformation)
--      4. message_edit_history- revision log for edited messages
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL DEFAULT '👍',
  category TEXT NOT NULL DEFAULT 'frequently_used',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_reaction_category CHECK (
    category IN ('frequently_used', 'animals', 'objects')
  ),
  CONSTRAINT unique_message_user_reaction UNIQUE (message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON public.message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user ON public.message_reactions(user_id);

CREATE TABLE IF NOT EXISTS public.starred_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  collection TEXT NOT NULL DEFAULT 'Read Later',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_star_collection CHECK (
    collection IN ('Work', 'Personal', 'Read Later')
  ),
  CONSTRAINT unique_user_star UNIQUE (message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_starred_messages_user ON public.starred_messages(user_id);

CREATE TABLE IF NOT EXISTS public.message_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL DEFAULT 'Spam',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_report_reason CHECK (
    reason IN ('Spam', 'Harassment', 'Misinformation')
  )
);

CREATE INDEX IF NOT EXISTS idx_message_reports_message ON public.message_reports(message_id);

CREATE TABLE IF NOT EXISTS public.message_edit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  previous_text TEXT NOT NULL,
  edited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_edit_history_message ON public.message_edit_history(message_id);

-- Pinned status column on messages (none pinned is NULL)
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS pin_expires_at TIMESTAMP WITH TIME ZONE NULL;

-- ----------------------------------------------------------------------------
-- 6. RPC TRANSACTION FUNCTIONS
-- ----------------------------------------------------------------------------

-- RPC to safely update user presence status and timestamp
CREATE OR REPLACE FUNCTION public.update_user_presence(p_user_id UUID, p_status TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET custom_status = p_status,
      last_anchored = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC to advance message delivery state to Submerged (State 3 - Read)
CREATE OR REPLACE FUNCTION public.mark_message_submerged(p_message_id UUID, p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.messages
  SET delivery_state = 3
  WHERE id = p_message_id AND receiver_id = p_user_id AND delivery_state < 3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC for transactional single-vote poll consensus casting
CREATE OR REPLACE FUNCTION public.cast_poll_vote(p_post_id UUID, p_option_id TEXT, p_user_id TEXT)
RETURNS JSONB AS $$
DECLARE
  v_poll_data JSONB;
  v_updated_options JSONB;
BEGIN
  SELECT poll_data INTO v_poll_data FROM public.posts WHERE id = p_post_id;
  
  IF v_poll_data IS NULL THEN
    RAISE EXCEPTION 'Post does not contain poll data';
  END IF;

  -- Remove user_id from all existing options to prevent double-voting
  SELECT jsonb_agg(
    jsonb_set(
      opt,
      '{votes}',
      CASE 
        WHEN (opt->>'id') = p_option_id THEN
          -- Add user_id if this option is selected
          (
            SELECT jsonb_agg(DISTINCT elem)
            FROM jsonb_array_elements_text(
              (opt->'votes') - p_user_id || jsonb_build_array(p_user_id)
            ) AS elem
          )
        ELSE
          -- Scrub user_id from alternate options
          COALESCE((opt->'votes') - p_user_id, '[]'::jsonb)
      END
    )
  ) INTO v_updated_options
  FROM jsonb_array_elements(v_poll_data->'options') AS opt;

  -- Build final poll object and update post row
  v_poll_data := jsonb_set(v_poll_data, '{options}', v_updated_options);
  
  UPDATE public.posts
  SET poll_data = v_poll_data
  WHERE id = p_post_id;

  RETURN v_poll_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 7. CHAT INFO DRAWER ENGINES
--     1. conversation_preferences - per-room overrides (mute, timer, wallpaper,
--                                   lock, block)
--     2. conversation_groups      - shared-group memberships
--     3. conversation_reports     - multi-step Block & Report submissions
--     4. conversation_media_index - lightweight index for Media, Links & Docs
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.conversation_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  muted_until TIMESTAMP WITH TIME ZONE NULL,
  disappearing_timer TEXT DEFAULT 'Off',
  wallpaper JSONB NULL,
  is_locked BOOLEAN DEFAULT false,
  lock_config JSONB NULL,
  is_blocked BOOLEAN DEFAULT false,
  block_reason TEXT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_disappearing_timer CHECK (
    disappearing_timer IN ('Off', '24 Hours', '7 Days', '90 Days')
  ),
  CONSTRAINT unique_user_conversation_pref UNIQUE (conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conversation_prefs_user ON public.conversation_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_prefs_conv ON public.conversation_preferences(conversation_id);

CREATE TABLE IF NOT EXISTS public.conversation_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  group_name TEXT NOT NULL,
  group_avatar TEXT NULL,
  members_count INT DEFAULT 0,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversation_groups_user ON public.conversation_groups(user_id);

CREATE TABLE IF NOT EXISTS public.conversation_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id TEXT NOT NULL,
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  reasons TEXT[],          -- Reason Checklist
  delete_chat BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RPC to upsert conversation preferences (returns the stored row)
CREATE OR REPLACE FUNCTION public.upsert_conversation_preferences(
  p_conversation_id TEXT,
  p_user_id UUID,
  p_muted_until TIMESTAMP WITH TIME Zone,
  p_disappearing_timer TEXT,
  p_wallpaper JSONB,
  p_is_locked BOOLEAN,
  p_lock_config JSONB,
  p_is_blocked BOOLEAN,
  p_block_reason TEXT
) RETURNS JSONB AS $$
DECLARE v_row JSONB;
BEGIN
  INSERT INTO public.conversation_preferences AS cp (
    conversation_id, user_id, muted_until, disappearing_timer, wallpaper,
    is_locked, lock_config, is_blocked, block_reason, updated_at
  ) VALUES (
    p_conversation_id, p_user_id, p_muted_until, p_disappearing_timer,
    p_wallpaper, p_is_locked, p_lock_config, p_is_blocked, p_block_reason, NOW()
  )
  ON CONFLICT (conversation_id, user_id) DO UPDATE SET
    muted_until = EXCLUDED.muted_until,
    disappearing_timer = EXCLUDED.disappearing_timer,
    wallpaper = EXCLUDED.wallpaper,
    is_locked = EXCLUDED.is_locked,
    lock_config = EXCLUDED.lock_config,
    is_blocked = EXCLUDED.is_blocked,
    block_reason = EXCLUDED.block_reason,
    updated_at = NOW()
  RETURNING to_jsonb(cp) INTO v_row;

  RETURN v_row;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
