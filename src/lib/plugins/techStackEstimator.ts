import { HymliPlugin, PluginContext, PluginResponse } from './types';
import { pluginRegistry } from './pluginRegistry';

export interface ServiceCostItem {
  serviceName: string;
  category: 'Database' | 'LLM API' | 'Hosting' | 'Auth' | 'Analytics' | string;
  monthlyCost: number;
}

export interface TechStackEstimateData {
  projectName: string;
  projectedUsers: string;
  currency: string;
  totalMonthlyCost: number;
  breakdown: ServiceCostItem[];
}

export const techStackEstimatorPlugin: HymliPlugin = {
  id: 'techstack-estimator',
  name: 'Tech Stack & API Cost Estimator',
  category: 'business',
  description: 'Calculates monthly infrastructure and AI API expenditures based on MAUs and server load.',
  icon: 'Cloud',
  execute: async (data: TechStackEstimateData, context?: PluginContext): Promise<PluginResponse> => {
    return {
      success: true,
      data,
      message: `Calculated stack cost for "${data.projectName}": ${data.currency} ${data.totalMonthlyCost}/mo.`,
    };
  },
};

// Register in plugin registry
pluginRegistry.register(techStackEstimatorPlugin);
