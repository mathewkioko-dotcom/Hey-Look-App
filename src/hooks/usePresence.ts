import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { NauticalPresenceState } from '../types';

export function usePresence(currentUserId?: string) {
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [presenceState, setPresenceState] = useState<NauticalPresenceState>('In Focus');
  const [lastAnchored, setLastAnchored] = useState<string>(new Date().toISOString());
  const [onlinePresences, setOnlinePresences] = useState<
    Record<string, { presence: NauticalPresenceState; last_anchored: string }>
  >({});

  useEffect(() => {
    if (!currentUserId) return;

    const channelName = `online_presence_${currentUserId}`;

    // 1. CLEANUP: Remove any existing channel with this name before creating a new one
    const existingChannels = supabase.getChannels();
    existingChannels.forEach((ch) => {
      if (ch.topic === `realtime:${channelName}` || ch.topic === 'realtime:online_presence') {
        supabase.removeChannel(ch);
      }
    });

    // 2. CREATE A CLEAN CHANNEL INSTANCE
    const channel = supabase.channel(channelName, {
      config: { presence: { key: currentUserId } },
    });

    // 3. ATTACH ALL LISTENERS FIRST BEFORE SUBSCRIBING
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const activeIds = new Set<string>(Object.keys(state));
        setOnlineUserIds(activeIds);

        const mapped: Record<string, { presence: NauticalPresenceState; last_anchored: string }> = {};
        Object.keys(state).forEach((key) => {
          const presArray = state[key] as any[];
          if (presArray && presArray.length > 0) {
            const latest = presArray[presArray.length - 1];
            mapped[key] = {
              presence: latest.presence || 'In Focus',
              last_anchored: latest.last_anchored || new Date().toISOString(),
            };
          }
        });
        setOnlinePresences(mapped);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }: any) => {
        if (newPresences && newPresences.length > 0) {
          const latest = newPresences[newPresences.length - 1];
          setOnlinePresences((prev) => ({
            ...prev,
            [key]: {
              presence: latest.presence || 'In Focus',
              last_anchored: latest.last_anchored || new Date().toISOString(),
            },
          }));
        }
        setOnlineUserIds((prev) => new Set(prev).add(key));
      })
      .on('presence', { event: 'leave' }, ({ key }: any) => {
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

    // 4. CALL .subscribe() AFTER LISTENERS ARE ATTACHED
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          userId: currentUserId,
          presence: 'In Focus',
          last_anchored: new Date().toISOString(),
        });
      }
    });

    return () => {
      supabase.removeChannel(channel);
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
  if (!timestamp) return 'Last Anchored recently';
  const date = new Date(timestamp);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return 'Last Anchored just now';
  if (diffSec < 3600) return `Last Anchored ${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `Last Anchored ${Math.floor(diffSec / 3600)}h ago`;
  return `Last Anchored on ${date.toLocaleDateString()}`;
}