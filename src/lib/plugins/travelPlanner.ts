import { HymliPlugin, PluginContext, PluginResponse } from './types';
import { pluginRegistry } from './pluginRegistry';

export interface TravelActivity {
  time: string;
  location: string;
  description: string;
  estimatedCost: string;
}

export interface DayItinerary {
  dayNumber: number;
  dateOrTitle: string;
  activities: TravelActivity[];
}

export interface TravelPlanData {
  destination: string;
  totalBudget: string;
  durationDays: number;
  days: DayItinerary[];
}

export const travelPlannerPlugin: HymliPlugin = {
  id: 'travel-planner',
  name: 'Travel Itinerary Planner',
  category: 'lifestyle',
  description: 'Generates interactive multi-day trip schedules complete with costs and locations.',
  icon: 'Compass',
  execute: async (data: TravelPlanData, context?: PluginContext): Promise<PluginResponse> => {
    return {
      success: true,
      data,
      message: `Generated travel plan for "${data.destination}" (${data.days?.length || 0} days).`,
    };
  },
};

// Register in plugin registry
pluginRegistry.register(travelPlannerPlugin);
