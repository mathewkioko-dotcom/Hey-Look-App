// src/components/chat/ChatInputBar.tsx
import React, { useState, useRef } from "react";
import { Send, Mic, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion"; // Assuming framer-motion is used for animations
import {
  Conversation,
  Profile,
  ChatMessage,
  MessageDeliveryStatus,
} from "../../types";
import { chatService } from "../../services/chatService";
import { useVoiceRecorder, formatClock } from "../../hooks/useVoiceRecorder";

// Safe UUID generator. Prefer `crypto.randomUUID()` (always a valid RFC-4122
// UUID). In non-secure HTTP contexts where it is unavailable, synthesize a
// valid v4 UUID from a random hex string so `sendMessage`'s `isValidUuid`
// check keeps it — guaranteeing the optimistic id === the persisted id.
const generateId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  const hex = "0123456789abcdef";
  let s = "";
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) s += "-";
    else if (i === 14) s += "4"; // version 4
    else if (i === 19) s += hex[(Math.random() * 4 | 0) + 8]; // variant
    else s += hex[Math.floor(Math.random() * 16)];
  }
  return s;
};

interface ChatInputBarProps {
  activeConv: Conversation;
  currentUser: Profile;
  onUpdateConversation?: (
    convId: string,
    lastMsg: string,
    newMsg?: ChatMessage,
    cleared?: boolean,
  ) => void;
  sendTyping: (userId: string, convId: string, isTyping: boolean) => void;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  scrollToBottom: () => void;
  replyingTo: ChatMessage | null;
  setReplyingTo: React.Dispatch<React.SetStateAction<ChatMessage | null>>;
  editingMessage?: ChatMessage | null;
  setEditingMessage?: React.Dispatch<React.SetStateAction<ChatMessage | null>>;
  showAiPromptToolbar: boolean;
  setShowAiPromptToolbar: React.Dispatch<React.SetStateAction<boolean>>;
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  activeConv,
  currentUser,
  onUpdateConversation,
  sendTyping,
  setMessages,
  scrollToBottom,
  replyingTo,
  setReplyingTo,
  editingMessage,
  setEditingMessage,
  showAiPromptToolbar,
  setShowAiPromptToolbar,
}) => {
  const [inputText, setInputText] = useState("");
  const [isVoiceRecorderOpen, setIsVoiceRecorderOpen] = useState(false);
  const [isSendingVoice, setIsSendingVoice] = useState(false);
  const voiceRecorder = useVoiceRecorder(currentUser.id);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);

    sendTyping(currentUser.id, activeConv.id, val.trim().length > 0);

    if (val.startsWith("/")) {
      setShowAiPromptToolbar(true);
    } else if (showAiPromptToolbar && !val.startsWith("/")) {
      setShowAiPromptToolbar(false);
    }
  };

  const handleSendMessage = async () => {
    if (inputText.trim() === "") return;

    const newMsg: ChatMessage = {
      id: generateId(),
      sender_id: currentUser.id,
      receiver_id: activeConv.user.id,
      text: inputText.trim(),
      type: "text",
      created_at: new Date().toISOString(),
      is_me: true,
      status: 1, // Launched
      reply_to_id: replyingTo?.id || undefined,
      reply_preview: replyingTo
        ? {
            sender_name: replyingTo.is_me
              ? currentUser.username
              : activeConv.user.name,
            text: replyingTo.text || replyingTo.audio_url || "Attachment",
          }
        : undefined,
    };

    // ---- DEDUP GUARD ----
    // Append the optimistic message only if its id is not already present.
    // This prevents duplicates when the realtime subscription (broadcast +
    // postgres_changes) echoes the same message back while we sent it locally.
    const optimisticId = newMsg.id;
    setMessages((prev) =>
      prev.some((m) => m.id === optimisticId) ? prev : [...prev, newMsg],
    );
    setInputText("");
    setReplyingTo(null);
    scrollToBottom();

    const savedMsg = await chatService.sendMessage({
      ...newMsg,
      receiver_id: activeConv.user.id,
    });
    // Replace the optimistic copy with the persisted (canonical-id) one so the
    // local id always matches what realtime delivers — otherwise the listener
    // sees a different id and appends a duplicate.
    if (savedMsg && savedMsg.id) {
      setMessages((prev) => {
        const savedExists = prev.some((m) => m.id === savedMsg.id);
        const withoutOptimistic = prev.filter((m) => m.id !== optimisticId);
        if (savedExists) return withoutOptimistic;
        return [...withoutOptimistic, savedMsg];
      });
    }
    if (onUpdateConversation) {
      onUpdateConversation(activeConv.id, newMsg.text, newMsg);
    }
    sendTyping(currentUser.id, activeConv.id, false); // Clear typing indicator after sending
  };

  const handleSendVoiceNote = async () => {
    if (!voiceRecorder.isRecording) {
      // Start recording
      const started = await voiceRecorder.startRecording();
      if (started) {
        setIsVoiceRecorderOpen(true);
      }
    } else {
      // Stop recording and send
      setIsSendingVoice(true);
      const result = await voiceRecorder.stopRecording();
      if (result) {
        const newMsg: ChatMessage = {
          id: generateId(),
          sender_id: currentUser.id,
          receiver_id: activeConv.user.id,
          text: "", // Voice notes don't have text content
          type: "voice",
          audio_url: result.audioUrl,
          audio_duration: result.duration,
          created_at: new Date().toISOString(),
          is_me: true,
          status: 1, // Launched
        };
        const optimisticId = newMsg.id;
        setMessages((prev) =>
          prev.some((m) => m.id === optimisticId) ? prev : [...prev, newMsg],
        );
        const savedMsg = await chatService.sendMessage({
          ...newMsg,
          receiver_id: activeConv.user.id,
        });
        if (savedMsg && savedMsg.id) {
          setMessages((prev) => {
            const savedExists = prev.some((m) => m.id === savedMsg.id);
            const withoutOptimistic = prev.filter((m) => m.id !== optimisticId);
            return savedExists
              ? withoutOptimistic
              : [...withoutOptimistic, savedMsg];
          });
        }
        if (onUpdateConversation) {
          onUpdateConversation(activeConv.id, "Voice Note", savedMsg || newMsg);
        }
      }
      setIsSendingVoice(false);
      setIsVoiceRecorderOpen(false);
    }
  };

  const handleCancelVoiceRecording = () => {
    voiceRecorder.cancelRecording();
    setIsVoiceRecorderOpen(false);
    setIsSendingVoice(false);
  };

  return (
    <div className="flex items-center p-2 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <AnimatePresence>
        {replyingTo && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute bottom-full left-0 right-0 bg-blue-50 dark:bg-blue-900 p-2 rounded-t-lg flex items-center justify-between text-sm text-blue-800 dark:text-blue-200"
          >
            <div>
              Replying to{" "}
              <span className="font-semibold">
                {replyingTo.is_me ? "You" : activeConv.user.name}
              </span>
              : "{replyingTo.text || replyingTo.audio_url || "Attachment"}"
            </div>
            <X
              className="w-4 h-4 cursor-pointer"
              onClick={() => setReplyingTo(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {isVoiceRecorderOpen ? (
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 50 }}
          className="flex items-center flex-grow bg-red-100 dark:bg-red-900 p-2 rounded-full mr-2"
        >
          <X
            className="w-6 h-6 text-red-600 dark:text-red-300 cursor-pointer mr-2"
            onClick={handleCancelVoiceRecording}
          />
          <div className="flex-grow text-red-600 dark:text-red-300 font-mono">
            {formatClock(voiceRecorder.elapsedSeconds)}
          </div>
          {isSendingVoice && (
            <Loader2 className="w-5 h-5 animate-spin text-red-600 dark:text-red-300 mr-2" />
          )}
          <button
            onClick={handleSendVoiceNote}
            className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
            disabled={isSendingVoice}
          >
            <Send className="w-5 h-5" />
          </button>
        </motion.div>
      ) : (
        <>
          <input
            ref={inputRef}
            type="text"
            className="flex-grow p-2 rounded-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            placeholder="Type a message..."
            value={inputText}
            onChange={handleInputChange}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <button
            onClick={handleSendVoiceNote}
            className="ml-2 p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            aria-label="Record voice message"
          >
            <Mic className="w-5 h-5" />
          </button>
          <button
            onClick={handleSendMessage}
            className="ml-2 p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
            disabled={inputText.trim() === ""}
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </>
      )}
    </div>
  );
};
