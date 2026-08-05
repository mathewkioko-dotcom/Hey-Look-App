import React from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert, Info, Lightbulb, Code2 } from 'lucide-react';
import { CodeAuditData } from '../../lib/plugins/codeAudit';

export const CodeAuditWidget: React.FC<{ audit: CodeAuditData }> = ({ audit }) => {
  const severityColors = {
    critical: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
    warning: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
    info: 'text-sky-400 border-sky-500/30 bg-sky-500/10',
  };

  const severityIcons = {
    critical: <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />,
    warning: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />,
    info: <Info className="w-3.5 h-3.5 text-sky-400" />,
  };

  const issues = audit.issues || [];

  return (
    <div className="my-3 p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-xl font-sans">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold text-rose-400 block uppercase tracking-wider font-mono">
              Code Security Audit ({audit.language || 'Code'})
            </span>
            <span className="text-[11px] text-slate-400 font-mono">Static Analysis & Patching</span>
          </div>
        </div>
        <span className="text-xs font-mono font-bold px-2.5 py-1 bg-slate-900 border border-slate-800 text-slate-200 rounded-xl shadow-sm">
          Score: <span className={audit.securityScore >= 80 ? 'text-emerald-400' : audit.securityScore >= 50 ? 'text-amber-400' : 'text-rose-400'}>{audit.securityScore}</span>/100
        </span>
      </div>

      <div className="space-y-2">
        {issues.map((issue, idx) => (
          <div key={idx} className="p-3 bg-slate-900/90 rounded-xl border border-slate-800/80 text-xs">
            <div className="flex justify-between items-center mb-1.5">
              <span
                className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-md border uppercase flex items-center gap-1 ${
                  severityColors[issue.severity] || severityColors.info
                }`}
              >
                {severityIcons[issue.severity] || severityIcons.info}
                {issue.severity} | Line {issue.line}
              </span>
            </div>
            <p className="text-slate-200 font-medium mb-2 leading-relaxed">{issue.message}</p>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-emerald-400 flex items-start gap-1.5 leading-relaxed">
              <Lightbulb className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>Fix: {issue.suggestion}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
