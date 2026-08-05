import React from 'react';
import { ReactionType } from '../types';
import { REACTION_CONFIG } from './ReactionPicker';

interface ReactionBadgeArrayProps {
  topReactions?: ReactionType[];
  totalCount: number;
  userReaction?: ReactionType;
  onClick?: () => void;
  className?: string;
}

export const ReactionBadgeArray: React.FC<ReactionBadgeArrayProps> = ({
  topReactions = ['Like', 'Love'],
  totalCount,
  userReaction,
  onClick,
  className = '',
}) => {
  if (totalCount === 0 && !userReaction) return null;

  const displayReactions = topReactions.length > 0 ? topReactions.slice(0, 3) : (['Like'] as ReactionType[]);

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/60 dark:bg-slate-800/80 border border-slate-700/50 text-xs font-semibold text-slate-300 cursor-pointer hover:bg-slate-800 transition-colors ${className}`}
    >
      <div className="flex -space-x-1 items-center">
        {displayReactions.map((type) => (
          <span
            key={type}
            className="w-5 h-5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-xs shadow-sm"
          >
            {REACTION_CONFIG[type]?.emoji || '👍'}
          </span>
        ))}
      </div>
      <span className="ml-0.5 text-[11px] text-slate-300">
        {totalCount > 0 ? totalCount : 1}
      </span>
      {userReaction && (
        <span className={`text-[10px] ml-1 font-bold ${REACTION_CONFIG[userReaction]?.color || 'text-blue-400'}`}>
          • You ({userReaction})
        </span>
      )}
    </div>
  );
};
