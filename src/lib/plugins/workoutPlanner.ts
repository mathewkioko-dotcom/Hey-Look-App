import { HymliPlugin, PluginContext, PluginResponse } from './types';
import { pluginRegistry } from './pluginRegistry';

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  restSeconds: number;
  notes?: string;
}

export interface WorkoutPlanData {
  title: string;
  targetMuscleGroup: string;
  estimatedMinutes: number;
  exercises: Exercise[];
}

export const workoutPlannerPlugin: HymliPlugin = {
  id: 'workout-planner',
  name: 'AI Workout Planner',
  category: 'lifestyle',
  description: 'Generates interactive workout routines with interactive set counters and rest guidance.',
  icon: 'Dumbbell',
  execute: async (data: WorkoutPlanData, context?: PluginContext): Promise<PluginResponse> => {
    return {
      success: true,
      data,
      message: `Generated workout plan "${data.title}" with ${data.exercises?.length || 0} exercises.`,
    };
  },
};

// Register in plugin registry
pluginRegistry.register(workoutPlannerPlugin);
