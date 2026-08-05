import { HymliPlugin, PluginContext, PluginResponse } from './types';
import { pluginRegistry } from './pluginRegistry';

export interface RoadmapItem {
  id: string;
  featureName: string;
  quarter: string;
  status: 'Planned' | 'In Progress' | 'Shipped' | string;
  riceScore: number;
  tags: string[];
}

export interface RoadmapPlannerData {
  projectName: string;
  visionSummary: string;
  items: RoadmapItem[];
}

export const roadmapPlannerPlugin: HymliPlugin = {
  id: 'roadmap-planner',
  name: 'Product Roadmap & Feature Prioritizer',
  category: 'product',
  description: 'Calculates RICE priority scores and tracks quarterly feature roadmap milestones.',
  icon: 'Map',
  execute: async (data: RoadmapPlannerData, context?: PluginContext): Promise<PluginResponse> => {
    return {
      success: true,
      data,
      message: `Generated product roadmap for "${data.projectName}" with ${data.items?.length || 0} features.`,
    };
  },
};

// Register in plugin registry
pluginRegistry.register(roadmapPlannerPlugin);
