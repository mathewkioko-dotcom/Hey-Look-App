import { supabase } from "../lib/supabase";

/**
 * Call Supabase Edge Function Chat Proxy Endpoint (optional external dependency).
 * Returns an empty string on any failure so the caller can fall back to the
 * local @google/genai SDK without breaking the standalone flow.
 */
export async function callChatEdgeProxy(
  prompt: string,
  model: string,
  systemInstruction?: string,
): Promise<string> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token || "";

    const response = await fetch(
      "https://vjgejpcglyadjladwygt.supabase.co/functions/v1/chat",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: accessToken ? `Bearer ${accessToken}` : "",
        },
        body: JSON.stringify({ prompt, model, systemInstruction }),
      },
    );

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error || `Proxy error status ${response.status}`);
    }

    const resJson = await response.json();
    return (
      resJson.text ||
      resJson.response ||
      "No response returned from chat edge function."
    );
  } catch (err: any) {
    console.warn(
      "[ChatService] Edge Proxy unavailable, falling back to local SDK:",
      err,
    );
    return "";
  }
}
