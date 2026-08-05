import React from 'react';
import { Search, CheckCircle2, AlertTriangle, XCircle, HelpCircle, ExternalLink } from 'lucide-react';
import { FactCheckClaim } from '../../lib/plugins/factChecker';

export const FactCheckWidget: React.FC<{ fact: FactCheckClaim }> = ({ fact }) => {
  const verdictKey = fact.verdict || 'unverified';
  const badgeStyles = {
    verified: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    false: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    misleading: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    unverified: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  }[verdictKey] || 'bg-slate-500/10 text-slate-400 border-slate-500/30';

  const verdictIcon = {
    verified: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
    false: <XCircle className="w-3.5 h-3.5 text-rose-400" />,
    misleading: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />,
    unverified: <HelpCircle className="w-3.5 h-3.5 text-slate-400" />,
  }[verdictKey];

  const sources = fact.sources || [];

  return (
    <div className="my-3 p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-xl font-sans">
      <div className="flex justify-between items-center mb-2.5 pb-2 border-b border-slate-800">
        <span className="text-xs font-semibold text-cyan-400 flex items-center gap-1.5">
          <Search className="w-3.5 h-3.5" />
          Real-Time Fact Check
        </span>
        <span className={`text-xs px-2.5 py-0.5 rounded-full border font-mono font-medium capitalize flex items-center gap-1 ${badgeStyles}`}>
          {verdictIcon}
          {verdictKey} ({fact.confidenceScore ?? 0}%)
        </span>
      </div>
      <p className="text-xs text-slate-200 font-medium mb-2 italic leading-relaxed">"{fact.claim}"</p>
      <p className="text-xs text-slate-300 mb-3 leading-relaxed">{fact.explanation}</p>
      {sources.length > 0 && (
        <div className="border-t border-slate-800 pt-2 text-[11px] text-slate-400 font-mono flex items-center gap-1.5 flex-wrap">
          <ExternalLink className="w-3 h-3 text-slate-500" />
          <span className="font-semibold text-slate-500">Sources:</span>
          <span>{sources.join(', ')}</span>
        </div>
      )}
    </div>
  );
};
