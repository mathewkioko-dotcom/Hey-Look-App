import React from 'react';
import { ExpenseSummary } from '../../lib/plugins/expenseTracker';

interface ExpenseWidgetProps {
  summary: ExpenseSummary;
}

export const ExpenseChartWidget: React.FC<ExpenseWidgetProps> = ({ summary }) => {
  const categoryTotals = summary.items.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="my-3 p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-xl font-sans">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5">
          📊 Monthly Expense Summary
        </span>
        <span className="text-lg font-bold text-white font-mono">
          {summary.currency} {summary.total.toFixed(2)}
        </span>
      </div>

      <div className="space-y-2.5 mb-4">
        {Object.entries(categoryTotals).map(([category, totalVal]) => {
          const total = Number(totalVal);
          const percentage = Math.round((total / summary.total) * 100) || 0;
          return (
            <div key={category} className="space-y-1">
              <div className="flex justify-between text-xs text-slate-300">
                <span className="font-medium">{category}</span>
                <span className="font-mono text-slate-400">
                  {summary.currency} {total.toFixed(2)} ({percentage}%)
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-slate-800/80 pt-2.5 space-y-1.5">
        {summary.items.map((item) => (
          <div key={item.id} className="flex justify-between items-center text-xs text-slate-400">
            <span>
              {item.description} <span className="text-slate-500">({item.date})</span>
            </span>
            <span className="font-mono text-slate-200">
              {summary.currency} {item.amount.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
