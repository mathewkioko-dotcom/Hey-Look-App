import React, { useState } from 'react';
import { Languages, Volume2, ArrowLeft, ArrowRight, BookOpen } from 'lucide-react';
import { VocabBuilderData } from '../../lib/plugins/vocabBuilder';

export const VocabBuilderWidget: React.FC<{ data: VocabBuilderData }> = ({ data }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const words = data.words || [];
  const currentWord = words[activeIdx];

  if (!currentWord) return null;

  return (
    <div className="my-3 p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-xl font-sans">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Languages className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold text-emerald-400 block uppercase tracking-wider font-mono">
              Vocab Practice ({data.targetLanguage || 'Language'})
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-500/10 text-emerald-300 rounded border border-emerald-500/20">
              Level {data.cefrLevel || 'General'}
            </span>
          </div>
        </div>
        <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800">
          {activeIdx + 1} / {words.length}
        </span>
      </div>

      <div className="p-5 bg-slate-900/90 rounded-2xl border border-slate-800/80 text-center space-y-3 shadow-inner">
        <div className="flex justify-center items-baseline gap-2 flex-wrap">
          <h3 className="text-xl font-bold text-white tracking-wide">{currentWord.word}</h3>
          {currentWord.phonetic && (
            <span className="text-xs text-emerald-400 font-mono flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              <Volume2 className="w-3 h-3 text-emerald-400" />
              [{currentWord.phonetic}]
            </span>
          )}
          {currentWord.partOfSpeech && (
            <span className="text-[11px] text-slate-400 italic">({currentWord.partOfSpeech})</span>
          )}
        </div>
        <p className="text-base font-bold text-emerald-300 tracking-wide">{currentWord.translation}</p>

        {(currentWord.exampleSentence || currentWord.translatedSentence) && (
          <div className="border-t border-slate-800/80 pt-3 text-left space-y-1.5 bg-slate-950 p-3 rounded-xl border">
            {currentWord.exampleSentence && (
              <p className="text-xs text-slate-200 font-medium italic leading-relaxed">
                "{currentWord.exampleSentence}"
              </p>
            )}
            {currentWord.translatedSentence && (
              <p className="text-[11px] text-slate-400 leading-relaxed">
                "{currentWord.translatedSentence}"
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mt-3">
        <button
          type="button"
          onClick={() => setActiveIdx((prev) => Math.max(0, prev - 1))}
          disabled={activeIdx === 0}
          className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 border border-slate-800 text-xs font-mono text-slate-300 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Prev
        </button>
        <button
          type="button"
          onClick={() => setActiveIdx((prev) => Math.min(words.length - 1, prev + 1))}
          disabled={activeIdx === words.length - 1}
          className="px-3.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-xs font-mono text-emerald-300 font-medium rounded-xl transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
