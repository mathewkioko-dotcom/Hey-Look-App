import { supabase } from "../lib/supabase";
import { CallLog } from "../types";

/**
 * Record Call Log in database
 */
export async function recordCallLog(
  log: Omit<CallLog, "id" | "created_at">,
): Promise<CallLog> {
  const newLog: CallLog = {
    ...log,
    id: `call-${Date.now()}`,
    created_at: new Date().toISOString(),
  };

  try {
    await supabase.from("call_logs").insert(newLog);
  } catch (err) {
    console.warn("[ChatService] Call log insert fallback:", err);
  }

  return newLog;
}

export async function fetchRecentCallLogs(userId: string, limit = 20): Promise<CallLog[]> {
  try {
    const { data, error } = await supabase
      .from("call_logs")
      .select("*")
      .or(`caller_id.eq.${userId},receiver_id.eq.${userId}`)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data as CallLog[];
  } catch (err) {
    console.warn("[ChatService] Call log fetch failed:", err);
    return [];
  }
}
