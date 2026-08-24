import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
// The Twilio phone number you purchased — used as the caller ID for both legs.
const TWILIO_FROM_NUMBER = "+254727940136";

const CORS_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const E164_PATTERN = /^\+[1-9]\d{6,14}$/;

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      throw new Error("Twilio credentials are not configured on the server.");
    }

    // toNumber: the recipient's real phone (Twilio dials this first).
    // callerNumber: the caller's real phone (bridged in once the recipient answers).
    const { toNumber, callerNumber } = await req.json();

    if (!toNumber || !E164_PATTERN.test(toNumber)) {
      throw new Error("A valid E.164 recipient phone number is required.");
    }
    if (!callerNumber || !E164_PATTERN.test(callerNumber)) {
      throw new Error("A valid E.164 caller phone number is required.");
    }

    // Inline TwiML: when the recipient answers, bridge them straight to the
    // caller's real phone so both sides end up on a normal two-way call.
    const bridgeTwiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Say>Connecting your HeyLook call now.</Say><Dial callerId="${escapeXml(TWILIO_FROM_NUMBER)}">${escapeXml(callerNumber)}</Dial></Response>`;

    const formData = new URLSearchParams();
    formData.append("To", toNumber);
    formData.append("From", TWILIO_FROM_NUMBER);
    formData.append("Twiml", bridgeTwiml);

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Calls.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      },
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.message || "Twilio rejected the call request.");
    }

    return new Response(JSON.stringify(data), { status: 200, headers: CORS_HEADERS });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || "Server error" }),
      { status: 500, headers: CORS_HEADERS },
    );
  }
});
