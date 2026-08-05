-- ============================================================================
-- HYMLI AI ENTERPRISE COPILOT - SUPABASE DATABASE MIGRATION
-- Adds columns `is_ai` and `is_auto_reply_enabled` to conversations table,
-- creates the conversations table if missing, and seeds the Hymli AI bot profile.
-- ============================================================================

-- 1. Ensure `conversations` table exists with AI metadata columns
CREATE TABLE IF NOT EXISTS public.conversations (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'Conversation',
  is_ai BOOLEAN DEFAULT false,
  is_auto_reply_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add AI columns to existing `conversations` table if it was created previously
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS is_ai BOOLEAN DEFAULT false;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS is_auto_reply_enabled BOOLEAN DEFAULT true;

-- Indexes for high-performance AI thread lookup
CREATE INDEX IF NOT EXISTS idx_conversations_user_ai ON public.conversations(user_id, is_ai);
CREATE INDEX IF NOT EXISTS idx_conversations_partner ON public.conversations(partner_id);

-- 2. Seed Hymli AI Bot User Profile into public.profiles
INSERT INTO public.profiles (
  id,
  username,
  full_name,
  avatar_url,
  bio,
  custom_status,
  last_anchored
) VALUES (
  '00000000-0000-0000-0000-0000000000a1',
  'hymli_ai',
  'Hymli AI',
  'https://api.dicebear.com/7.x/bottts/svg?seed=HymliAI&backgroundColor=0284c7',
  'Executive Fleet Assistant AI - Charting optimal courses for your fleet.',
  'In Focus',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url,
  bio = EXCLUDED.bio,
  custom_status = EXCLUDED.custom_status;

-- 3. RLS Security Policies for Hymli AI Conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;
CREATE POLICY "Users can view their own conversations" ON public.conversations
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = partner_id);

DROP POLICY IF EXISTS "Users can insert their own conversations" ON public.conversations;
CREATE POLICY "Users can insert their own conversations" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own conversations" ON public.conversations;
CREATE POLICY "Users can update their own conversations" ON public.conversations
  FOR UPDATE USING (auth.uid() = user_id);

-- 4. Sync conversation preview automatically when a message is deleted
CREATE OR REPLACE FUNCTION update_last_message_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET last_message = COALESCE(
    (SELECT text FROM messages 
     WHERE conversation_id = OLD.conversation_id 
     ORDER BY created_at DESC LIMIT 1),
    'No messages yet'
  )
  WHERE id = OLD.conversation_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_last_message_delete ON messages;
CREATE TRIGGER trigger_update_last_message_delete
AFTER DELETE ON messages
FOR EACH ROW EXECUTE FUNCTION update_last_message_on_delete();

-- 5. User Subscriptions Table for M-Pesa Multi-Tier Model Access
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  plan_type TEXT DEFAULT 'free',
  tier TEXT DEFAULT 'free',
  status TEXT DEFAULT 'active',
  unlocked_models TEXT[] DEFAULT ARRAY['gemini-2.5-flash', 'llama-3.1-8b'],
  phone_number TEXT,
  amount_paid NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
);

ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'free';

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own subscription" ON public.user_subscriptions;
CREATE POLICY "Users view own subscription" ON public.user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own subscription" ON public.user_subscriptions;
CREATE POLICY "Users manage own subscription" ON public.user_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- 6. RPC Function check_model_access(user_id, model_id)
CREATE OR REPLACE FUNCTION check_model_access(user_id UUID, model_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  is_unlocked BOOLEAN := false;
  sub_record RECORD;
BEGIN
  -- Free models are accessible to everyone
  IF model_id IN ('gemini-2.5-flash', 'llama-3.1-8b') THEN
    RETURN true;
  END IF;

  IF user_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT * INTO sub_record FROM public.user_subscriptions
  WHERE user_subscriptions.user_id = check_model_access.user_id;

  IF sub_record IS NOT NULL AND sub_record.expires_at > NOW() THEN
    IF model_id = ANY(sub_record.unlocked_models) 
       OR '*' = ANY(sub_record.unlocked_models) 
       OR sub_record.plan_type = 'pro_all' 
       OR sub_record.tier IN ('pro', 'master') THEN
      RETURN true;
    END IF;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

