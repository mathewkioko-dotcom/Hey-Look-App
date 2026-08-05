import React, { useState } from 'react';
import { Play, Copy, Check, Terminal, Loader2 } from 'lucide-react';
import { runPythonCode } from '../../lib/plugins/codeInterpreter';

interface CodeBlockProps {
  code: string;
  language: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, language }) => {
  const [output, setOutput] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);

  const cleanLang = (language || '').toLowerCase().trim();
  const isPython = cleanLang === 'python' || cleanLang === 'py';

  const handleRun = async () => {
    setIsRunning(true);
    setOutput(null);
    const result = await runPythonCode(code);
    setOutput(result.error ? `Error: ${result.error}` : result.stdout);
    setIsRunning(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-2xl bg-slate-950 overflow-hidden border border-slate-800 shadow-xl text-slate-100 font-mono">
      {/* Header bar */}
      <div className="flex justify-between items-center px-4 py-2 bg-slate-900/90 border-b border-slate-800 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-semibold text-slate-300 uppercase tracking-wider">{language || 'code'}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="px-2 py-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition flex items-center gap-1 cursor-pointer"
            title="Copy code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {isPython && (
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md shadow-emerald-600/20"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>Running Pyodide...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current text-white" />
                  <span>Run Code ▶</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Code body */}
      <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed select-text">
        <code>{code}</code>
      </pre>

      {/* Output terminal */}
      {output && (
        <div className="p-3.5 bg-slate-950 border-t border-slate-800/80 text-xs font-mono">
          <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
            Terminal Output:
          </div>
          <pre className="whitespace-pre-wrap text-emerald-400 font-mono bg-black/50 p-2.5 rounded-xl border border-slate-900 overflow-x-auto">
            {output}
          </pre>
        </div>
      )}
    </div>
  );
};
