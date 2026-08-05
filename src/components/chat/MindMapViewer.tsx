import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    mermaid: any;
  }
}

interface MindMapProps {
  chartDefinition: string;
}

export const MindMapViewer: React.FC<MindMapProps> = ({ chartDefinition }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    const renderDiagram = async () => {
      if (!window.mermaid) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js';
        document.head.appendChild(script);
        await new Promise((resolve) => {
          script.onload = resolve;
          script.onerror = resolve;
        });
      }

      if (!window.mermaid || !isMounted) return;

      window.mermaid.initialize({ startOnLoad: false, theme: 'dark' });
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
        const id = `mindmap-${Math.random().toString(36).substring(2, 9)}`;
        try {
          const { svg } = await window.mermaid.render(id, chartDefinition);
          if (isMounted && containerRef.current) {
            containerRef.current.innerHTML = svg;
          }
        } catch (err) {
          console.error('[MindMapViewer] Error rendering mermaid diagram:', err);
          if (isMounted && containerRef.current) {
            containerRef.current.innerHTML = `<div class="text-xs text-rose-400 p-2">Failed to render mind map diagram. Raw syntax: <pre class="mt-1 font-mono text-[11px] whitespace-pre-wrap">${chartDefinition}</pre></div>`;
          }
        }
      }
    };

    renderDiagram().catch(console.error);

    return () => {
      isMounted = false;
    };
  }, [chartDefinition]);

  return (
    <div className="my-3 p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-xl overflow-x-auto">
      <div className="text-xs font-semibold text-cyan-400 mb-2 flex items-center gap-1.5 font-mono">
        <span>🧠 Interactive Mind Map</span>
      </div>
      <div ref={containerRef} className="flex justify-center min-h-[120px] items-center text-slate-400 text-xs" />
    </div>
  );
};
