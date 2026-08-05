import React, { useState } from 'react';
import { FileText, Copy, Check, Calendar, User } from 'lucide-react';
import { InvoiceData } from '../../lib/plugins/invoiceGenerator';

export const InvoiceWidget: React.FC<{ invoice: InvoiceData }> = ({ invoice }) => {
  const [copied, setCopied] = useState(false);

  const currency = invoice.currency || '$';
  const items = invoice.items || [];

  const handleCopySummary = () => {
    const summary = `Invoice #${invoice.invoiceNumber} for ${invoice.clientName}\nTotal: ${currency} ${invoice.grandTotal?.toLocaleString()}\nDue: ${invoice.dueDate}`;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-xl font-sans">
      <div className="flex justify-between items-center mb-3 pb-2.5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold text-emerald-400 block uppercase tracking-wider font-mono">
              Invoice Statement
            </span>
            <h4 className="text-sm font-bold text-white leading-tight flex items-center gap-1.5">
              #{invoice.invoiceNumber}
              <span className="text-slate-400 font-normal text-xs flex items-center gap-1">
                <User className="w-3 h-3 text-slate-400" />
                {invoice.clientName}
              </span>
            </h4>
          </div>
        </div>
        <button
          type="button"
          onClick={handleCopySummary}
          className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-mono rounded-xl transition-all cursor-pointer font-medium flex items-center gap-1 shrink-0"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-300" /> Copied Summary! ✓
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 text-emerald-300" /> Copy Details
            </>
          )}
        </button>
      </div>

      <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800/80 mb-3 overflow-x-auto">
        <div className="grid grid-cols-12 text-[10px] font-mono text-slate-400 uppercase pb-1.5 border-b border-slate-800 mb-2 font-semibold">
          <div className="col-span-6">Description</div>
          <div className="col-span-2 text-center">Qty</div>
          <div className="col-span-2 text-right">Price</div>
          <div className="col-span-2 text-right">Amount</div>
        </div>

        <div className="space-y-1.5 text-xs">
          {items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-12 items-center text-slate-200">
              <div className="col-span-6 truncate font-medium pr-1">{item.description}</div>
              <div className="col-span-2 text-center font-mono text-slate-400">{item.quantity}</div>
              <div className="col-span-2 text-right font-mono text-slate-400">
                {currency}
                {item.unitPrice}
              </div>
              <div className="col-span-2 text-right font-mono text-emerald-400 font-medium">
                {currency}
                {item.amount}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80 space-y-1.5 text-xs font-mono">
        <div className="flex justify-between text-slate-400">
          <span>Subtotal:</span>
          <span>
            {currency} {invoice.subtotal?.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>Tax ({invoice.taxPercent}%):</span>
          <span>
            {currency} {invoice.taxTotal?.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between text-emerald-300 font-bold text-sm pt-2 border-t border-slate-800">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            Total Due ({invoice.dueDate}):
          </span>
          <span>
            {currency} {invoice.grandTotal?.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};
