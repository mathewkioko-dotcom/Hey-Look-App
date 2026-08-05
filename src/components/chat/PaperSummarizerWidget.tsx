import React from 'react';
import { BookOpen, Users, FlaskConical, AlertCircle, CheckCircle2 } from 'lucide-react';
import { PaperSummaryData } from '../../lib/plugins/paperSummarizer';

export const PaperSummarizerWidget: React.FC<{ data: PaperSummaryData }> = ({ data }) => {
  const confidenceBadges: Record<string, string> = {
    High: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-semibold',
    Moderate: 'bg-amber-500/10 text-amber-400 border-amber-500/30 font-semibold',
    Exploratory: 'bg-purple-500/10 text-purple-400 border-purple-500/30 font-semibold',
  };

  const authors = data.authors || [];
  const keyFindings = data.keyFindings || [];
  const limitations = data.limitations || [];

  return (
    <div className="my-3 p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-xl font-sans">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold text-indigo-400 block uppercase tracking-wider font-mono">
              Academic Research Summary
            </span>
            <h4 className="text-sm font-bold text-white leading-tight mt-0.5">{data.title}</h4>
          </div>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 bg-indigo-500/10 text-indigo-300 rounded-xl border border-indigo-500/20 whitespace-nowrap ml-2 font-medium shrink-0">
          {data.publicationYear} • {data.field}
        </span>
      </div>

      {authors.length > 0 && (
        <div className="text-[11px] font-mono text-slate-400 mb-3 flex items-center gap-1.5 bg-slate-900/90 p-2 rounded-xl border border-slate-800/80">
          <Users className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span>
            Authors: <span className="text-slate-200 font-medium">{authors.join(', ')}</span>
          </span>
        </div>
      )}

      {data.methodology && (
        <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800/80 text-xs mb-3">
          <span className="text-[10px] font-mono text-indigo-400 uppercase font-bold block mb-1 flex items-center gap-1">
            <FlaskConical className="w-3.5 h-3.5 text-indigo-400" />
            Methodology:
          </span>
          <p className="text-slate-300 leading-relaxed">{data.methodology}</p>
        </div>
      )}

      {keyFindings.length > 0 && (
        <div className="space-y-2 mb-3">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold block flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
            Key Empirical Findings ({keyFindings.length}):
          </span>
          {keyFindings.map((finding, idx) => (
            <div
              key={idx}
              className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800/80 flex justify-between items-start text-xs gap-2 hover:border-slate-700 transition-colors"
            >
              <span className="text-slate-200 leading-relaxed font-medium">{finding.claim}</span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-md border whitespace-nowrap shrink-0 ${
                  confidenceBadges[finding.confidence] || 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                {finding.confidence}
              </span>
            </div>
          ))}
        </div>
      )}

      {limitations.length > 0 && (
        <div className="p-3 bg-rose-950/20 rounded-xl border border-rose-500/20 text-xs">
          <span className="text-[10px] font-mono text-rose-400 uppercase font-bold block mb-1.5 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            Noted Limitations:
          </span>
          <ul className="list-disc list-inside text-slate-300 space-y-1 text-[11px] leading-relaxed pl-1">
            {limitations.map((item, idx) => (
              <li key={idx} className="marker:text-rose-400">
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
