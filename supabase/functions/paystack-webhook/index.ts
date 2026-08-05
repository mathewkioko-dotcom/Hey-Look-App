import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const body = await req.json();

    if (body?.event === "charge.success" || body?.status === "success") {
      const data = body?.data || body;
      const metadata = data?.metadata || {};
      const { user_id, days = 30, plan_type = "monthly" } = metadata;
      const userEmail = data?.customer?.email || data?.email;

      const supabaseUrl = Deno.env.get("SUPABASE_URL") || Deno.env.get("VITE_SUPABASE_URL") || "";
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("VITE_SUPABASE_ANON_KEY") || "";

      if (supabaseUrl && supabaseKey) {
        const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

        let targetUserId = user_id;

        // If user_id missing, try looking up profile by email
        if (!targetUserId && userEmail) {
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .ilike('username', userEmail.split('@')[0])
            .maybeSingle();

          targetUserId = profile?.id;
        }

        if (targetUserId) {
          // Calculate exact expiration timestamp down to the second
          const durationDays = Number(days) || 30;
          const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

          await supabaseAdmin.from("user_subscriptions").upsert({
            user_id: targetUserId,
            plan_type: plan_type || "monthly",
            tier: durationDays >= 365 ? "master" : "pro",
            status: "active",
            unlocked_models: ["gemini-2.5-flash", "llama-3.1-8b", "gpt-4o-mini", "claude-3-5-sonnet"],
            amount_paid: data?.amount ? data.amount / 100 : 500,
            updated_at: new Date().toISOString(),
            expires_at: expiresAt,
          }, { onConflict: "user_id" });
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err: any) {
    console.error('[paystack-webhook] Error:', err);
    return new Response(JSON.stringify({ error: err?.message || 'Webhook failed' }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
