import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { NauticalPresenceState } from "../types";

export function usePresence(currentUserId?: string) {
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [presenceState, setPresenceState] =
    useState<NauticalPresenceState>("In Focus");
  const [lastAnchored, setLastAnchored] = useState<string>(
    new Date().toISOString(),
  );
  const [onlinePresences, setOnlinePresences] = useState<
    Record<string, { presence: NauticalPresenceState; last_anchored: string }>
  >({});

useEffect(() => {
    if (!currentUserId) return;

    // ---- GLOBAL PRESENCE CHANNEL ----
    // A single shared channel that ALL users subscribe to. Presence keys are
    // the user IDs, so every client sees the full online user map and their
    // current focus state ("In Focus" / "Adrift"). This fixes the previous
    // bug where presence was per-user and contacts got stuck on "Last
    // Anchored" because they subscribed to different channels.
    const globalChannelName = "global_presence";
    const existingGlobal = supabase.getChannels();
    existingGlobal.forEach((ch) => {
      if (ch.topic === `realtime:${globalChannelName}`) {
        supabase.removeChannel(ch);
      }
    });

    const globalChannel = supabase.channel(globalChannelName, {
      config: { presence: { key: currentUserId } },
    });

    globalChannel
      .on("presence", { event: "sync" }, () => {
        const state = globalChannel.presenceState();
        const activeIds = new Set<string>(Object.keys(state));
        setOnlineUserIds(activeIds);

        const mapped: Record<
          string,
          { presence: NauticalPresenceState; last_anchored: string }
        > = {};
        Object.keys(state).forEach((key) => {
          const presArray = state[key] as any[];
          if (presArray && presArray.length > 0) {
            const latest = presArray[presArray.length - 1];
            mapped[key] = {
              presence: latest.presence || "In Focus",
              last_anchored: latest.last_anchored || new Date().toISOString(),
            };
          }
        });
        setOnlinePresences(mapped);
      })
      .on("presence", { event: "join" }, ({ key, newPresences }: any) => {
        if (newPresences && newPresences.length > 0) {
          const latest = newPresences[newPresences.length - 1];
          setOnlinePresences((prev) => ({
            ...prev,
            [key]: {
              presence: latest.presence || "In Focus",
              last_anchored: latest.last_anchored || new Date().toISOString(),
            },
          }));
        }
        setOnlineUserIds((prev) => new Set(prev).add(key));
      })
      .on("presence", { event: "leave" }, ({ key }: any) => {
        setOnlineUserIds((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
        setOnlinePresences((prev) => {
          const updated = { ...prev };
          delete updated[key];
          return updated;
        });
      });

    // 1. CLEANUP: Remove any existing legacy per-user channel before creating
    // a new one (kept for backward compatibility with older clients).
    const channelName = `online_presence_${currentUserId}`;
    const existingChannels = supabase.getChannels();
    existingChannels.forEach((ch) => {
      if (
        ch.topic === `realtime:${channelName}` ||
        ch.topic === "realtime:online_presence"
      ) {
        supabase.removeChannel(ch);
      }
    });

    // ---- WINDOW FOCUS / BLUR PRESENCE BROADCAST ----
    // Active tab  -> "In Focus"
    // Blurred (0-5min) -> "Adrift"
    // Blurred >5min   -> "Last Anchored" with the anchor timestamp
    let inactivityTimer: ReturnType<typeof setTimeout> | null = null;

    const trackPresence = async (
      presence: NauticalPresenceState,
      anchoredAt?: string,
    ) => {
      await globalChannel.track({
        userId: currentUserId,
        presence,
        last_anchored: anchoredAt || new Date().toISOString(),
      });
      setPresenceState(presence);
      setLastAnchored(anchoredAt || new Date().toISOString());
    };

    const handleFocus = () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
        inactivityTimer = null;
      }
      trackPresence("In Focus");
    };

    const handleBlur = () => {
      // Immediately broadcast "Adrift"
      trackPresence("Adrift");

      // After 5 minutes of continued inactivity, flip to "Last Anchored"
      const anchoredAt = new Date().toISOString();
      if (inactivityTimer) clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(
        () => {
          trackPresence("Last Anchored", anchoredAt);
        },
        5 * 60 * 1000,
      );
    };

    // Subscribe, then track initial "In Focus" state once SUBSCRIBED.
    globalChannel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await trackPresence("In Focus");
      }
    });

    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
        inactivityTimer = null;
      }
      supabase.removeChannel(globalChannel);
    };
  }, [currentUserId]);

  const isUserOnline = (userId?: string) => {
    if (!userId) return false;
    return onlineUserIds.has(userId);
  };

  return {
    onlineUserIds,
    isUserOnline,
    presenceState,
    lastAnchored,
    onlinePresences,
    setPresenceState,
  };
}

export function formatLastAnchored(timestamp?: string): string {
  if (!timestamp) return "Last Anchored recently";
  const date = new Date(timestamp);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return "Last Anchored just now";
  if (diffSec < 3600) return `Last Anchored ${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400)
    return `Last Anchored ${Math.floor(diffSec / 3600)}h ago`;
  return `Last Anchored on ${date.toLocaleDateString()}`;
}

/**
 * Build a human-friendly presence label for a given contact based on their
 * live presence broadcast state. Falls back to last-seen time when offline.
 */
export function getLivePresenceLabel(
  presence?: NauticalPresenceState,
  lastAnchored?: string,
  fallbackLastSeen?: string | null,
): string {
  if (!presence) {
    return formatNauticalPresenceFallback(fallbackLastSeen);
  }

  const normalized = presence.toLowerCase().replace(/\s+/g, "_");
  if (normalized.includes("in_focus") || normalized === "in_focus") {
    return "🟢 In Focus";
  }
  if (normalized.includes("adrift")) {
    return "🌊 Adrift";
  }
  if (normalized.includes("last_anchored")) {
    return formatLastAnchored(lastAnchored);
  }
  return formatNauticalPresenceFallback(fallbackLastSeen);
}

function formatNauticalPresenceFallback(lastSeenTime?: string | null): string {
  if (!lastSeenTime) return "Adrift";
  const date = new Date(lastSeenTime);
  if (isNaN(date.getTime())) return "Adrift";

  const now = new Date();
  const diffInSec = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSec < 60) return "Last anchored 1m ago";
  if (diffInSec < 3600)
    return `Last anchored ${Math.floor(diffInSec / 60)}m ago`;

  const timeStr = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (date.toDateString() === now.toDateString()) {
    return `Last anchored today at ${timeStr}`;
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Last anchored yesterday at ${timeStr}`;
  }
  return `Last anchored ${date.toLocaleDateString([], { month: "short", day: "numeric" })} at ${timeStr}`;
}
