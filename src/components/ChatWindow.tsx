import React from 'react';
import { usePresence } from '../hooks/usePresence';
import { MessageStatus } from './MessageStatus';

export interface ChatWindowProps {
  activeUser: {
    id: string;
    name: string;
    avatar_url?: string;
    avatar?: string;
    is_online?: boolean;
  };
  currentUser: {
    id: string;
    name?: string;
    full_name?: string;
    avatar_url?: string;
  };
  messages: Array<{
    id: string;
    sender_id: string;
    content?: string;
    text?: string;
    created_at: string;
    status?: any;
    is_read?: boolean;
    is_me?: boolean;
  }>;
  onSendMessage?: (text: string) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  activeUser,
  currentUser,
  messages,
}) => {
  const { isUserOnline } = usePresence(currentUser?.id);
  const isOnline = isUserOnline(activeUser.id) || activeUser.is_online === true;

  return (
    <div className="flex flex-col h-full bg-[#0b101b] text-white">
      {/* --- CHAT HEADER --- */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#0f172a]/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={activeUser.avatar_url || activeUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
              alt={activeUser.name}
              className="w-10 h-10 rounded-full object-cover border border-white/20"
            />
            {/* Dynamic Presence Dot */}
            <span
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0b101b] ${
                isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
              }`}
            />
          </div>

          <div className="flex flex-col">
            <h3 className="font-bold text-white text-base">{activeUser.name}</h3>

            {/* Realtime Status Subtitle */}
            {isOnline ? (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Anchored</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-slate-500" />
                <span>Adrift</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- MESSAGE LIST --- */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isMe = msg.is_me ?? (msg.sender_id === currentUser.id);

          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-xs px-4 py-2 rounded-2xl ${
                  isMe
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                    : 'bg-slate-800 text-slate-100'
                }`}
              >
                <p className="text-sm">{msg.content || msg.text}</p>

                <div className="flex items-center justify-end gap-1.5 mt-1 text-[10px] opacity-75">
                  <span>
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>

                  {/* Dynamic Message Receipt Logic */}
                  {isMe && (
                    <MessageStatus status={msg.status} isRead={msg.is_read} />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
