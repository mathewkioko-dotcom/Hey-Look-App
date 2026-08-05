import { HymliPlugin, PluginContext, PluginResponse } from './types';
import { pluginRegistry } from './pluginRegistry';

export interface QuestionItem {
  id: string;
  question: string;
  category: 'Behavioral' | 'Technical' | 'System Design' | 'Culture' | string;
  starHint: string;
  modelAnswer: string;
}

export interface InterviewPrepData {
  targetRole: string;
  companyName: string;
  difficultyLevel: 'Junior' | 'Mid' | 'Senior' | 'Staff' | string;
  questions: QuestionItem[];
}

export const interviewPrepPlugin: HymliPlugin = {
  id: 'interview-prep',
  name: 'AI Interview Simulator',
  category: 'career',
  description: 'Generates role-specific interview prep decks with STAR hints and ideal answer breakdowns.',
  icon: 'Target',
  execute: async (data: InterviewPrepData, context?: PluginContext): Promise<PluginResponse> => {
    return {
      success: true,
      data,
      message: `Generated interview prep deck for "${data.targetRole}" (${data.questions?.length || 0} questions).`,
    };
  },
};

// Register in plugin registry
pluginRegistry.register(interviewPrepPlugin);
