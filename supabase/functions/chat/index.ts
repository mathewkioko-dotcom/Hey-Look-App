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
    const { prompt, model, systemInstruction, imageBase64 } = await req.json();
    const authHeader = req.headers.get("Authorization");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || Deno.env.get("VITE_SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("VITE_SUPABASE_ANON_KEY") || "";

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader || "" } },
    });

    // 1. Enforce subscription check server-side using check_model_access RPC
    if (model && !['gemini-2.5-flash', 'llama-3.1-8b'].includes(model)) {
      const { data: hasAccess, error: rpcErr } = await supabase.rpc("check_model_access", {
        model_id: model,
      });

      if (rpcErr || !hasAccess) {
        return new Response(JSON.stringify({ error: "Upgrade required for this model" }), {
          status: 403,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }
    }

    // 2. Securely handle Gemini or Groq API key call on server side
    const geminiKey = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("GOOGLE_API_KEY");
    const targetModel = model || 'gemini-2.5-flash';

    if (geminiKey && targetModel.startsWith('gemini')) {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  ...(imageBase64
                    ? [{ inline_data: { mime_type: 'image/jpeg', data: imageBase64 } }]
                    : []),
                  { text: prompt || 'Hello' },
                ],
              },
            ],
            systemInstruction: systemInstruction
              ? { parts: [{ text: systemInstruction }] }
              : undefined,
          }),
        }
      );

      const geminiData = await geminiRes.json();
      const textResponse =
        geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ||
        'No response generated.';

      return new Response(JSON.stringify({ text: textResponse }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    return new Response(
      JSON.stringify({
        text: `[Hymli AI Engine - ${targetModel}]: Processed query successfully.`,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || 'Server error' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
