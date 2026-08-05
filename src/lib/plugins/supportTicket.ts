import { HymliPlugin, PluginContext, PluginResponse } from './types';
import { pluginRegistry } from './pluginRegistry';

export interface SupportTicketData {
  ticketId: string;
  customerName: string;
  sentiment: 'Frustrated' | 'Neutral' | 'Urgent' | 'Satisfied' | string;
  issueSummary: string;
  suggestedAction: string;
  draftResponse: string;
}

export const supportTicketPlugin: HymliPlugin = {
  id: 'support-ticket',
  name: 'Customer Support Triage & Response',
  category: 'support',
  description: 'Parses incoming support queries, analyzes customer sentiment, and drafts responses.',
  icon: 'Headphones',
  execute: async (data: SupportTicketData, context?: PluginContext): Promise<PluginResponse> => {
    return {
      success: true,
      data,
      message: `Triaged support ticket #${data.ticketId} for ${data.customerName} (${data.sentiment} sentiment).`,
    };
  },
};

// Register in plugin registry
pluginRegistry.register(supportTicketPlugin);
