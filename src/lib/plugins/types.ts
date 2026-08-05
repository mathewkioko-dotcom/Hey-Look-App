import React from 'react';

export interface PluginContext {
  userId: string;
  conversationId?: string;
  activeModel: string;
  metaSimulatedState?: Record<string, any>;
  showNotice?: (message: string) => void;
}

export interface PluginResponse {
  success: boolean;
  data?: any;
  message?: string;
  component?: React.ReactNode;
}

export interface HymliPlugin {
  id: string;
  name: string;
  category: 'meta' | 'creative' | 'productivity' | 'intelligence' | 'gaming' | 'business' | 'lifestyle' | 'learning' | 'career' | 'development' | 'product' | 'support' | 'database' | 'finance' | 'research';
  description: string;
  icon?: string;
  uiComponent?: React.ComponentType<any>; // For widgets like Grid Planner or Canvas
  execute: (input: any, context: PluginContext) => Promise<PluginResponse>;
}
