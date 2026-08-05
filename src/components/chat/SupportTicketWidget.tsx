import React, { useState } from 'react';
import { Headphones, Copy, Check, Lightbulb, User } from 'lucide-react';
import { SupportTicketData } from '../../lib/plugins/supportTicket';

export const SupportTicketWidget: React.FC<{ ticket: SupportTicketData }> = ({ ticket }) => {
  const [copied, setCopied] = useState(false);

  const sentimentStyles: Record<string, string> = {
    Frustrated: 'bg-rose-500/10 text-rose-400 border-rose-500/30 font-semibold',
    Urgent: 'bg-amber-500/10 text-amber-400 border-amber-500/30 font-semibold',
    Neutral: 'bg-slate-800 text-slate-300 border-slate-700 font-semibold',
    Satisfied: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-semibold',
  };

  const handleCopyReply = () => {
    if (ticket.draftResponse) {
      navigator.clipboard.writeText(ticket.draftResponse);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="my-3 p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-xl font-sans">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Headphones className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold text-rose-400 block uppercase tracking-wider font-mono">
              Support Triage Assistant
            </span>
            <h4 className="text-sm font-bold text-white leading-tight flex items-center gap-1.5">
              Ticket #{ticket.ticketId}
              <span className="text-slate-400 font-normal text-xs flex items-center gap-1">
                <User className="w-3 h-3 text-slate-400" />
                {ticket.customerName}
              </span>
            </h4>
          </div>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-xl font-mono border shrink-0 ${sentimentStyles[ticket.sentiment] || sentimentStyles.Neutral}`}>
          {ticket.sentiment}
        </span>
      </div>

      <div className="space-y-2 mb-3 text-xs">
        {ticket.issueSummary && (
          <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800/80">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold block mb-1">Issue Summary:</span>
            <p className="text-slate-200 leading-relaxed">{ticket.issueSummary}</p>
          </div>
        )}

        {ticket.suggestedAction && (
          <div className="p-2.5 bg-sky-950/30 rounded-xl border border-sky-500/20 text-sky-200 font-mono text-[11px] flex items-start gap-1.5 leading-relaxed">
            <Lightbulb className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
            <span>Recommended Action: {ticket.suggestedAction}</span>
          </div>
        )}
      </div>

      {ticket.draftResponse && (
        <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800/80 space-y-2">
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
            <span className="font-semibold uppercase text-slate-400">SUGGESTED RESPONSE DRAFT</span>
            <button
              type="button"
              onClick={handleCopyReply}
              className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-lg transition-all cursor-pointer font-medium flex items-center gap-1"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-rose-300" /> Copied Response! ✓
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-rose-300" /> Copy Draft
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-slate-300 italic whitespace-pre-wrap leading-relaxed bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            "{ticket.draftResponse}"
          </p>
        </div>
      )}
    </div>
  );
};
