import { supabase } from "../lib/supabase";
import { Profile } from "../types";

/**
 * Places a real PSTN phone call bridging the caller and recipient's actual
 * phone numbers via Twilio (replaces the in-app WebRTC call so audio works
 * over the carrier network regardless of NAT/distance between users).
 */
export async function placeRealPhoneCall(
  caller: Profile,
  recipient: Profile,
): Promise<{ success: boolean; error?: string }> {
  if (!caller.phone_number) {
    return { success: false, error: "Add your phone number in Settings → Edit Profile before calling." };
  }
  if (!recipient.phone_number) {
    return { success: false, error: `${recipient.full_name || "This contact"} hasn't added a phone number yet.` };
  }

  try {
    const { data, error } = await supabase.functions.invoke("make-phone-call", {
      body: { toNumber: recipient.phone_number, callerNumber: caller.phone_number },
    });

    if (error) {
      return { success: false, error: error.message || "Could not place the call." };
    }
    if (data?.error) {
      return { success: false, error: data.error };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Could not place the call." };
  }
}
