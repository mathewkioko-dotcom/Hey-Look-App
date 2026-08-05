import { HymliPlugin, PluginContext, PluginResponse } from './types';
import { pluginRegistry } from './pluginRegistry';

export interface GridPost {
  id: string;
  imageUrl: string;
  caption: string;
  scheduledTime?: string;
}

export const instagramGridPlannerPlugin: HymliPlugin = {
  id: 'instagram-grid-planner',
  name: 'Instagram Grid Planner',
  category: 'meta',
  description: 'Renders interactive 3x3 visual grids and caption previews directly inside chat.',
  icon: 'Instagram',
  execute: async (posts: GridPost[], context?: PluginContext): Promise<PluginResponse> => {
    return {
      success: true,
      data: { posts },
      message: `Grid planned with ${posts.length} posts.`,
    };
  },
};

// Register in plugin registry
pluginRegistry.register(instagramGridPlannerPlugin);
