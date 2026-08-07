import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const TYPING_CHANNEL = 'typing_indicator_channel';

/**
 * Custom typing indicator phrase persisted in localStorage.
 * Users can override the default "Typing..." label shown in the chat list.
 */
export const TYPING_PHRASE_STORAGE_KEY = 'heylook_typing_phrase';

export function getCustomTypingPhrase(): string {
  try {
    return localStorage.getItem(TYPING_PHRASE_STORAGE_KEY) || 'Typing...';
  } catch {
    return 'Typing...';
  }
}

/** Persist a custom typing phrase to localStorage (returns the saved value). */
export function setCustomTypingPhrase(phrase: string): string {
  const trimmed = (phrase || '').trim();
  const value = trimmed || 'Typing...';
  try {
    localStorage.setItem(TYPING_PHRASE_STORAGE_KEY, value);
  } catch {
    /* storage unavailable — default fallback */
  }
  return value;
}

// ---------------------------------------------------------------------------
// Module-level singleton broadcast state shared across all components.
// A single Supabase Realtime Broadcast channel is subscribed to once and
// maintains a map of who is currently typing per room.
// ---------------------------------------------------------------------------

// Maps roomId -> (userId -> lastTypingTimestamp). A value > 0 = actively typing.
type TypingMap = Record<string, Record<string, number>>;

let typingByRoom: TypingMap = {};
let channelReady = false;
let channelSubscribed = false;
const listeners = new Set<() => void>();

function publishTypingState() {
  listeners.forEach((fn) => fn());
}

function subscribeToChannel() {
  if (channelSubscribed) return;
  channelSubscribed = true;

  try {
    const channelName = `${TYPING_CHANNEL}_${Math.random()
      .toString(36)
      .substring(2, 9)}`;
    const channel = supabase.channel(channelName);

    channel
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { userId, roomId, isTyping } = payload.payload || {};
        if (!userId || !roomId) return;

if (isTyping) {
          if (!typingByRoom[roomId]) typingByRoom[roomId] = {};
          typingByRoom[roomId][userId] = Date.now();
        } else {
          if (typingByRoom[roomId]) {
            delete typingByRoom[roomId][userId];
          }
        }
        publishTypingState();
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channelReady = true;
        }
      });

    // Clean up stale typing entries periodically (defensive).
    const interval = setInterval(() => {
      let changed = false;
      Object.keys(typingByRoom).forEach((roomId) => {
        const users = typingByRoom[roomId] || {};
        const now = Date.now();
        Object.keys(users).forEach((userId) => {
          // Entries older than 20s are considered stale.
          if (now - (users[userId] as any) > 20000) {
            delete users[userId];
            changed = true;
          }
        });
      });
      if (changed) publishTypingState();
    }, 15000);

    // Store the interval so we can clear it only if it's the active channel.
    (channel as any).__typingInterval = interval;
  } catch (err) {
    console.warn('[TypingIndicator] Broadcast subscription error:', err);
  }
}

/**
 * Broadcasts a typing state change over the shared Supabase Realtime
 * Broadcast channel. `isTyping` triggers as soon as any non-space character
 * is present and stays active while text remains in the box.
 */
export function sendTyping(
  userId: string,
  roomId: string,
  isTyping: boolean,
) {
  try {
    if (!channelSubscribed) subscribeToChannel();

    // Update local state immediately for snappy UI.
    if (isTyping) {
      if (!typingByRoom[roomId]) typingByRoom[roomId] = {};
      typingByRoom[roomId][userId] = Date.now();
    } else {
      if (typingByRoom[roomId]) {
        delete typingByRoom[roomId][userId];
      }
    }
    publishTypingState();

    if (!channelReady) {
      // Channel not ready yet — still broadcast; Supabase buffers it.
      (supabase.getChannels()[0] as any)?.send?.({
        type: 'broadcast',
        event: 'typing',
        payload: { userId, roomId, isTyping },
      });
      return;
    }

    const channelToUse = supabase
      .getChannels()
      .find((ch) => ch.topic.includes(TYPING_CHANNEL));
    (channelToUse as any)?.send?.({
      type: 'broadcast',
      event: 'typing',
      payload: { userId, roomId, isTyping },
    });
  } catch (err) {
    console.warn('[TypingIndicator] Broadcast error:', err);
  }
}

/**
 * React hook that exposes whether a given user is typing in a given room.
 * Components re-render whenever the shared typing state changes.
 */
export function useTypingIndicator() {
  const [, forceRender] = useState(0);

  useEffect(() => {
    subscribeToChannel();
    const listener = () => forceRender((n) => n + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const isUserTyping = useCallback((userId: string, roomId: string) => {
    return Boolean(
      typingByRoom[roomId] && typingByRoom[roomId][userId],
    );
  }, []);

  return { isUserTyping, sendTyping };
}
