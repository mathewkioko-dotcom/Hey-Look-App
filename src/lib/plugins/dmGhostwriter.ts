import { HymliPlugin, PluginContext, PluginResponse } from './types';
import { pluginRegistry } from './pluginRegistry';

export interface DMReplyOption {
  tone: 'professional' | 'casual' | 'witty' | 'direct';
  text: string;
}

export interface DMGhostwriterData {
  incomingMessage: string;
  senderName: string;
  platform: 'WhatsApp' | 'Instagram' | 'Facebook';
  replies: DMReplyOption[];
}

export const dmGhostwriterPlugin: HymliPlugin = {
  id: 'dm-ghostwriter',
  name: 'Direct DM Ghostwriter',
  category: 'meta',
  description: 'Generates tone-matched contextual replies for business and personal DMs.',
  icon: 'MessageSquare',
  execute: async (data: DMGhostwriterData, context?: PluginContext): Promise<PluginResponse> => {
    return {
      success: true,
      data,
      message: `Generated ${data.replies?.length || 0} reply suggestions for ${data.senderName}`,
    };
  },
};

// Register in plugin registry
pluginRegistry.register(dmGhostwriterPlugin);
