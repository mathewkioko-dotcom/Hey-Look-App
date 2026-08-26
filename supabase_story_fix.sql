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
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 day'),
  CONSTRAINT check_story_privacy_level CHECK (privacy_level IN ('Public', 'Only Me', 'Anchors Only'))
);

ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS privacy_level TEXT NOT NULL DEFAULT 'Public';
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 day');
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
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS mentioned_user_ids UUID[] DEFAULT '{}'::UUID[];

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
  room_id UUID,
  message_id UUID,
  priority TEXT NOT NULL DEFAULT 'normal',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS room_id UUID;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS message_id UUID;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'normal';

ALTER TABLE public.conversation_preferences ADD COLUMN IF NOT EXISTS mentions_only BOOLEAN NOT NULL DEFAULT false;

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

-- Create reaction/view tables before installing triggers that reference them.
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

CREATE TABLE IF NOT EXISTS public.follows (
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CONSTRAINT follows_not_self CHECK (follower_id <> following_id)
);

CREATE OR REPLACE FUNCTION public.create_activity_notification()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE recipient UUID; actor UUID; target UUID; kind_name TEXT; notification_text TEXT;
BEGIN
  IF TG_TABLE_NAME = 'messages' THEN
    IF NEW.room_id IS NOT NULL THEN
      INSERT INTO notifications (recipient_id, actor_id, kind, target_id, message, room_id, message_id, priority)
      SELECT
        members.user_id,
        NEW.sender_id,
        CASE WHEN members.user_id = ANY(COALESCE(NEW.mentioned_user_ids, '{}'::UUID[])) THEN 'group_mention' ELSE 'group_message' END,
        NEW.id,
        COALESCE(NULLIF(NEW.text, ''), CASE WHEN NEW.type = 'video' THEN 'Sent a video' WHEN NEW.type = 'image' THEN 'Sent a photo' ELSE 'Sent a message' END),
        NEW.room_id,
        NEW.id,
        CASE WHEN members.user_id = ANY(COALESCE(NEW.mentioned_user_ids, '{}'::UUID[])) THEN 'high' ELSE 'normal' END
      FROM room_members AS members
      LEFT JOIN conversation_preferences AS preferences
        ON preferences.conversation_id = NEW.room_id::TEXT
       AND preferences.user_id = members.user_id
      WHERE members.room_id = NEW.room_id
        AND members.user_id <> NEW.sender_id
        AND (
          (
            COALESCE(preferences.muted_until, 'epoch'::TIMESTAMPTZ) <= NOW()
            AND NOT COALESCE(preferences.mentions_only, false)
          )
          OR members.user_id = ANY(COALESCE(NEW.mentioned_user_ids, '{}'::UUID[]))
        );
      RETURN NEW;
    END IF;
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
    INSERT INTO notifications (recipient_id, actor_id, kind, target_id, message, message_id, priority)
    VALUES (recipient, actor, kind_name, target, notification_text, target, 'high');
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

-- Group chats & channels (WhatsApp/Telegram-style). Group creation was
-- previously 100% fake UI (GroupManagementModal used local sample arrays,
-- nothing ever persisted) — these tables make it real.
CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'group' CHECK (type IN ('group', 'channel')),
  name TEXT NOT NULL,
  avatar_url TEXT,
  description TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  member_visibility TEXT NOT NULL DEFAULT 'everyone'
);

ALTER TABLE public.chat_rooms ADD COLUMN IF NOT EXISTS member_visibility TEXT NOT NULL DEFAULT 'everyone';
ALTER TABLE public.chat_rooms DROP CONSTRAINT IF EXISTS chat_rooms_member_visibility_check;
ALTER TABLE public.chat_rooms ADD CONSTRAINT chat_rooms_member_visibility_check CHECK (member_visibility IN ('everyone', 'admins_only'));

CREATE TABLE IF NOT EXISTS public.room_members (
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (room_id, user_id)
);

ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.is_room_member(p_room_id UUID, p_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.room_members
    WHERE room_id = p_room_id AND user_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_room_admin(p_room_id UUID, p_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.room_members
    WHERE room_id = p_room_id AND user_id = p_user_id AND role = 'admin'
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_room_member(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_room_admin(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_room_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_room_admin(UUID, UUID) TO authenticated;

DROP POLICY IF EXISTS "Members can view their rooms" ON public.chat_rooms;
CREATE POLICY "Members can view their rooms" ON public.chat_rooms
  FOR SELECT TO authenticated USING (
    created_by = auth.uid() OR public.is_room_member(id, auth.uid())
  );
DROP POLICY IF EXISTS "Users can create rooms" ON public.chat_rooms;
CREATE POLICY "Users can create rooms" ON public.chat_rooms
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
DROP POLICY IF EXISTS "Admins can update rooms" ON public.chat_rooms;
CREATE POLICY "Admins can update rooms" ON public.chat_rooms
  FOR UPDATE TO authenticated USING (
    public.is_room_admin(id, auth.uid())
  ) WITH CHECK (
    public.is_room_admin(id, auth.uid())
  );
DROP POLICY IF EXISTS "Admins can delete rooms" ON public.chat_rooms;
CREATE POLICY "Admins can delete rooms" ON public.chat_rooms
  FOR DELETE TO authenticated USING (
    created_by = auth.uid() OR public.is_room_admin(id, auth.uid())
  );

ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members can view room membership" ON public.room_members;
CREATE POLICY "Members can view room membership" ON public.room_members
  FOR SELECT TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.chat_rooms
      WHERE chat_rooms.id = room_members.room_id
        AND (
          chat_rooms.member_visibility = 'everyone' AND public.is_room_member(room_members.room_id, auth.uid())
          OR chat_rooms.member_visibility = 'admins_only' AND public.is_room_admin(room_members.room_id, auth.uid())
        )
    )
  );
-- (INSERT policy for room_members is defined further below, once the
-- allow_add_members column exists on chat_rooms, so it can factor that in.)
DROP POLICY IF EXISTS "Admins can update member roles" ON public.room_members;
CREATE POLICY "Admins can update member roles" ON public.room_members
  FOR UPDATE TO authenticated USING (
    public.is_room_admin(room_id, auth.uid())
  ) WITH CHECK (
    public.is_room_admin(room_id, auth.uid())
  );
DROP POLICY IF EXISTS "Members can leave or admins can remove" ON public.room_members;
CREATE POLICY "Members can leave or admins can remove" ON public.room_members
  FOR DELETE TO authenticated USING (
    auth.uid() = user_id
    OR public.is_room_admin(room_id, auth.uid())
  );

-- Group/channel messages reuse the existing `messages` table (room_id set,
-- receiver_id NULL) instead of a parallel table, so existing 1:1 DM rows and
-- policies are completely untouched — these changes only ADD visibility/
-- insert rights for room members, they never narrow the existing DM rules.
ALTER TABLE public.messages ALTER COLUMN receiver_id DROP NOT NULL;

-- Real group/channel settings that GroupManagementModal used to fake with
-- local-only sample state: permissions, announcement mode, rules, invite
-- link, media policy.
ALTER TABLE public.chat_rooms ADD COLUMN IF NOT EXISTS rules TEXT;
ALTER TABLE public.chat_rooms ADD COLUMN IF NOT EXISTS enforce_rules BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.chat_rooms ADD COLUMN IF NOT EXISTS allow_edit_info BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.chat_rooms ADD COLUMN IF NOT EXISTS allow_send BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.chat_rooms ADD COLUMN IF NOT EXISTS allow_add_members BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.chat_rooms ADD COLUMN IF NOT EXISTS allow_pin BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.chat_rooms ADD COLUMN IF NOT EXISTS announcement_mode BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.chat_rooms ADD COLUMN IF NOT EXISTS max_upload_mb INTEGER NOT NULL DEFAULT 100;
ALTER TABLE public.chat_rooms ADD COLUMN IF NOT EXISTS auto_delete_media TEXT NOT NULL DEFAULT 'Never';
ALTER TABLE public.chat_rooms DROP CONSTRAINT IF EXISTS chat_rooms_auto_delete_check;
ALTER TABLE public.chat_rooms ADD CONSTRAINT chat_rooms_auto_delete_check CHECK (auto_delete_media IN ('Never', 'After 30 days', 'After 90 days', 'After 1 year'));
ALTER TABLE public.chat_rooms ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE;

ALTER TABLE public.room_members ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT false;

-- Pending join requests (used by "Pending Approvals" + invite-link joining).
CREATE TABLE IF NOT EXISTS public.room_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (room_id, user_id)
);
ALTER TABLE public.room_join_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins and requester can view join requests" ON public.room_join_requests;
CREATE POLICY "Admins and requester can view join requests" ON public.room_join_requests
  FOR SELECT TO authenticated USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.room_members WHERE room_members.room_id = room_join_requests.room_id AND room_members.user_id = auth.uid() AND room_members.role = 'admin')
  );
DROP POLICY IF EXISTS "Users can request to join" ON public.room_join_requests;
CREATE POLICY "Users can request to join" ON public.room_join_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can decide join requests" ON public.room_join_requests;
CREATE POLICY "Admins can decide join requests" ON public.room_join_requests
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.room_members WHERE room_members.room_id = room_join_requests.room_id AND room_members.user_id = auth.uid() AND room_members.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.room_members WHERE room_members.room_id = room_join_requests.room_id AND room_members.user_id = auth.uid() AND room_members.role = 'admin')
  );
DROP POLICY IF EXISTS "Requester or admin can delete a join request" ON public.room_join_requests;
CREATE POLICY "Requester or admin can delete a join request" ON public.room_join_requests
  FOR DELETE TO authenticated USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.room_members WHERE room_members.room_id = room_join_requests.room_id AND room_members.user_id = auth.uid() AND room_members.role = 'admin')
  );

-- Group event planner.
CREATE TABLE IF NOT EXISTS public.room_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  event_date TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.room_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members can view room events" ON public.room_events;
CREATE POLICY "Members can view room events" ON public.room_events
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.room_members WHERE room_members.room_id = room_events.room_id AND room_members.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "Members can create room events" ON public.room_events;
CREATE POLICY "Members can create room events" ON public.room_events
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (SELECT 1 FROM public.room_members WHERE room_members.room_id = room_events.room_id AND room_members.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "Creators and admins can update room events" ON public.room_events;
CREATE POLICY "Creators and admins can update room events" ON public.room_events
  FOR UPDATE TO authenticated USING (
    auth.uid() = created_by
    OR EXISTS (SELECT 1 FROM public.room_members WHERE room_members.room_id = room_events.room_id AND room_members.user_id = auth.uid() AND room_members.role = 'admin')
  ) WITH CHECK (
    auth.uid() = created_by
    OR EXISTS (SELECT 1 FROM public.room_members WHERE room_members.room_id = room_events.room_id AND room_members.user_id = auth.uid() AND room_members.role = 'admin')
  );
DROP POLICY IF EXISTS "Creators and admins can delete room events" ON public.room_events;
CREATE POLICY "Creators and admins can delete room events" ON public.room_events
  FOR DELETE TO authenticated USING (
    auth.uid() = created_by
    OR EXISTS (SELECT 1 FROM public.room_members WHERE room_members.room_id = room_events.room_id AND room_members.user_id = auth.uid() AND room_members.role = 'admin')
  );

CREATE TABLE IF NOT EXISTS public.room_event_rsvps (
  event_id UUID NOT NULL REFERENCES public.room_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'going' CHECK (status IN ('going', 'not_going')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (event_id, user_id)
);
ALTER TABLE public.room_event_rsvps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members can view RSVPs" ON public.room_event_rsvps;
CREATE POLICY "Members can view RSVPs" ON public.room_event_rsvps
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.room_events
      JOIN public.room_members ON room_members.room_id = room_events.room_id
      WHERE room_events.id = room_event_rsvps.event_id AND room_members.user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "Users can RSVP for themselves" ON public.room_event_rsvps;
CREATE POLICY "Users can RSVP for themselves" ON public.room_event_rsvps
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can change their own RSVP" ON public.room_event_rsvps;
CREATE POLICY "Users can change their own RSVP" ON public.room_event_rsvps
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read their messages" ON public.messages;
CREATE POLICY "Users can read their messages" ON public.messages
  FOR SELECT TO authenticated
  USING (
    auth.uid() = sender_id
    OR auth.uid() = receiver_id
    OR (room_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.room_members WHERE room_members.room_id = messages.room_id AND room_members.user_id = auth.uid()
    ))
  );

-- Enforces Channels (admin-only posting), Announcement Mode (admin-only
-- posting in an otherwise normal group), and the "Send Messages" permission
-- toggle — all server-side via RLS, not just hidden in the UI.
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND (
      NOT EXISTS (SELECT 1 FROM public.chat_rooms WHERE chat_rooms.id = messages.room_id)
      OR EXISTS (
        SELECT 1 FROM public.room_members, public.chat_rooms
        WHERE room_members.room_id = messages.room_id
          AND chat_rooms.id = messages.room_id
          AND room_members.user_id = auth.uid()
          AND (
            room_members.role = 'admin'
            OR (chat_rooms.type <> 'channel' AND NOT chat_rooms.announcement_mode AND chat_rooms.allow_send)
          )
      )
    )
  );

-- Members can only add other members when the room allows it (or they're an
-- admin/the creator, who can always add regardless of the toggle).
DROP POLICY IF EXISTS "Creators and admins can add members" ON public.room_members;
CREATE POLICY "Creators and admins can add members" ON public.room_members
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.chat_rooms WHERE chat_rooms.id = room_members.room_id AND chat_rooms.created_by = auth.uid())
    OR public.is_room_admin(room_id, auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.chat_rooms
      WHERE chat_rooms.id = room_members.room_id
        AND public.is_room_member(room_id, auth.uid())
        AND chat_rooms.allow_add_members
    )
  );

-- Beacons (ephemeral "story" posts) — table never existed before, so every
-- Beacon insert was silently failing and the anchored-to-chat feature only
-- ever lived in localStorage, invisible to the other person in the chat.
CREATE TABLE IF NOT EXISTS public.beacons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL DEFAULT 'text' CHECK (media_type IN ('image', 'video', 'audio', 'text')),
  content_url TEXT,
  text_content TEXT,
  bg_gradient TEXT,
  custom_hex TEXT,
  font_family TEXT,
  caption_font_family TEXT,
  audio_visualizer TEXT,
  is_one_time BOOLEAN NOT NULL DEFAULT false,
  ttl_setting TEXT NOT NULL DEFAULT '24h',
  allow_public_comments BOOLEAN NOT NULL DEFAULT true,
  audience TEXT NOT NULL DEFAULT 'Everyone' CHECK (audience IN ('Everyone', 'Contacts Only', 'This Chat Only')),
  shared_with_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.beacons ADD COLUMN IF NOT EXISTS audience TEXT NOT NULL DEFAULT 'Everyone';
ALTER TABLE public.beacons DROP CONSTRAINT IF EXISTS beacons_audience_check;
ALTER TABLE public.beacons ADD CONSTRAINT beacons_audience_check CHECK (audience IN ('Everyone', 'Contacts Only', 'This Chat Only'));
ALTER TABLE public.beacons ADD COLUMN IF NOT EXISTS shared_with_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.beacons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Beacons visible to selected audience" ON public.beacons;
CREATE POLICY "Beacons visible to selected audience" ON public.beacons
  FOR SELECT TO authenticated USING (
    auth.uid() = user_id
    OR audience = 'Everyone'
    OR (audience = 'This Chat Only' AND auth.uid() = shared_with_user_id)
    OR (audience = 'Contacts Only' AND EXISTS (
      SELECT 1 FROM public.follows
      WHERE status = 'accepted'
        AND ((follower_id = auth.uid() AND following_id = beacons.user_id)
          OR (follower_id = beacons.user_id AND following_id = auth.uid()))
    ))
  );
DROP POLICY IF EXISTS "Users can create their own beacons" ON public.beacons;
CREATE POLICY "Users can create their own beacons" ON public.beacons
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own beacons" ON public.beacons;
CREATE POLICY "Users can update own beacons" ON public.beacons
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own beacons" ON public.beacons;
CREATE POLICY "Users can delete own beacons" ON public.beacons
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.beacon_views (
  beacon_id UUID NOT NULL REFERENCES public.beacons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (beacon_id, user_id)
);
ALTER TABLE public.beacon_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can record beacon views" ON public.beacon_views;
CREATE POLICY "Users can record beacon views" ON public.beacon_views
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own beacon views" ON public.beacon_views;
CREATE POLICY "Users can update their own beacon views" ON public.beacon_views
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Beacon owners and viewers can see views" ON public.beacon_views;
CREATE POLICY "Beacon owners and viewers can see views" ON public.beacon_views
  FOR SELECT TO authenticated USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.beacons WHERE beacons.id = beacon_views.beacon_id AND beacons.user_id = auth.uid())
  );

CREATE TABLE IF NOT EXISTS public.beacon_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  beacon_id UUID NOT NULL REFERENCES public.beacons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL DEFAULT '',
  is_private_dm BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.beacon_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view beacon comments" ON public.beacon_comments;
CREATE POLICY "Authenticated users can view beacon comments" ON public.beacon_comments FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users can comment on beacons" ON public.beacon_comments;
CREATE POLICY "Users can comment on beacons" ON public.beacon_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Cross-device anchored beacon per 1:1 chat, keyed by an ORDERED user pair so
-- both participants resolve to the same row regardless of who anchored it or
-- which side's local conversation id they're viewing from.
CREATE TABLE IF NOT EXISTS public.beacon_anchors (
  user_a_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_b_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  beacon_id UUID NOT NULL REFERENCES public.beacons(id) ON DELETE CASCADE,
  anchored_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_a_id, user_b_id),
  CONSTRAINT beacon_anchors_ordered CHECK (user_a_id < user_b_id)
);
ALTER TABLE public.beacon_anchors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Chat participants can view anchored beacon" ON public.beacon_anchors;
CREATE POLICY "Chat participants can view anchored beacon" ON public.beacon_anchors
  FOR SELECT TO authenticated USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);
DROP POLICY IF EXISTS "Chat participants can set anchored beacon" ON public.beacon_anchors;
CREATE POLICY "Chat participants can set anchored beacon" ON public.beacon_anchors
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_a_id OR auth.uid() = user_b_id);
DROP POLICY IF EXISTS "Chat participants can update anchored beacon" ON public.beacon_anchors;
CREATE POLICY "Chat participants can update anchored beacon" ON public.beacon_anchors
  FOR UPDATE TO authenticated USING (auth.uid() = user_a_id OR auth.uid() = user_b_id) WITH CHECK (auth.uid() = user_a_id OR auth.uid() = user_b_id);
DROP POLICY IF EXISTS "Chat participants can clear anchored beacon" ON public.beacon_anchors;
CREATE POLICY "Chat participants can clear anchored beacon" ON public.beacon_anchors
  FOR DELETE TO authenticated USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);

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

DO $$
BEGIN
  IF to_regclass('public.beacon_anchors') IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'beacon_anchors') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.beacon_anchors;
  END IF;
END $$;
