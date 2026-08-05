import React from 'react';
import { Mic, CheckSquare, Sparkles } from 'lucide-react';
import { VoiceSummaryResult } from '../../lib/plugins/voiceNoteSummarizer';

interface VoiceSummaryProps {
  summary: VoiceSummaryResult;
}

export const VoiceNoteSummaryWidget: React.FC<VoiceSummaryProps> = ({ summary }) => {
  return (
    <div className="my-3 p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-xl font-sans">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Mic className="w-4 h-4" />
          </div>
          <span className="text-sm font-semibold text-emerald-400">WhatsApp Voice Note Summary</span>
        </div>
        <span className="text-xs px-2.5 py-0.5 bg-emerald-500/10 text-emerald-300 rounded-full font-mono font-medium border border-emerald-500/20">
          {Math.floor(summary.durationSeconds / 60)}m {summary.durationSeconds % 60}s
        </span>
      </div>

      <div className="mb-3 space-y-1.5">
        <div className="text-xs font-semibold text-slate-400 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Key Takeaways:</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-xs text-slate-200 leading-relaxed pl-1">
          {summary.bulletSummary.map((bullet, idx) => (
            <li key={idx} className="marker:text-emerald-400">{bullet}</li>
          ))}
        </ul>
      </div>

      {summary.actionItems && summary.actionItems.length > 0 && (
        <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800/80">
          <div className="text-xs font-semibold text-amber-400 mb-2 flex items-center gap-1.5">
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Extracted Action Items:</span>
          </div>
          <div className="space-y-2">
            {summary.actionItems.map((item, idx) => (
              <label key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer group">
                <input
                  type="checkbox"
                  className="mt-0.5 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500/20 focus:ring-offset-0 cursor-pointer"
                  defaultChecked={false}
                />
                <span className="leading-relaxed group-hover:text-slate-100 transition-colors">{item}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
