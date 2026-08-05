import React from 'react';
import { Cloud, DollarSign, Users, Server } from 'lucide-react';
import { TechStackEstimateData } from '../../lib/plugins/techStackEstimator';

export const TechStackEstimatorWidget: React.FC<{ estimate: TechStackEstimateData }> = ({ estimate }) => {
  const breakdown = estimate.breakdown || [];
  const currency = estimate.currency || '$';

  return (
    <div className="my-3 p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-xl font-sans">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Cloud className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold text-cyan-400 block uppercase tracking-wider font-mono">
              Tech Stack Cost Projections
            </span>
            <h4 className="text-sm font-bold text-white leading-tight">{estimate.projectName}</h4>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="text-[10px] font-mono text-slate-400 block flex items-center justify-end gap-1">
            <Users className="w-3 h-3 text-cyan-400" />
            {estimate.projectedUsers}
          </span>
          <span className="text-sm font-bold text-cyan-300 font-mono flex items-center justify-end gap-0.5">
            {currency} {estimate.totalMonthlyCost?.toLocaleString()}/mo
          </span>
        </div>
      </div>

      <div className="space-y-1.5">
        {breakdown.map((item, idx) => {
          const share = Math.round((item.monthlyCost / (estimate.totalMonthlyCost || 1)) * 100) || 0;
          return (
            <div
              key={idx}
              className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800/80 flex justify-between items-center text-xs hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-cyan-400 rounded-md font-mono border border-slate-700/60 font-medium shrink-0">
                  {item.category}
                </span>
                <span className="font-medium text-slate-200 truncate">{item.serviceName}</span>
              </div>
              <span className="font-mono text-slate-300 font-medium shrink-0 ml-2">
                {currency} {item.monthlyCost} ({share}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
