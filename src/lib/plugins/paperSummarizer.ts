import { HymliPlugin, PluginContext, PluginResponse } from './types';
import { pluginRegistry } from './pluginRegistry';

export interface Finding {
  claim: string;
  confidence: 'High' | 'Moderate' | 'Exploratory' | string;
}

export interface PaperSummaryData {
  title: string;
  authors: string[];
  publicationYear: number;
  field: string;
  methodology: string;
  keyFindings: Finding[];
  limitations: string[];
}

export const paperSummarizerPlugin: HymliPlugin = {
  id: 'paper-summarizer',
  name: 'Academic Paper Summarizer',
  category: 'research',
  description: 'Extracts core methodologies, empirical findings, and study limitations from academic research papers.',
  icon: 'BookOpen',
  execute: async (data: PaperSummaryData, context?: PluginContext): Promise<PluginResponse> => {
    return {
      success: true,
      data,
      message: `Summarized paper "${data.title}".`,
    };
  },
};

// Register in plugin registry
pluginRegistry.register(paperSummarizerPlugin);
