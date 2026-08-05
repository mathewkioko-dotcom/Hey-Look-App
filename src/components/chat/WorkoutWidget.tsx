import React, { useState } from 'react';
import { Dumbbell, Timer, Check, Activity } from 'lucide-react';
import { WorkoutPlanData } from '../../lib/plugins/workoutPlanner';

interface WorkoutWidgetProps {
  plan: WorkoutPlanData;
}

export const WorkoutWidget: React.FC<WorkoutWidgetProps> = ({ plan }) => {
  const [completedSets, setCompletedSets] = useState<Record<string, number>>({});

  const toggleSet = (exerciseName: string, maxSets: number) => {
    setCompletedSets((prev) => {
      const current = prev[exerciseName] || 0;
      return { ...prev, [exerciseName]: current >= maxSets ? 0 : current + 1 };
    });
  };

  const exercises = plan.exercises || [];

  return (
    <div className="my-3 p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-xl font-sans">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <Dumbbell className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold text-orange-400 block uppercase tracking-wider font-mono">
              Workout Routine • {plan.targetMuscleGroup || 'Full Body'}
            </span>
            <h4 className="text-sm font-bold text-white leading-tight">{plan.title}</h4>
          </div>
        </div>
        <span className="text-xs px-2.5 py-1 bg-orange-500/10 text-orange-400 rounded-full font-mono font-medium border border-orange-500/20 flex items-center gap-1 shrink-0">
          <Timer className="w-3.5 h-3.5" />
          {plan.estimatedMinutes} mins
        </span>
      </div>

      <div className="space-y-2.5">
        {exercises.map((ex, idx) => {
          const doneCount = completedSets[ex.name] || 0;
          const isFinished = doneCount === ex.sets;

          return (
            <div
              key={idx}
              className="p-3 bg-slate-900/90 rounded-xl border border-slate-800/80 flex justify-between items-center gap-3 hover:border-slate-700 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <span className="text-xs font-semibold text-slate-200 block truncate">{ex.name}</span>
                <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                  <Activity className="w-3 h-3 text-orange-400" />
                  {ex.sets} sets × {ex.reps} | Rest: {ex.restSeconds}s
                </span>
                {ex.notes && <p className="text-[10px] text-slate-500 italic mt-0.5 leading-tight">{ex.notes}</p>}
              </div>
              <button
                type="button"
                onClick={() => toggleSet(ex.name, ex.sets)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  isFinished
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                }`}
              >
                {isFinished ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{doneCount}/{ex.sets} Done</span>
                  </>
                ) : (
                  <span>
                    {doneCount}/{ex.sets} Done
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
