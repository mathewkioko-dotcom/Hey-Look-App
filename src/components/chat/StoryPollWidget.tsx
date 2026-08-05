import React, { useState } from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { StoryPollData } from '../../lib/plugins/storyPollMaker';

interface StoryPollWidgetProps {
  poll: StoryPollData;
}

export const StoryPollWidget: React.FC<StoryPollWidgetProps> = ({ poll }) => {
  const [selected, setSelected] = useState<number | null>(null);

  const options = poll.options || [];
  const totalVotes = options.reduce((sum, o) => sum + (o.votes || 0), 0) + (selected !== null ? 1 : 0);

  return (
    <div className="my-3 p-4 bg-gradient-to-br from-purple-950/80 via-slate-950 to-pink-950/50 rounded-2xl border border-pink-500/20 shadow-xl max-w-sm font-sans">
      <div className="text-xs font-semibold text-pink-400 uppercase tracking-wider mb-2 text-center flex items-center justify-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5" />
        <span>IG / FB Story Sticker Preview</span>
      </div>
      <h4 className="text-sm font-bold text-white text-center mb-3 leading-snug">{poll.question}</h4>

      <div className="space-y-2">
        {options.map((opt, idx) => {
          const currentVotes = (opt.votes || 0) + (selected === idx ? 1 : 0);
          const pct = totalVotes > 0 ? Math.round((currentVotes / totalVotes) * 100) : 0;
          const isCorrect = poll.type === 'quiz' && poll.correctIndex === idx;

          return (
            <button
              key={idx}
              onClick={() => setSelected(idx)}
              className={`w-full relative overflow-hidden p-3 rounded-xl border text-left text-xs font-medium transition-all cursor-pointer select-none ${
                selected === idx
                  ? isCorrect || poll.type === 'poll'
                    ? 'border-purple-500 text-white bg-purple-900/40 shadow-md shadow-purple-500/10'
                    : 'border-rose-500 text-white bg-rose-900/40 shadow-md shadow-rose-500/10'
                  : 'border-slate-800 text-slate-300 hover:border-slate-700 bg-slate-900/60'
              }`}
            >
              {selected !== null && (
                <div
                  className={`absolute left-0 top-0 bottom-0 opacity-25 transition-all duration-500 ${
                    isCorrect ? 'bg-emerald-500' : 'bg-purple-500'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              )}
              <div className="flex justify-between items-center relative z-10">
                <span className="flex items-center gap-1.5">
                  {opt.text}
                  {selected !== null && isCorrect && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                </span>
                {selected !== null && <span className="font-mono text-slate-400 text-[11px]">{pct}%</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
