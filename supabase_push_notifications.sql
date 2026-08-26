-- Run this migration in the Supabase SQL editor.
-- Store the matching values in Supabase Edge Function secrets:
-- VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT, PUSH_WEBHOOK_SECRET.
-- Also add the same VAPID public key to Vercel as VITE_VAPID_PUBLIC_KEY.

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can manage their push subscriptions"
  ON public.push_subscriptions FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.notify_push_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  function_url TEXT;
  webhook_secret TEXT;
BEGIN
  SELECT decrypted_secret INTO function_url
  FROM vault.decrypted_secrets
  WHERE name = 'supabase_url';
  function_url := function_url || '/functions/v1/send-push';

  SELECT decrypted_secret INTO webhook_secret
  FROM vault.decrypted_secrets
  WHERE name = 'push_webhook_secret';

  PERFORM net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-push-secret', webhook_secret
    ),
    body := jsonb_build_object('record', row_to_json(NEW)::jsonb)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS send_push_after_message ON public.messages;
CREATE TRIGGER send_push_after_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_push_on_message();

-- Required once in Supabase Vault (replace with your project URL and secret):
-- SELECT vault.create_secret('https://YOUR_PROJECT_REF.supabase.co', 'supabase_url');
-- SELECT vault.create_secret('YOUR_RANDOM_WEBHOOK_SECRET', 'push_webhook_secret');
