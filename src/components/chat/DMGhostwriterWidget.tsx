import React, { useState } from 'react';
import { MessageSquare, Copy, Check, User } from 'lucide-react';
import { DMGhostwriterData } from '../../lib/plugins/dmGhostwriter';

interface DMGhostwriterProps {
  data: DMGhostwriterData;
}

export const DMGhostwriterWidget: React.FC<DMGhostwriterProps> = ({ data }) => {
  const [copiedTone, setCopiedTone] = useState<string | null>(null);

  const handleCopy = (text: string, tone: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTone(tone);
    setTimeout(() => setCopiedTone(null), 2000);
  };

  return (
    <div className="my-3 p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-xl font-sans">
      <div className="flex justify-between items-center mb-2.5 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <MessageSquare className="w-4 h-4" />
          </div>
          <span className="text-sm font-semibold text-sky-400">DM Ghostwriter ({data.platform})</span>
        </div>
        <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
          <User className="w-3 h-3 text-slate-500" />
          From: {data.senderName}
        </span>
      </div>

      <div className="bg-slate-900/80 p-3 rounded-xl mb-3 border border-slate-800/80">
        <div className="text-[10px] uppercase tracking-wider font-mono text-slate-400 mb-1 font-semibold">
          Incoming Message:
        </div>
        <p className="text-xs text-slate-200 italic leading-relaxed">"{data.incomingMessage}"</p>
      </div>

      <div className="space-y-2">
        {data.replies.map((reply) => (
          <div
            key={reply.tone}
            className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex justify-between items-center gap-3 hover:border-slate-700 transition-colors"
          >
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-sky-400 block mb-0.5 font-mono">
                {reply.tone}
              </span>
              <p className="text-xs text-slate-200 leading-relaxed">{reply.text}</p>
            </div>
            <button
              onClick={() => handleCopy(reply.text, reply.tone)}
              className="px-3 py-1.5 text-[11px] font-medium bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 rounded-lg border border-sky-500/20 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              {copiedTone === reply.tone ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
