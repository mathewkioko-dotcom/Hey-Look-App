import React, { useState } from 'react';
import { Utensils, Flame, ChevronDown, ChevronUp, Apple } from 'lucide-react';
import { MealPlanData } from '../../lib/plugins/mealPlanner';

interface MealWidgetProps {
  plan: MealPlanData;
}

export const MealPlannerWidget: React.FC<MealWidgetProps> = ({ plan }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const meals = plan.meals || [];

  return (
    <div className="my-3 p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-xl font-sans">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Utensils className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold text-emerald-400 block uppercase tracking-wider font-mono">
              Daily Meal Plan
            </span>
            <h4 className="text-sm font-bold text-white leading-tight">{plan.dayTitle}</h4>
          </div>
        </div>
        <span className="text-xs px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-full font-mono font-medium border border-emerald-500/20 flex items-center gap-1 shrink-0">
          <Flame className="w-3.5 h-3.5 text-emerald-400" />
          {plan.totalCalories} kcal
        </span>
      </div>

      <div className="space-y-2">
        {meals.map((meal, idx) => {
          const isExpanded = expandedIndex === idx;
          return (
            <div key={idx} className="p-3 bg-slate-900 rounded-xl border border-slate-800/80 transition-colors">
              <div
                className="flex justify-between items-center cursor-pointer select-none"
                onClick={() => setExpandedIndex(isExpanded ? null : idx)}
              >
                <div>
                  <span className="text-[10px] uppercase font-mono text-emerald-400 block font-semibold">
                    {meal.time}
                  </span>
                  <span className="text-xs font-semibold text-slate-200">{meal.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400">{meal.calories} kcal</span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 space-y-2 text-xs">
                  <div className="flex gap-4 text-[11px] font-mono text-slate-400 bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <span>
                      P: <strong className="text-slate-200">{meal.macros?.protein}</strong>
                    </span>
                    <span>
                      C: <strong className="text-slate-200">{meal.macros?.carbs}</strong>
                    </span>
                    <span>
                      F: <strong className="text-slate-200">{meal.macros?.fats}</strong>
                    </span>
                  </div>
                  {meal.ingredients && meal.ingredients.length > 0 && (
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1 font-semibold flex items-center gap-1">
                        <Apple className="w-3 h-3 text-emerald-400" />
                        Ingredients:
                      </span>
                      <ul className="list-disc list-inside text-slate-300 text-[11px] space-y-0.5 leading-relaxed pl-1">
                        {meal.ingredients.map((ing, i) => (
                          <li key={i} className="marker:text-emerald-400">{ing}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
