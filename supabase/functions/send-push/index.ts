import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, x-push-secret",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const configuredSecret = Deno.env.get("PUSH_WEBHOOK_SECRET");
  if (!configuredSecret || request.headers.get("x-push-secret") !== configuredSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  try {
    const payload = await request.json();
    const message = payload.record || payload.message;
    if (!message?.sender_id || (!message.receiver_id && !message.room_id)) {
      return new Response(JSON.stringify({ skipped: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const mentionedUserIds = Array.isArray(message.mentioned_user_ids) ? message.mentioned_user_ids : [];
    let recipientIds = message.room_id
      ? ((await supabase.from("room_members").select("user_id").eq("room_id", message.room_id)).data || []).map((row: { user_id: string }) => row.user_id).filter((userId: string) => userId !== message.sender_id)
      : [message.receiver_id];

    if (message.room_id && recipientIds.length) {
      const { data: preferences } = await supabase
        .from("conversation_preferences")
        .select("user_id, muted_until, mentions_only")
        .eq("conversation_id", message.room_id)
        .in("user_id", recipientIds);
      const preferenceMap = new Map((preferences || []).map((preference: { user_id: string; muted_until: string | null; mentions_only: boolean }) => [preference.user_id, preference]));
      const now = Date.now();
      recipientIds = recipientIds.filter((userId: string) => {
        if (mentionedUserIds.includes(userId)) return true;
        const preference = preferenceMap.get(userId);
        const muted = preference?.muted_until ? new Date(preference.muted_until).getTime() > now : false;
        return !muted && !preference?.mentions_only;
      });
    }

    if (!recipientIds.length) {
      return new Response(JSON.stringify({ skipped: true, reason: "all recipients muted" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("id, user_id, endpoint, p256dh, auth")
      .in("user_id", recipientIds);
    if (error) throw error;

    const { data: sender } = await supabase
      .from("profiles")
      .select("full_name, username, avatar_url")
      .eq("id", message.sender_id)
      .maybeSingle();

    const { data: room } = message.room_id
      ? await supabase.from("chat_rooms").select("name").eq("id", message.room_id).maybeSingle()
      : { data: null };

    webpush.setVapidDetails(
      Deno.env.get("VAPID_SUBJECT") || "mailto:admin@example.com",
      Deno.env.get("VAPID_PUBLIC_KEY")!,
      Deno.env.get("VAPID_PRIVATE_KEY")!,
    );

    const senderName = sender?.full_name || sender?.username || "A HeyLook user";
    const body = message.text || message.content || (message.type === "video" ? "Sent you a video" : message.type === "image" ? "Sent you a photo" : "Sent you a message");
    const results = await Promise.allSettled((subscriptions || []).map(async (subscription) => {
      try {
        await webpush.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, JSON.stringify({
          title: message.room_id ? `${room?.name || "Group"} · ${senderName}` : `New message from ${senderName}`,
          body: message.room_id && mentionedUserIds.includes(subscription.user_id) ? `Mentioned you: ${body}` : body,
          icon: sender?.avatar_url || "/pwa-192x192.png",
          url: message.room_id ? `/?room=${message.room_id}` : "/",
          tag: message.room_id ? `group-${message.room_id}` : `message-${message.id}`,
          renotify: message.priority === "high" || mentionedUserIds.includes(subscription.user_id),
        }));
      } catch (error: any) {
        if (error?.statusCode === 404 || error?.statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("id", subscription.id);
        }
        throw error;
      }
    }));

    return new Response(JSON.stringify({ sent: results.filter((result) => result.status === "fulfilled").length }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    console.error("send-push error", error);
    return new Response(JSON.stringify({ error: error?.message || "Push delivery failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
