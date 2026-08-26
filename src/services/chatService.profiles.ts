import { supabase } from "../lib/supabase";
import { Profile } from "../types";

/** Map a raw profiles row into the app's Profile shape. */
function mapProfileRow(item: any): Profile {
  return {
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
    phone_number: item?.phone_number || "",
  };
}

/**
 * Fetch a single profile by ID from Supabase `profiles` table.
 * Returns null if the profile does not exist or the query fails.
 */
export async function fetchProfileById(userId: string): Promise<Profile | null> {
  if (!userId) return null;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user || session.user.id !== userId) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error || !data) {
      if (error && error.message && !/row-level security|policy/i.test(error.message)) {
        console.warn("[ChatService] fetchProfileById error:", error.message);
      }
      return null;
    }
    return mapProfileRow(data);
  } catch (err) {
    console.warn("[ChatService] fetchProfileById exception:", err);
    return null;
  }
}

/** Ensure an authenticated user is discoverable in the public profiles table. */
export async function ensureProfile(profile: Profile): Promise<void> {
  if (!profile?.id) return;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user || session.user.id !== profile.id) {
    return;
  }

  const { error } = await supabase.from("profiles").upsert(
    {
      id: profile.id,
      username: profile.username || `user_${profile.id.slice(0, 6)}`,
      full_name: profile.full_name || "Nautical Explorer",
      avatar_url: profile.avatar_url,
    },
    { onConflict: "id" },
  );

  if (error && !/row-level security|policy/i.test(error.message)) {
    console.warn("[ChatService] Profile sync error:", error.message);
  }
}

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
        phone_number: item?.phone_number || "",
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
