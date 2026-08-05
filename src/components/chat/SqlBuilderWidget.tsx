import React, { useState } from 'react';
import { Database, Copy, Check, Terminal, Code2 } from 'lucide-react';
import { SqlBuilderData } from '../../lib/plugins/sqlBuilder';

export const SqlBuilderWidget: React.FC<{ query: SqlBuilderData }> = ({ query }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (query.sql) {
      navigator.clipboard.writeText(query.sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="my-3 p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-xl font-sans">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold text-purple-400 block uppercase tracking-wider font-mono">
              SQL Query Builder
            </span>
            <h4 className="text-sm font-bold text-white leading-tight">
              {query.queryName || 'SQL Query'}
            </h4>
          </div>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 bg-purple-500/10 text-purple-300 rounded-xl border border-purple-500/20 font-medium shrink-0">
          {query.dialect || 'PostgreSQL'}
        </span>
      </div>

      {query.sql && (
        <div className="bg-slate-900 rounded-xl border border-slate-800/80 overflow-hidden mb-3">
          <div className="flex justify-between items-center px-3 py-2 bg-slate-950/80 border-b border-slate-800/80 text-[10px] font-mono text-slate-400">
            <span className="flex items-center gap-1">
              <Terminal className="w-3 h-3 text-purple-400" />
              SQL STATEMENT
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="px-2 py-0.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded border border-purple-500/30 transition-all cursor-pointer flex items-center gap-1 font-medium"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-purple-300" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-purple-300" /> Copy SQL
                </>
              )}
            </button>
          </div>
          <pre className="p-3 text-xs font-mono text-purple-200 overflow-x-auto whitespace-pre leading-relaxed">
            {query.sql}
          </pre>
        </div>
      )}

      {query.explanation && (
        <p className="text-xs text-slate-300 bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/60 leading-relaxed">
          {query.explanation}
        </p>
      )}

      {query.tables && query.tables.length > 0 && (
        <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-mono text-slate-400 flex-wrap">
          <span className="uppercase text-slate-500 font-semibold">Affected Tables:</span>
          {query.tables.map((t, idx) => (
            <span key={idx} className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-slate-300">
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
