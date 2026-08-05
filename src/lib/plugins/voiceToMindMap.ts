import { HymliPlugin, PluginContext, PluginResponse } from './types';
import { pluginRegistry } from './pluginRegistry';

export const generateMindMapPrompt = (transcript: string): string => {
  return `Convert the following brainstorm transcript into valid Mermaid.js mindmap syntax. Output ONLY the mermaid block starting with "mindmap" and indented node branches:

Transcript: "${transcript}"`;
};

export const voiceToMindMapPlugin: HymliPlugin = {
  id: 'voice-to-mind-map',
  name: 'Voice to Mind Map',
  category: 'productivity',
  description: 'Converts spoken brainstorming audio into structured Mermaid.js visual diagrams.',
  icon: 'Network',
  execute: async (transcript: string, context?: PluginContext): Promise<PluginResponse> => {
    return {
      success: true,
      data: { prompt: generateMindMapPrompt(transcript) },
      message: generateMindMapPrompt(transcript),
    };
  },
};

// Register plugin automatically
pluginRegistry.register(voiceToMindMapPlugin);
