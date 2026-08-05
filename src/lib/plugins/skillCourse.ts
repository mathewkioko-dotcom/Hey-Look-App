import { HymliPlugin, PluginContext, PluginResponse } from './types';
import { pluginRegistry } from './pluginRegistry';

export interface CourseDay {
  dayNumber: number;
  title: string;
  summary: string;
  takeaways: string[];
}

export interface SkillCourseData {
  courseTitle: string;
  currentDay: number;
  totalDays: number;
  days: CourseDay[];
}

export const skillCoursePlugin: HymliPlugin = {
  id: 'bite-sized-course',
  name: 'Bite-Sized Skill Course',
  category: 'productivity',
  description: 'Delivers structured, multi-day educational micro-courses directly inside chat.',
  icon: 'GraduationCap',
  execute: async (data: SkillCourseData, context?: PluginContext): Promise<PluginResponse> => {
    return {
      success: true,
      data,
      message: `Loaded course "${data.courseTitle}" (${data.days?.length || 0} modules)`,
    };
  },
};

// Register in plugin registry
pluginRegistry.register(skillCoursePlugin);
