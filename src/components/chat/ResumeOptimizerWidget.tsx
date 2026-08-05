import React from 'react';
import { FileCheck, Sparkles, Tag, CheckCircle } from 'lucide-react';
import { ResumeOptimizationData } from '../../lib/plugins/resumeOptimizer';

export const ResumeOptimizerWidget: React.FC<{ data: ResumeOptimizationData }> = ({ data }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (score >= 60) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
  };

  const missingKeywords = data.missingKeywords || [];
  const suggestedBullets = data.suggestedBullets || [];

  return (
    <div className="my-3 p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-xl font-sans">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <FileCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold text-indigo-400 block uppercase tracking-wider font-mono">
              ATS Resume Optimization
            </span>
            <h4 className="text-sm font-bold text-white leading-tight">{data.jobTitle}</h4>
          </div>
        </div>
        <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-xl border shrink-0 ${getScoreColor(data.atsScore)}`}>
          Match: {data.atsScore}%
        </span>
      </div>

      {missingKeywords.length > 0 && (
        <div className="mb-3">
          <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1.5 font-semibold flex items-center gap-1">
            <Tag className="w-3 h-3 text-indigo-400" />
            Missing Keywords:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {missingKeywords.map((item, idx) => (
              <span
                key={idx}
                className={`text-[11px] px-2 py-0.5 rounded-lg font-mono border flex items-center gap-1 ${
                  item.importance === 'high'
                    ? 'border-rose-500/40 text-rose-300 bg-rose-500/10 font-semibold'
                    : 'border-slate-800 text-slate-300 bg-slate-900'
                }`}
              >
                + {item.keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      {suggestedBullets.length > 0 && (
        <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800/80">
          <span className="text-[10px] uppercase font-mono text-indigo-400 block mb-2 font-semibold flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Recommended Tailored Bullets:
          </span>
          <ul className="list-disc list-inside text-xs text-slate-300 space-y-1.5 leading-relaxed pl-1">
            {suggestedBullets.map((bullet, i) => (
              <li key={i} className="marker:text-indigo-400">
                {bullet}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
