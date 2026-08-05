import React, { useState } from 'react';
import { GraduationCap, Sparkles, BookOpen } from 'lucide-react';
import { SkillCourseData } from '../../lib/plugins/skillCourse';

interface SkillCourseProps {
  course: SkillCourseData;
}

export const SkillCourseWidget: React.FC<SkillCourseProps> = ({ course }) => {
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const days = course.days || [];
  const activeDay = days[activeDayIndex] || days[0];

  return (
    <div className="my-3 p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-xl font-sans">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold text-amber-400 block uppercase tracking-wider font-mono">
              Bite-Sized Learning
            </span>
            <h4 className="text-sm font-bold text-white leading-tight">{course.courseTitle}</h4>
          </div>
        </div>
        <span className="text-xs px-2.5 py-1 bg-amber-500/10 text-amber-300 rounded-full font-mono font-medium border border-amber-500/20 shrink-0">
          Day {activeDayIndex + 1} of {course.totalDays || days.length}
        </span>
      </div>

      <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1 scrollbar-thin">
        {days.map((day, idx) => (
          <button
            key={day.dayNumber || idx}
            onClick={() => setActiveDayIndex(idx)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeDayIndex === idx
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            Day {day.dayNumber}
          </button>
        ))}
      </div>

      {activeDay && (
        <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800/80 text-xs">
          <div className="flex items-center gap-1.5 mb-1.5 text-slate-200 font-semibold">
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>{activeDay.title}</span>
          </div>
          <p className="text-slate-300 mb-3 leading-relaxed">{activeDay.summary}</p>

          {activeDay.takeaways && activeDay.takeaways.length > 0 && (
            <div className="border-t border-slate-800 pt-2.5 space-y-1.5">
              <span className="text-[10px] text-amber-400 font-mono uppercase tracking-wider font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Key Insights:
              </span>
              <ul className="list-disc list-inside text-slate-300 space-y-1 leading-relaxed pl-1">
                {activeDay.takeaways.map((point, i) => (
                  <li key={i} className="marker:text-amber-400">{point}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
