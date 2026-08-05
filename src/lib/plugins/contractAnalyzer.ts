import { HymliPlugin, PluginContext, PluginResponse } from './types';
import { pluginRegistry } from './pluginRegistry';

export interface ClauseRisk {
  clauseName: string;
  severity: 'high' | 'medium' | 'low';
  explanation: string;
  mitigation: string;
}

export interface ContractAnalysisData {
  documentTitle: string;
  overallRisk: 'High Risk' | 'Moderate Risk' | 'Safe';
  risks: ClauseRisk[];
  keyTakeaways: string[];
}

export const contractAnalyzerPlugin: HymliPlugin = {
  id: 'contract-analyzer',
  name: 'Contract & Legal Risk Analyzer',
  category: 'business',
  description: 'Parses legal agreements to highlight clause risks, unfair liabilities, and recommended revisions.',
  icon: 'Scale',
  execute: async (data: ContractAnalysisData, context?: PluginContext): Promise<PluginResponse> => {
    return {
      success: true,
      data,
      message: `Analyzed contract "${data.documentTitle}". Overall Risk: ${data.overallRisk}`,
    };
  },
};

// Register in plugin registry
pluginRegistry.register(contractAnalyzerPlugin);
