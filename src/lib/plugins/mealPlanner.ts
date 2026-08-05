import { HymliPlugin, PluginContext, PluginResponse } from './types';
import { pluginRegistry } from './pluginRegistry';

export interface Meal {
  time: string;
  name: string;
  calories: number;
  macros: { protein: string; carbs: string; fats: string };
  ingredients: string[];
}

export interface MealPlanData {
  dayTitle: string;
  totalCalories: number;
  meals: Meal[];
}

export const mealPlannerPlugin: HymliPlugin = {
  id: 'meal-planner',
  name: 'AI Meal Planner',
  category: 'lifestyle',
  description: 'Generates structured nutrition guides and meal schedules with macro tracking.',
  icon: 'Utensils',
  execute: async (data: MealPlanData, context?: PluginContext): Promise<PluginResponse> => {
    return {
      success: true,
      data,
      message: `Generated meal plan "${data.dayTitle}" (${data.meals?.length || 0} meals).`,
    };
  },
};

// Register in plugin registry
pluginRegistry.register(mealPlannerPlugin);
