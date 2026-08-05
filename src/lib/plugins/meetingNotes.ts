import { HymliPlugin, PluginContext, PluginResponse } from './types';
import { pluginRegistry } from './pluginRegistry';

export interface ActionItem {
  id: string;
  task: string;
  assignee: string;
  dueDate: string;
  completed: boolean;
}

export interface MeetingNotesData {
  title: string;
  date: string;
  duration: string;
  keyDecisions: string[];
  actionItems: ActionItem[];
}

export const meetingNotesPlugin: HymliPlugin = {
  id: 'meeting-notes-extractor',
  name: 'Meeting Minutes & Action Extractor',
  category: 'productivity',
  description: 'Parses meeting transcripts into key decisions and assigned action items.',
  icon: 'FileText',
  execute: async (data: MeetingNotesData, context?: PluginContext): Promise<PluginResponse> => {
    return {
      success: true,
      data,
      message: `Extracted notes for "${data.title}" with ${data.actionItems?.length || 0} action items.`,
    };
  },
};

// Register in plugin registry
pluginRegistry.register(meetingNotesPlugin);
