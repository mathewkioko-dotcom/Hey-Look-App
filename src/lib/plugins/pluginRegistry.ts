import { HymliPlugin } from './types';
import { documentDeepDivePlugin } from './documentDeepDive';
import { codeInterpreterPlugin } from './codeInterpreter';
import { voiceToMindMapPlugin } from './voiceToMindMap';
import { instagramGridPlannerPlugin } from './instagramGridPlanner';
import { expenseTrackerPlugin } from './expenseTracker';
import { voiceNoteSummarizerPlugin } from './voiceNoteSummarizer';
import { storyPollMakerPlugin } from './storyPollMaker';
import { dmGhostwriterPlugin } from './dmGhostwriter';
import { skillCoursePlugin } from './skillCourse';
import { factCheckerPlugin } from './factChecker';
import { workoutPlannerPlugin } from './workoutPlanner';
import { mealPlannerPlugin } from './mealPlanner';
import { codeAuditPlugin } from './codeAudit';
import { travelPlannerPlugin } from './travelPlanner';
import { resumeOptimizerPlugin } from './resumeOptimizer';
import { meetingNotesPlugin } from './meetingNotes';
import { vocabBuilderPlugin } from './vocabBuilder';
import { contractAnalyzerPlugin } from './contractAnalyzer';
import { techStackEstimatorPlugin } from './techStackEstimator';
import { interviewPrepPlugin } from './interviewPrep';
import { prReviewerPlugin } from './prReviewer';
import { roadmapPlannerPlugin } from './roadmapPlanner';
import { supportTicketPlugin } from './supportTicket';
import { sqlBuilderPlugin } from './sqlBuilder';
import { portfolioRebalancerPlugin } from './portfolioRebalancer';
import { paperSummarizerPlugin } from './paperSummarizer';
import { invoiceGeneratorPlugin } from './invoiceGenerator';

class PluginRegistry {
  private plugins: Map<string, HymliPlugin> = new Map();

  public register(plugin: HymliPlugin) {
    this.plugins.set(plugin.id, plugin);
  }

  public getPlugin(id: string): HymliPlugin | undefined {
    return this.plugins.get(id);
  }

  public getAllPlugins(): HymliPlugin[] {
    return Array.from(this.plugins.values());
  }

  public getPluginsByCategory(category: HymliPlugin['category']): HymliPlugin[] {
    return this.getAllPlugins().filter((p) => p.category === category);
  }
}

export const pluginRegistry = new PluginRegistry();

