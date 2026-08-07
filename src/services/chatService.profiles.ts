import { supabase } from "../lib/supabase";
import { Profile } from "../types";

/**
 * Fetch all registered profiles from Supabase `profiles` table
 */
export async function fetchAllProfiles(
  _currentUserId?: string,
): Promise<Profile[]> {
  try {
    // Strictly supabase.from('profiles').select('*') with NO .order(), .or(), or .ilike()
    const { data, error } = await supabase.from("profiles").select("*");

    if (error) {
      console.error("Profile fetch error details:", error);
      return [];
    }

    if (!data || !Array.isArray(data)) {
      return [];
    }

    // Safe mapping of results with JavaScript sorting
    return data
      .map((item: any) => ({
        id: item?.id || "",
        username:
          item?.username ||
          (item?.full_name || "nautical_user").toLowerCase().replace(/\s+/g, ""),
        full_name: item?.full_name || item?.name || "Nautical User",
        avatar_url:
          item?.avatar_url ||
          item?.avatar ||
          `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(item?.id || "user")}`,
        email: item?.email || item?.email_address || "",
        is_online: Boolean(item?.is_online),
        last_seen: item?.last_seen || "Recently",
        nautical_presence:
          item?.nautical_presence ||
          (item?.is_online ? "in_focus" : "last_anchored"),
        last_anchored: item?.last_anchored,
        bio: item?.bio || "Exploring HeyLook Nautical Stream",
      }))
      .sort((a, b) =>
        (a.full_name || a.username || "").localeCompare(
          b.full_name || b.username || "",
        ),
      );
  } catch (err) {
    console.error("Profile fetch error details:", err);
    return [];
  }
}
