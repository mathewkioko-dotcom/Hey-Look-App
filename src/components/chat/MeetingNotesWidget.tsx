import React, { useState } from 'react';
import { FileText, CheckSquare, Calendar, Clock, User, CheckCircle2 } from 'lucide-react';
import { MeetingNotesData } from '../../lib/plugins/meetingNotes';

export const MeetingNotesWidget: React.FC<{ notes: MeetingNotesData }> = ({ notes }) => {
  const [items, setItems] = useState(notes.actionItems || []);

  const toggleTask = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const keyDecisions = notes.keyDecisions || [];

  return (
    <div className="my-3 p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-xl font-sans">
      <div className="flex justify-between items-center mb-3 pb-2.5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold text-sky-400 block uppercase tracking-wider font-mono">
              Meeting Summary
            </span>
            <h4 className="text-sm font-bold text-white leading-tight">{notes.title}</h4>
          </div>
        </div>
        <div className="text-right shrink-0 font-mono text-[11px] text-slate-400 flex items-center gap-2 bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-sky-400" />
            {notes.date}
          </span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-sky-400" />
            {notes.duration}
          </span>
        </div>
      </div>

      {keyDecisions.length > 0 && (
        <div className="mb-3 space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold block">Key Decisions:</span>
          <ul className="list-disc list-inside text-xs text-slate-200 space-y-1 leading-relaxed pl-1">
            {keyDecisions.map((decision, idx) => (
              <li key={idx} className="marker:text-sky-400">{decision}</li>
            ))}
          </ul>
        </div>
      )}

      {items.length > 0 && (
        <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800/80 space-y-2">
          <span className="text-[10px] font-mono text-sky-400 uppercase block font-semibold flex items-center gap-1">
            <CheckSquare className="w-3.5 h-3.5" />
            Action Items ({items.filter(i => i.completed).length}/{items.length} completed):
          </span>
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center text-xs bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 hover:border-slate-700 transition-colors gap-2"
              >
                <label className="flex items-center gap-2.5 cursor-pointer select-none min-w-0 flex-1">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => toggleTask(item.id)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-0 accent-sky-500 cursor-pointer"
                  />
                  <span className={`leading-relaxed truncate ${item.completed ? 'line-through text-slate-500' : 'text-slate-200 font-medium'}`}>
                    {item.task}
                  </span>
                </label>
                <div className="flex items-center gap-2 font-mono text-[10px] shrink-0">
                  <span className="px-2 py-0.5 bg-sky-500/10 text-sky-300 rounded-md border border-sky-500/20 flex items-center gap-1 font-medium">
                    <User className="w-3 h-3 text-sky-400" />
                    @{item.assignee}
                  </span>
                  <span className="text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">{item.dueDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
