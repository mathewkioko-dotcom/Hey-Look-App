import React, { useState } from 'react';
import { Send, CornerDownRight, Heart, ThumbsUp } from 'lucide-react';
import { PostComment, Profile } from '../types';

interface CommentTreeProps {
  comments: PostComment[];
  currentUser: Profile;
  onAddReply: (parentId: string, text: string) => void;
  depth?: number;
}

export const CommentTree: React.FC<CommentTreeProps> = ({
  comments,
  currentUser,
  onAddReply,
  depth = 0,
}) => {
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const handleSendReply = (parentId: string) => {
    if (!replyText.trim()) return;
    onAddReply(parentId, replyText.trim());
    setReplyText('');
    setActiveReplyId(null);
  };

  if (!comments || comments.length === 0) return null;

  return (
    <div className={`space-y-3 ${depth > 0 ? 'ml-4 sm:ml-6 pl-3 border-l-2 border-slate-800' : ''}`}>
      {comments.map((cmt) => (
        <div key={cmt.id} className="group space-y-2">
          {/* Single Comment Item */}
          <div className="flex items-start gap-2.5">
            <img
              src={cmt.user_avatar}
              alt={cmt.user_name}
              className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5 border border-slate-700"
            />
            <div className="flex-1 space-y-1">
              <div className="p-3 rounded-2xl bg-slate-800/90 dark:bg-slate-800/90 border border-slate-700/60 text-xs shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-100">{cmt.user_name}</span>
                  <span className="text-[10px] text-slate-400">{cmt.created_at}</span>
                </div>
                <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">{cmt.content}</p>
              </div>

              {/* Action buttons under comment */}
              <div className="flex items-center gap-3 text-[11px] font-medium text-slate-400 px-2">
                <button
                  onClick={() => setActiveReplyId(activeReplyId === cmt.id ? null : cmt.id)}
                  className="flex items-center gap-1 hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  <CornerDownRight className="w-3 h-3 text-cyan-400" />
                  <span>Reply</span>
                </button>
              </div>
            </div>
          </div>

          {/* Contextual Reply Input Field */}
          {activeReplyId === cmt.id && (
            <div className="ml-9 flex items-center gap-2 pt-1">
              <img
                src={currentUser.avatar_url}
                alt={currentUser.full_name}
                className="w-6 h-6 rounded-full object-cover shrink-0"
              />
              <input
                type="text"
                placeholder={`Reply to ${cmt.user_name}...`}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendReply(cmt.id)}
                className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={() => handleSendReply(cmt.id)}
                className="p-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-md cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Recursive Render of Nested Children */}
          {cmt.replies && cmt.replies.length > 0 && (
            <CommentTree
              comments={cmt.replies}
              currentUser={currentUser}
              onAddReply={onAddReply}
              depth={depth + 1}
            />
          )}
        </div>
      ))}
    </div>
  );
};
