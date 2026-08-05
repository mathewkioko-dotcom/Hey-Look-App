import { HymliPlugin, PluginContext, PluginResponse } from './types';
import { pluginRegistry } from './pluginRegistry';

declare global {
  interface Window {
    loadPyodide: any;
    pyodide: any;
  }
}

let pyodideInstance: any = null;

const getPyodide = async () => {
  if (pyodideInstance) return pyodideInstance;

  // Dynamically load Pyodide runtime script if not already present
  if (!window.loadPyodide) {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js';
    document.head.appendChild(script);
    await new Promise((resolve, reject) => {
      script.onload = resolve;
      script.onerror = () => reject(new Error('Failed to load Pyodide script from CDN.'));
    });
  }

  pyodideInstance = await window.loadPyodide();
  return pyodideInstance;
};

export const runPythonCode = async (code: string): Promise<{ stdout: string; error?: string }> => {
  try {
    const pyodide = await getPyodide();
    
    // Redirect Python stdout to string buffer
    await pyodide.runPythonAsync(`
import sys
import io
sys.stdout = io.StringIO()
`);

    await pyodide.runPythonAsync(code);
    const stdout = await pyodide.runPythonAsync(`sys.stdout.getvalue()`);

    return { stdout: stdout || 'Code executed successfully (no output returned).' };
  } catch (err: any) {
    return { stdout: '', error: err.message || 'Error executing Python code.' };
  }
};

export const codeInterpreterPlugin: HymliPlugin = {
  id: 'code-interpreter',
  name: 'Python Code Interpreter',
  category: 'productivity',
  description: 'Executes Python code directly inside WebAssembly.',
  icon: 'Terminal',
  execute: async (code: string, context?: PluginContext): Promise<PluginResponse> => {
    const res = await runPythonCode(code);
    if (res.error) {
      return {
        success: false,
        message: res.error,
      };
    }
    return {
      success: true,
      data: res.stdout,
      message: res.stdout,
    };
  },
};

// Register in plugin registry
pluginRegistry.register(codeInterpreterPlugin);
