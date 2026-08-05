import { HymliPlugin, PluginContext, PluginResponse } from './types';
import { pluginRegistry } from './pluginRegistry';

export interface SqlBuilderData {
  queryName?: string;
  dialect?: string;
  sql?: string;
  tables?: string[];
  explanation?: string;
}

export const sqlBuilderPlugin: HymliPlugin = {
  id: 'sql-builder',
  name: 'SQL Query Builder & Optimizer',
  category: 'database',
  description: 'Generates optimized SQL queries with execution plans and table summaries.',
  icon: 'Database',
  execute: async (data: SqlBuilderData, context?: PluginContext): Promise<PluginResponse> => {
    return {
      success: true,
      data,
      message: `Generated SQL query "${data.queryName || 'Query'}" in ${data.dialect || 'SQL'}.`,
    };
  },
};

// Register in plugin registry
pluginRegistry.register(sqlBuilderPlugin);
