import React, { useState } from 'react';
import { Target, HelpCircle, Eye, Lightbulb, CheckCircle2, ChevronLeft, ChevronRight, Building } from 'lucide-react';
import { InterviewPrepData } from '../../lib/plugins/interviewPrep';

export const InterviewPrepWidget: React.FC<{ prep: InterviewPrepData }> = ({ prep }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const questions = prep.questions || [];
  const currentQ = questions[activeIdx];

  if (!currentQ) return null;

  return (
    <div className="my-3 p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-xl font-sans">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold text-orange-400 block uppercase tracking-wider font-mono">
              Mock Interview Practice
            </span>
            <h4 className="text-sm font-bold text-white leading-tight flex items-center gap-1.5">
              {prep.targetRole}
              {prep.companyName && (
                <span className="text-slate-400 font-normal flex items-center gap-1 text-xs">
                  <Building className="w-3 h-3 text-orange-400" />
                  @{prep.companyName}
                </span>
              )}
            </h4>
          </div>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 bg-orange-500/10 text-orange-300 rounded-xl border border-orange-500/20 font-medium shrink-0">
          {prep.difficultyLevel || 'Practice'} Level
        </span>
      </div>

      <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800/80 space-y-3 shadow-inner">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-mono uppercase text-orange-400 font-semibold flex items-center gap-1">
            <HelpCircle className="w-3 h-3" />
            Question {activeIdx + 1} of {questions.length} • {currentQ.category}
          </span>
        </div>

        <p className="text-sm font-semibold text-slate-100 leading-relaxed">{currentQ.question}</p>

        {currentQ.starHint && (
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-xs">
            <span className="text-[10px] font-mono text-amber-400 uppercase font-bold block mb-1 flex items-center gap-1">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              STAR Strategy:
            </span>
            <p className="text-slate-300 leading-relaxed">{currentQ.starHint}</p>
          </div>
        )}

        {showAnswer ? (
          <div className="p-3.5 bg-emerald-950/40 rounded-xl border border-emerald-500/30 text-xs space-y-1.5 animate-fadeIn">
            <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase block flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Model Response:
            </span>
            <p className="text-emerald-100 leading-relaxed">{currentQ.modelAnswer}</p>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowAnswer(true)}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300 rounded-xl border border-slate-700 transition-all cursor-pointer flex items-center justify-center gap-1.5 font-medium"
          >
            <Eye className="w-3.5 h-3.5 text-orange-400" />
            Reveal Ideal Answer
          </button>
        )}
      </div>

      <div className="flex justify-between items-center mt-3">
        <button
          type="button"
          onClick={() => {
            setShowAnswer(false);
            setActiveIdx((prev) => Math.max(0, prev - 1));
          }}
          disabled={activeIdx === 0}
          className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 border border-slate-800 text-xs font-mono text-slate-300 rounded-xl transition-all cursor-pointer flex items-center gap-1 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Previous
        </button>
        <button
          type="button"
          onClick={() => {
            setShowAnswer(false);
            setActiveIdx((prev) => Math.min(questions.length - 1, prev + 1));
          }}
          disabled={activeIdx === questions.length - 1}
          className="px-3.5 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 text-xs font-mono text-orange-300 font-medium rounded-xl transition-all cursor-pointer flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next Question <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
