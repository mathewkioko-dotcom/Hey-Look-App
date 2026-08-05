import { HymliPlugin, PluginContext, PluginResponse } from './types';
import { pluginRegistry } from './pluginRegistry';

export interface KeywordGap {
  keyword: string;
  importance: 'high' | 'medium' | 'low';
}

export interface ResumeOptimizationData {
  jobTitle: string;
  atsScore: number; // 0 - 100
  missingKeywords: KeywordGap[];
  suggestedBullets: string[];
}

export const resumeOptimizerPlugin: HymliPlugin = {
  id: 'resume-optimizer',
  name: 'ATS Resume Optimizer',
  category: 'productivity',
  description: 'Analyzes resume content against job postings to calculate match scores and missing keywords.',
  icon: 'FileCheck',
  execute: async (data: ResumeOptimizationData, context?: PluginContext): Promise<PluginResponse> => {
    return {
      success: true,
      data,
      message: `Analyzed resume for "${data.jobTitle}". ATS Score: ${data.atsScore}%`,
    };
  },
};

// Register in plugin registry
pluginRegistry.register(resumeOptimizerPlugin);
