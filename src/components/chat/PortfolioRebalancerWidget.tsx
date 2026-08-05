import React from 'react';
import { PieChart, TrendingUp, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { PortfolioRebalancerData } from '../../lib/plugins/portfolioRebalancer';

export const PortfolioRebalancerWidget: React.FC<{ portfolio: PortfolioRebalancerData }> = ({ portfolio }) => {
  const items = portfolio.items || [];
  const currency = portfolio.currency || '$';

  const actionColors: Record<string, string> = {
    Buy: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    Sell: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    Hold: 'text-slate-400 bg-slate-800 border-slate-700',
  };

  const actionIcons: Record<string, React.ReactNode> = {
    Buy: <ArrowUpRight className="w-3 h-3 text-emerald-400" />,
    Sell: <ArrowDownRight className="w-3 h-3 text-rose-400" />,
    Hold: <Minus className="w-3 h-3 text-slate-400" />,
  };

  return (
    <div className="my-3 p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-xl font-sans">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <PieChart className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold text-emerald-400 block uppercase tracking-wider font-mono">
              Portfolio Rebalancer
            </span>
            <h4 className="text-sm font-bold text-white leading-tight">
              {portfolio.portfolioName || 'Investment Portfolio'}
            </h4>
          </div>
        </div>
        {portfolio.totalValue && (
          <span className="text-xs font-mono px-2.5 py-1 bg-emerald-500/10 text-emerald-300 rounded-xl border border-emerald-500/20 font-bold shrink-0">
            {currency} {typeof portfolio.totalValue === 'number' ? portfolio.totalValue.toLocaleString() : portfolio.totalValue}
          </span>
        )}
      </div>

      {items.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800/80 flex justify-between items-center text-xs hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-semibold text-slate-200 truncate">{item.asset}</span>
                <span className="text-[10px] font-mono text-slate-400">
                  {item.currentAllocation}% → {item.targetAllocation}%
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono text-[11px] shrink-0">
                <span className={`px-2 py-0.5 rounded-md border uppercase flex items-center gap-1 font-medium ${actionColors[item.action] || actionColors.Hold}`}>
                  {actionIcons[item.action]}
                  {item.action}
                </span>
                <span className="text-slate-300 font-medium">
                  {typeof item.amountToTrade === 'number' ? `${currency}${item.amountToTrade.toLocaleString()}` : item.amountToTrade}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {portfolio.recommendation && (
        <p className="text-xs text-slate-300 bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/60 leading-relaxed">
          {portfolio.recommendation}
        </p>
      )}
    </div>
  );
};
