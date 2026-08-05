import React, { useState } from 'react';
import { Map, Sparkles } from 'lucide-react';
import { RoadmapPlannerData } from '../../lib/plugins/roadmapPlanner';

export const RoadmapPlannerWidget: React.FC<{ data: RoadmapPlannerData }> = ({ data }) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  const statusStyles: Record<string, string> = {
    Planned: 'bg-amber-500/10 text-amber-400 border-amber-500/30 font-semibold',
    'In Progress': 'bg-sky-500/10 text-sky-400 border-sky-500/30 font-semibold',
    Shipped: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-semibold',
  };

  const items = data.items || [];
  const filteredItems = selectedStatus === 'All'
    ? items
    : items.filter((item) => item.status === selectedStatus);

  return (
    <div className="my-3 p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-xl font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3 pb-2.5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Map className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold text-sky-400 block uppercase tracking-wider font-mono">
              Product Roadmap
            </span>
            <h4 className="text-sm font-bold text-white leading-tight">{data.projectName}</h4>
          </div>
        </div>
        <div className="flex gap-1 text-[10px] font-mono flex-wrap">
          {['All', 'Planned', 'In Progress', 'Shipped'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setSelectedStatus(status)}
              className={`px-2.5 py-1 rounded-xl border transition-all cursor-pointer font-medium ${
                selectedStatus === status
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-sm'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {data.visionSummary && (
        <p className="text-xs text-slate-300 mb-3 bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/60 leading-relaxed">
          {data.visionSummary}
        </p>
      )}

      <div className="space-y-2">
        {filteredItems.map((item) => (
          <div key={item.id || item.featureName} className="p-3 bg-slate-900/90 rounded-xl border border-slate-800/80 text-xs space-y-2 hover:border-slate-700 transition-colors">
            <div className="flex justify-between items-center gap-2">
              <span className="font-semibold text-slate-100">{item.featureName}</span>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${statusStyles[item.status] || 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                  {item.status}
                </span>
                <span className="text-[10px] font-mono bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded-md border border-purple-500/20 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  RICE: {item.riceScore}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-800/50">
              <span className="text-sky-400 font-medium">{item.quarter}</span>
              {item.tags && item.tags.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {item.tags.map((tag, idx) => (
                    <span key={idx} className="bg-slate-950 text-slate-400 px-1.5 py-0.5 rounded border border-slate-800">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
