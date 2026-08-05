import React, { useState } from 'react';
import { Compass, Wallet, MapPin, Clock, DollarSign } from 'lucide-react';
import { TravelPlanData } from '../../lib/plugins/travelPlanner';

export const TravelPlannerWidget: React.FC<{ plan: TravelPlanData }> = ({ plan }) => {
  const [activeDayIdx, setActiveDayIdx] = useState(0);
  const days = plan.days || [];
  const currentDay = days[activeDayIdx] || days[0];

  return (
    <div className="my-3 p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-xl font-sans">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold text-teal-400 block uppercase tracking-wider font-mono">
              Trip Itinerary • {plan.durationDays || days.length} Days
            </span>
            <h4 className="text-sm font-bold text-white leading-tight">{plan.destination}</h4>
          </div>
        </div>
        <span className="text-xs px-2.5 py-1 bg-teal-500/10 text-teal-300 rounded-full font-mono font-medium border border-teal-500/20 flex items-center gap-1 shrink-0">
          <Wallet className="w-3.5 h-3.5 text-teal-400" />
          {plan.totalBudget}
        </span>
      </div>

      <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1 scrollbar-thin">
        {days.map((day, idx) => (
          <button
            key={day.dayNumber || idx}
            type="button"
            onClick={() => setActiveDayIdx(idx)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeDayIdx === idx
                ? 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            Day {day.dayNumber}
          </button>
        ))}
      </div>

      {currentDay && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-400 mb-1 flex items-center justify-between border-b border-slate-800/80 pb-1.5">
            <span>{currentDay.dateOrTitle}</span>
            <span className="text-[10px] font-mono text-slate-500">{currentDay.activities?.length || 0} stops</span>
          </div>
          {(currentDay.activities || []).map((act, i) => (
            <div key={i} className="p-3 bg-slate-900/90 rounded-xl border border-slate-800/80 text-xs hover:border-slate-700 transition-colors">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-mono text-teal-400 font-semibold flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {act.time}
                </span>
                <span className="text-[10px] font-mono text-slate-400 flex items-center gap-0.5">
                  <DollarSign className="w-3 h-3 text-emerald-400" />
                  {act.estimatedCost}
                </span>
              </div>
              <p className="font-semibold text-slate-200 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                {act.location}
              </p>
              <p className="text-slate-400 text-[11px] mt-1 leading-relaxed pl-4 border-l border-slate-800">{act.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
