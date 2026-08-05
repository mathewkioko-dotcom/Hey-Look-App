import { HymliPlugin, PluginContext, PluginResponse } from './types';
import { pluginRegistry } from './pluginRegistry';

export interface CodeIssue {
  severity: 'critical' | 'warning' | 'info';
  line: number;
  message: string;
  suggestion: string;
}

export interface CodeAuditData {
  language: string;
  securityScore: number; // 0 - 100
  issues: CodeIssue[];
}

export const codeAuditPlugin: HymliPlugin = {
  id: 'code-audit',
  name: 'Code Security Auditor',
  category: 'productivity',
  description: 'Scans submitted code snippets for vulnerabilities and performance patches.',
  icon: 'ShieldAlert',
  execute: async (data: CodeAuditData, context?: PluginContext): Promise<PluginResponse> => {
    return {
      success: true,
      data,
      message: `Audit completed. Security Score: ${data.securityScore}/100`,
    };
  },
};

// Register in plugin registry
pluginRegistry.register(codeAuditPlugin);
