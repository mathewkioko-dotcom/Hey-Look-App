import React, { useState } from 'react';
import { Scale, ChevronDown, ChevronUp, AlertTriangle, ShieldAlert, Info, Lightbulb } from 'lucide-react';
import { ContractAnalysisData } from '../../lib/plugins/contractAnalyzer';

export const ContractAnalyzerWidget: React.FC<{ analysis: ContractAnalysisData }> = ({ analysis }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const riskBadgeStyles = {
    'High Risk': 'bg-rose-500/10 text-rose-400 border-rose-500/30 font-semibold',
    'Moderate Risk': 'bg-amber-500/10 text-amber-400 border-amber-500/30 font-semibold',
    'Safe': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-semibold',
  }[analysis.overallRisk] || 'bg-slate-800 text-slate-300 border-slate-700';

  const severityColors = {
    high: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
    medium: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
    low: 'text-sky-400 border-sky-500/30 bg-sky-500/10',
  };

  const severityIcons = {
    high: <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />,
    medium: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />,
    low: <Info className="w-3.5 h-3.5 text-sky-400" />,
  };

  const risks = analysis.risks || [];

  return (
    <div className="my-3 p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-xl font-sans">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold text-amber-400 block uppercase tracking-wider font-mono">
              Legal & Contract Review
            </span>
            <h4 className="text-sm font-bold text-white leading-tight">{analysis.documentTitle}</h4>
          </div>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-xl font-mono border shrink-0 ${riskBadgeStyles}`}>
          {analysis.overallRisk}
        </span>
      </div>

      {risks.length > 0 && (
        <div className="space-y-2 mb-3">
          <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold block">
            Flagged Clause Risks ({risks.length}):
          </span>
          {risks.map((risk, idx) => {
            const isExpanded = expandedIndex === idx;
            return (
              <div key={idx} className="p-3 bg-slate-900/90 rounded-xl border border-slate-800/80 text-xs">
                <div
                  className="flex justify-between items-center cursor-pointer select-none"
                  onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <span
                      className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-md border uppercase flex items-center gap-1 shrink-0 ${
                        severityColors[risk.severity] || severityColors.low
                      }`}
                    >
                      {severityIcons[risk.severity] || severityIcons.low}
                      {risk.severity}
                    </span>
                    <span className="font-semibold text-slate-200 truncate">{risk.clauseName}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </div>

                {isExpanded && (
                  <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 space-y-2 text-xs">
                    <p className="text-slate-300 leading-relaxed">{risk.explanation}</p>
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-emerald-400 flex items-start gap-1.5 leading-relaxed">
                      <Lightbulb className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Suggested Counter-Clause: {risk.mitigation}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {analysis.keyTakeaways && analysis.keyTakeaways.length > 0 && (
        <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800/80">
          <span className="text-[10px] uppercase font-mono text-amber-400 block mb-1.5 font-semibold">
            Key Takeaways:
          </span>
          <ul className="list-disc list-inside text-xs text-slate-300 space-y-1 leading-relaxed pl-1">
            {analysis.keyTakeaways.map((takeaway, i) => (
              <li key={i} className="marker:text-amber-400">
                {takeaway}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
