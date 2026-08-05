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

-- ----------------------------------------------------------------------------
-- 2. MESSAGES & NAUTICAL DELIVERY STATE VECTOR & VANISHING ENGINE
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  text TEXT,
  type TEXT DEFAULT 'text',
  image_url TEXT,
  is_encrypted BOOLEAN DEFAULT true,
  reply_to_id UUID,
  reply_preview JSONB,
  call_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
