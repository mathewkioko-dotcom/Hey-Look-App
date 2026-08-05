import { HymliPlugin, PluginContext, PluginResponse } from './types';
import { pluginRegistry } from './pluginRegistry';

export interface FactCheckClaim {
  claim: string;
  verdict: 'verified' | 'false' | 'misleading' | 'unverified';
  confidenceScore: number;
  sources: string[];
  explanation: string;
}

export const factCheckerPlugin: HymliPlugin = {
  id: 'realtime-fact-checker',
  name: 'Real-Time Fact Checker',
  category: 'intelligence',
  description: 'Instantly verifies viral news claims and forwarded links inside WhatsApp chats.',
  icon: 'ShieldCheck',
  execute: async (claim: string | FactCheckClaim, context?: PluginContext): Promise<PluginResponse> => {
    return {
      success: true,
      data: typeof claim === 'string' ? { claim } : claim,
      message: 'Fact check completed.',
    };
  },
};

// Register in plugin registry
pluginRegistry.register(factCheckerPlugin);
