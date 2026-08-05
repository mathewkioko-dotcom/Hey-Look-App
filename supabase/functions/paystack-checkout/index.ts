import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY");

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
    const { user_id, email, plan_type } = await req.json();

    // Pricing matrix mapping
    const pricing: Record<string, { amount: number; days: number }> = {
      weekly: { amount: 15000, days: 7 },    // KSH 150
      monthly: { amount: 50000, days: 30 },  // KSH 500
      yearly: { amount: 480000, days: 365 }, // KSH 4,800
    };

    const selectedPlan = pricing[plan_type] || pricing["monthly"];

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email || "user@hymli.com",
        amount: selectedPlan.amount,
        currency: "KES",
        channels: ["mobile_money", "card"], // Enables both M-Pesa STK Push and Card payment tabs
        metadata: {
          user_id,
          plan_type,
          days: selectedPlan.days,
        },
      }),
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Server error' }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
});
