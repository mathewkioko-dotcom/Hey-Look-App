import React, { useRef, useState, useEffect } from 'react';
import {
  Pencil,
  Eraser,
  RotateCcw,
  Sparkles,
  Download,
  Image as ImageIcon,
  Network,
  Palette,
  Layers,
  Wand2,
  Trash2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

interface InteractiveCanvasProps {
  onGenerateFromSketch?: (sketchBase64: string, prompt: string) => void;
  onSaveCanvas?: (dataUrl: string) => void;
  initialMode?: 'sketch' | 'mindmap' | 'mask';
}

interface MindMapNode {
  id: string;
  label: string;
  x: number;
  y: number;
  color: string;
}

interface MindMapEdge {
  from: string;
  to: string;
}

export const InteractiveCanvas: React.FC<InteractiveCanvasProps> = ({
  onGenerateFromSketch,
  onSaveCanvas,
  initialMode = 'sketch',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeTab, setActiveTab] = useState<'sketch' | 'mindmap' | 'mask'>(initialMode);
  
  // Drawing Tools State
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#06b6d4'); // Cyan
  const [brushSize, setBrushSize] = useState<number>(4);
  const [tool, setTool] = useState<'pencil' | 'eraser' | 'mask'>('pencil');
  const [promptInput, setPromptInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Mind Map State
  const [nodes, setNodes] = useState<MindMapNode[]>([
    { id: '1', label: 'Hymli AI Core', x: 250, y: 150, color: '#06b6d4' },
    { id: '2', label: 'Multimodal Engine', x: 100, y: 280, color: '#3b82f6' },
    { id: '3', label: 'M-Pesa Fleet Subscriptions', x: 400, y: 280, color: '#10b981' },
  ]);
  const [edges, setEdges] = useState<MindMapEdge[]>([
    { from: '1', to: '2' },
    { from: '1', to: '3' },
  ]);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [newNodeText, setNewNodeText] = useState('');

  // Setup Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high DPI dimensions
    canvas.width = 600;
    canvas.height = 400;

    // Fill background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  // Drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    ctx.strokeStyle = tool === 'eraser' ? '#0f172a' : tool === 'mask' ? '#f43f5e' : brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleGenerateAI = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const base64Data = dataUrl.replace(/^data:image\/(png|jpg);base64,/, '');

    setIsProcessing(true);
    if (onGenerateFromSketch) {
      onGenerateFromSketch(base64Data, promptInput || 'Transform this sketch into realistic art');
    }
    setTimeout(() => setIsProcessing(false), 1200);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'hymli-canvas-export.png';
    link.href = canvas.toDataURL();
    link.click();
    if (onSaveCanvas) {
      onSaveCanvas(canvas.toDataURL());
    }
  };

  // Mind map handlers
  const addMindMapNode = () => {
    if (!newNodeText.trim()) return;
    const newNode: MindMapNode = {
      id: Date.now().toString(),
      label: newNodeText.trim(),
      x: 250 + (Math.random() * 80 - 40),
      y: 200 + (Math.random() * 80 - 40),
      color: ['#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'][Math.floor(Math.random() * 5)],
    };

    setNodes((prev) => [...prev, newNode]);
    if (nodes.length > 0) {
      setEdges((prev) => [...prev, { from: nodes[0].id, to: newNode.id }]);
    }
    setNewNodeText('');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-2xl max-w-2xl w-full text-slate-100 overflow-hidden">
      {/* Header Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('sketch')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'sketch'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Sketch-to-Image</span>
          </button>

          <button
            onClick={() => setActiveTab('mask')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'mask'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Magic Erase / Mask</span>
          </button>

          <button
            onClick={() => setActiveTab('mindmap')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'mindmap'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>Visual Mind Map</span>
          </button>
        </div>

        <button
          onClick={handleDownload}
          className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          title="Export PNG"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>

      {/* Canvas View */}
      {activeTab !== 'mindmap' ? (
        <div className="space-y-3">
          {/* Drawing Controls */}
          <div className="flex items-center justify-between bg-slate-950/80 p-2.5 rounded-2xl border border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTool('pencil')}
                className={`p-2 rounded-xl transition cursor-pointer ${
                  tool === 'pencil' ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:bg-slate-800'
                }`}
                title="Pencil"
              >
                <Pencil className="w-4 h-4" />
              </button>

              <button
                onClick={() => setTool('eraser')}
                className={`p-2 rounded-xl transition cursor-pointer ${
                  tool === 'eraser' ? 'bg-rose-500 text-white' : 'text-slate-400 hover:bg-slate-800'
                }`}
                title="Eraser"
              >
                <Eraser className="w-4 h-4" />
              </button>

              <div className="h-4 w-px bg-slate-800 my-auto" />

              {/* Color Swatches */}
              <div className="flex items-center gap-1.5">
                {['#06b6d4', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#ffffff'].map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      setBrushColor(color);
                      setTool('pencil');
                    }}
                    style={{ backgroundColor: color }}
                    className={`w-5 h-5 rounded-full border border-slate-700 transition cursor-pointer ${
                      brushColor === color && tool === 'pencil' ? 'ring-2 ring-white scale-110' : ''
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400">Size</span>
                <input
                  type="range"
                  min="2"
                  max="24"
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="w-16 accent-cyan-500 cursor-pointer"
                />
              </div>

              <button
                onClick={clearCanvas}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                title="Clear Canvas"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* HTML5 Drawing Surface */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              className="cursor-crosshair touch-none w-full max-h-[360px] object-contain"
            />
          </div>

          {/* Prompt & AI Action */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              placeholder={
                activeTab === 'sketch'
                  ? 'Describe what to generate from this sketch...'
                  : 'Describe object to erase or replace in mask...'
              }
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
            />

            <button
              onClick={handleGenerateAI}
              disabled={isProcessing}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-600/20 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{isProcessing ? 'Rendering AI...' : 'Generate AI'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Mind Map Interactive Surface */
        <div className="space-y-3">
          <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
            <input
              type="text"
              placeholder="Enter new node concept..."
              value={newNodeText}
              onChange={(e) => setNewNodeText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addMindMapNode()}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={addMindMapNode}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-3 py-1.5 rounded-xl text-xs transition cursor-pointer"
            >
              + Add Node
            </button>
          </div>

          <div className="relative h-72 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden p-4">
            {/* SVG Connecting Edges */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {edges.map((edge, idx) => {
                const source = nodes.find((n) => n.id === edge.from);
                const target = nodes.find((n) => n.id === edge.to);
                if (!source || !target) return null;
                return (
                  <line
                    key={idx}
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    stroke="#334155"
                    strokeWidth="2"
                    strokeDasharray="4"
                  />
                );
              })}
            </svg>

            {/* Draggable Node Cards */}
            {nodes.map((node) => (
              <div
                key={node.id}
                style={{ left: node.x - 60, top: node.y - 20, borderColor: node.color }}
                className="absolute px-3 py-2 bg-slate-900 border-2 rounded-xl text-xs font-bold shadow-xl flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing hover:scale-105 transition-transform"
              >
                <span className="text-white">{node.label}</span>
                <button
                  onClick={() => setNodes((prev) => prev.filter((n) => n.id !== node.id))}
                  className="text-slate-500 hover:text-rose-400 p-0.5"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
