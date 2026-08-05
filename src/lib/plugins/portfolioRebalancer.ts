import { HymliPlugin, PluginContext, PluginResponse } from './types';
import { pluginRegistry } from './pluginRegistry';

export interface PortfolioItem {
  asset: string;
  currentAllocation: number;
  targetAllocation: number;
  action: 'Buy' | 'Sell' | 'Hold' | string;
  amountToTrade: number | string;
}

export interface PortfolioRebalancerData {
  portfolioName?: string;
  totalValue?: number | string;
  currency?: string;
  items?: PortfolioItem[];
  recommendation?: string;
}

export const portfolioRebalancerPlugin: HymliPlugin = {
  id: 'portfolio-rebalancer',
  name: 'Portfolio Rebalancer & Allocator',
  category: 'finance',
  description: 'Calculates portfolio drift and suggests buy/sell trades to restore target asset allocation.',
  icon: 'PieChart',
  execute: async (data: PortfolioRebalancerData, context?: PluginContext): Promise<PluginResponse> => {
    return {
      success: true,
      data,
      message: `Analyzed portfolio "${data.portfolioName || 'Portfolio'}".`,
    };
  },
};

// Register in plugin registry
pluginRegistry.register(portfolioRebalancerPlugin);
