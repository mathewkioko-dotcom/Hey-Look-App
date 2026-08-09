/**
 * chatService — Barrel / aggregator module.
 *
 * This file is intentionally thin: it re-exports the `chatService` object and
 * the shared helper functions from smaller, focused modules so that each file
 * stays within the recommended 100–300 line range and is easy to debug.
 *
 * Existing consumers import `chatService` (and sometimes the named helpers)
 * from `./chatService`, so this barrel keeps the public API identical while
 * splitting the implementation into:
 *  - chatService.utils.ts        (isValidUuid, quoteValue, generateUuid, deriveRoomId, filterVanishingMessages)
 *  - chatService.messages.ts     (sendMessage, fetchMessages, subscribeToMessages, markSubmerged, deleteMessage, clearHistory)
 *  - chatService.conversations.ts(fetchConversations)
 *  - chatService.profiles.ts     (fetchAllProfiles)
 *  - chatService.calls.ts        (recordCallLog)
 *  - chatService.edge.ts         (callChatEdgeProxy)
 */
import { supabase } from "../lib/supabase";
import {
  ChatMessage,
  Conversation,
  Profile,
  CallLog,
  MessageDeliveryStatus,
} from "../types";
import {
  isValidUuid,
  quoteValue,
  generateUuid,
  deriveRoomId,
  filterVanishingMessages,
} from "./chatService.utils";
import {
  sendMessage,
  fetchMessages,
  subscribeToMessages,
  markSubmerged,
  deleteMessage,
  clearHistory,
  reactToMessage,
  forwardMessages,
  starMessage,
  unstarMessage,
  reportMessage,
  getMessageInfo,
  pinMessage,
  saveEditHistory,
  fetchEditHistory,
} from "./chatService.messages";
import { fetchConversations } from "./chatService.conversations";
import { fetchAllProfiles, fetchProfileById } from "./chatService.profiles";
import { recordCallLog } from "./chatService.calls";
import { callChatEdgeProxy } from "./chatService.edge";

// Re-export shared helpers so named imports like
// `import { isValidUuid, filterVanishingMessages } from "../services/chatService"`
// keep working unchanged.
export {
  isValidUuid,
  quoteValue,
  generateUuid,
  deriveRoomId,
  filterVanishingMessages,
};

export type {
  ChatMessage,
  Conversation,
  Profile,
  CallLog,
  MessageDeliveryStatus,
};

/**
 * Real Supabase backend binding for Chat Messages, Profiles, and Conversations.
 * Delegates to the focused modules above.
 */
export const chatService = {
  fetchAllProfiles,
  fetchProfileById,
  fetchConversations,
  fetchMessages,
  sendMessage,
  subscribeToMessages,
  markSubmerged,
  deleteMessage,
  clearHistory,
  recordCallLog,
  callChatEdgeProxy,
  reactToMessage,
  forwardMessages,
  starMessage,
  unstarMessage,
  reportMessage,
  getMessageInfo,
  pinMessage,
  saveEditHistory,
  fetchEditHistory,
};

// Re-export the client so any code that relied on `chatService`'s module
// side-effects (or needs the supabase instance) can still import it here.
export { supabase };
