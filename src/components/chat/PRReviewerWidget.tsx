import React from 'react';
import { GitPullRequest, User, Plus, Minus, FileCode, CheckCircle, AlertOctagon, MessageSquare } from 'lucide-react';
import { PRReviewData } from '../../lib/plugins/prReviewer';

export const PRReviewerWidget: React.FC<{ review: PRReviewData }> = ({ review }) => {
  const statusBadge = {
    Approve: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-semibold',
    'Request Changes': 'bg-rose-500/10 text-rose-400 border-rose-500/30 font-semibold',
    Comment: 'bg-amber-500/10 text-amber-400 border-amber-500/30 font-semibold',
  }[review.overallStatus] || 'bg-slate-800 text-slate-300 border-slate-700';

  const files = review.files || [];

  return (
    <div className="my-3 p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-xl font-sans">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <GitPullRequest className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold text-indigo-400 block uppercase tracking-wider font-mono">
              Pull Request Review
            </span>
            <h4 className="text-sm font-bold text-white leading-tight">
              #{review.prNumber}: {review.prTitle}
            </h4>
          </div>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-xl font-mono border shrink-0 ${statusBadge}`}>
          {review.overallStatus}
        </span>
      </div>

      <div className="flex items-center gap-3 text-xs font-mono mb-3 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800/80">
        <span className="text-slate-400 flex items-center gap-1">
          <User className="w-3.5 h-3.5 text-indigo-400" />
          <strong className="text-slate-200">@{review.author}</strong>
        </span>
        <span className="text-emerald-400 flex items-center gap-0.5 font-bold">
          <Plus className="w-3 h-3" />
          {review.totalAdditions}
        </span>
        <span className="text-rose-400 flex items-center gap-0.5 font-bold">
          <Minus className="w-3 h-3" />
          {review.totalDeletions}
        </span>
      </div>

      {review.summary && (
        <p className="text-xs text-slate-300 mb-3 bg-slate-900/50 p-3 rounded-xl border border-slate-800/60 leading-relaxed">
          {review.summary}
        </p>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold block flex items-center gap-1">
            <FileCode className="w-3.5 h-3.5 text-indigo-400" />
            Reviewed Files ({files.length}):
          </span>
          {files.map((file, idx) => (
            <div key={idx} className="p-3 bg-slate-900/90 rounded-xl border border-slate-800/80 text-xs hover:border-slate-700 transition-colors">
              <div className="flex justify-between items-center mb-1 font-mono text-[11px]">
                <span className="text-slate-200 font-semibold truncate max-w-[240px]">{file.filename}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-emerald-400 font-medium">+{file.additions}</span>
                  <span className="text-rose-400 font-medium">-{file.deletions}</span>
                </div>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed mt-1 pl-2 border-l border-indigo-500/30">{file.feedback}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
