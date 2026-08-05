import { HymliPlugin, PluginContext, PluginResponse } from './types';
import { pluginRegistry } from './pluginRegistry';

export interface FileChangeReview {
  filename: string;
  additions: number;
  deletions: number;
  status: 'Approved' | 'Needs Work' | 'Warning' | string;
  feedback: string;
}

export interface PRReviewData {
  prTitle: string;
  prNumber: number;
  author: string;
  totalAdditions: number;
  totalDeletions: number;
  overallStatus: 'Approve' | 'Request Changes' | 'Comment' | string;
  summary: string;
  files: FileChangeReview[];
}

export const prReviewerPlugin: HymliPlugin = {
  id: 'pr-reviewer',
  name: 'GitHub PR & Diff Reviewer',
  category: 'development',
  description: 'Parses code diffs and PR descriptions to summarize changes and flag potential bugs.',
  icon: 'GitPullRequest',
  execute: async (data: PRReviewData, context?: PluginContext): Promise<PluginResponse> => {
    return {
      success: true,
      data,
      message: `Reviewed PR #${data.prNumber}: "${data.prTitle}". Overall Status: ${data.overallStatus}`,
    };
  },
};

// Register in plugin registry
pluginRegistry.register(prReviewerPlugin);
