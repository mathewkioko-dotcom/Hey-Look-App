import { HymliPlugin, PluginContext, PluginResponse } from './types';
import { pluginRegistry } from './pluginRegistry';

export interface PollOption {
  text: string;
  votes: number;
}

export interface StoryPollData {
  id: string;
  question: string;
  type: 'poll' | 'quiz';
  options: PollOption[];
  correctIndex?: number;
}

export const storyPollMakerPlugin: HymliPlugin = {
  id: 'story-poll-maker',
  name: 'Interactive Story Poll Maker',
  category: 'meta',
  description: 'Generates interactive IG/FB Story poll stickers and quizzes inside chat.',
  icon: 'Vote',
  execute: async (data: StoryPollData, context?: PluginContext): Promise<PluginResponse> => {
    return {
      success: true,
      data,
      message: `Poll created: "${data.question}"`,
    };
  },
};

// Register in plugin registry
pluginRegistry.register(storyPollMakerPlugin);
