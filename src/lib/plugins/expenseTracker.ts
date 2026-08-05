import { HymliPlugin, PluginContext, PluginResponse } from './types';
import { pluginRegistry } from './pluginRegistry';

export interface ExpenseItem {
  id: string;
  category: string;
  amount: number;
  description: string;
  date: string;
}

export interface ExpenseSummary {
  total: number;
  currency: string;
  items: ExpenseItem[];
}

export const expenseTrackerPlugin: HymliPlugin = {
  id: 'expense-tracker',
  name: 'Personal Expense Tracker',
  category: 'productivity',
  description: 'Parses text logs and receipts into visual budget charts and category breakdowns.',
  icon: 'PieChart',
  execute: async (data: ExpenseSummary, context?: PluginContext): Promise<PluginResponse> => {
    return {
      success: true,
      data,
      message: `Expense summary generated (${data.currency} ${data.total.toFixed(2)})`,
    };
  },
};

// Register in plugin registry
pluginRegistry.register(expenseTrackerPlugin);
