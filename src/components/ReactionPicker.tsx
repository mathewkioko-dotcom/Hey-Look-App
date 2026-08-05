import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ReactionType } from '../types';

interface ReactionPickerProps {
  isOpen: boolean;
  onSelectReaction: (reaction: ReactionType) => void;
  onClose?: () => void;
}

export const REACTION_CONFIG: Record<
  ReactionType,
  { label: string; emoji: string; color: string; bg: string }
> = {
  Like: { label: 'Like', emoji: '👍', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  Love: { label: 'Love', emoji: '❤️', color: 'text-rose-400', bg: 'bg-rose-500/20' },
  Haha: { label: 'Haha', emoji: '😆', color: 'text-amber-400', bg: 'bg-amber-500/20' },
  Wow: { label: 'Wow', emoji: '😮', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  Sad: { label: 'Sad', emoji: '😢', color: 'text-indigo-400', bg: 'bg-indigo-500/20' },
  Angry: { label: 'Angry', emoji: '😡', color: 'text-orange-400', bg: 'bg-orange-500/20' },
};

export const REACTION_TYPES: ReactionType[] = ['Like', 'Love', 'Haha', 'Wow', 'Sad', 'Angry'];

export const ReactionPicker: React.FC<ReactionPickerProps> = ({ isOpen, onSelectReaction }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.9 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="absolute bottom-full left-0 mb-2 z-50 p-2 rounded-full bg-slate-900/90 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 shadow-2xl flex items-center gap-1.5"
        >
          {REACTION_TYPES.map((type, idx) => {
            const config = REACTION_CONFIG[type];

            return (
              <motion.button
                key={type}
                whileHover={{ scale: 1.4, y: -6 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectReaction(type);
                }}
                className="relative group p-2 rounded-full hover:bg-slate-800 transition-colors cursor-pointer focus:outline-none"
                title={config.label}
              >
                <span className="text-2xl filter drop-shadow-md select-none">{config.emoji}</span>

                {/* Floating tooltip badge */}
                <span className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-slate-950 text-[10px] font-bold text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-slate-800 shadow-md">
                  {config.label}
                </span>
              </motion.button>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
