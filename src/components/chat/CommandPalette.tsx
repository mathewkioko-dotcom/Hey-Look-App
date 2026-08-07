import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Image as ImageIcon,
  PenLine,
  Eraser,
  HelpCircle,
  Languages,
  Activity,
  ListChecks,
  Bot,
  MessageSquare,
} from "lucide-react";

/**
 * Telegram-style inline bot command definition.
 */
export interface BotCommand {
  command: string;
  label: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  /** If true, the command operates on the last/most recent context rather than a typed arg. */
  needsArg?: boolean;
}

export const BOT_COMMANDS: BotCommand[] = [
  {
    command: "/summarize",
    label: "Summarize",
    description: "Generate an executive summary of this chat transcript",
    category: "Analyze",
    icon: <Activity className="w-4 h-4 text-cyan-400" />,
  },
  {
    command: "/generate-image",
    label: "Generate Image",
    description: "Ask Hymli AI to describe an image concept",
    category: "Create",
    needsArg: true,
    icon: <ImageIcon className="w-4 h-4 text-pink-400" />,
  },
  {
    command: "/rephrase",
    label: "Rephrase",
    description: "Rewrite your message in a clearer style",
    category: "Write",
    needsArg: true,
    icon: <PenLine className="w-4 h-4 text-indigo-400" />,
  },
  {
    command: "/polish",
    label: "Polish Tone",
    description: "Rewrite a message in an executive tone",
    category: "Write",
    needsArg: true,
    icon: <Sparkles className="w-4 h-4 text-amber-400" />,
  },
  {
    command: "/translate",
    label: "Translate",
    description: "Translate text into another language",
    category: "Write",
    needsArg: true,
    icon: <Languages className="w-4 h-4 text-emerald-400" />,
  },
  {
    command: "/tone",
    label: "Tone Analyzer",
    description: "Analyze the tone of a message",
    category: "Analyze",
    needsArg: true,
    icon: <MessageSquare className="w-4 h-4 text-purple-400" />,
  },
  {
    command: "/action-items",
    label: "Action Items",
    description: "Extract action items from the conversation",
    category: "Analyze",
    icon: <ListChecks className="w-4 h-4 text-rose-400" />,
  },
  {
    command: "/clear",
    label: "Clear Chat",
    description: "Clear the current chat canvas",
    category: "Manage",
    icon: <Eraser className="w-4 h-4 text-slate-400" />,
  },
  {
    command: "/help",
    label: "Help",
    description: "Show available bot commands",
    category: "Manage",
    icon: <HelpCircle className="w-4 h-4 text-sky-400" />,
  },
];

interface CommandPaletteProps {
  query: string; // text after the "/" (for filtering)
  onSelect: (command: BotCommand) => void;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  query,
  onSelect,
  onClose,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const normalized = query.toLowerCase().trim();
  const filtered = BOT_COMMANDS.filter((cmd) =>
    cmd.command.toLowerCase().includes(normalized),
  );

  // Keep the active index within bounds when the filter changes
  useEffect(() => {
    setActiveIndex(0);
  }, [normalized]);

  // Keyboard navigation (ArrowUp/ArrowDown/Enter/Escape) handled at the
  // parent level via the input; here we just scroll the active item into view.
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const activeEl = el.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    activeEl?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ duration: 0.15 }}
        className="absolute bottom-full left-0 right-0 mb-2 z-40 rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-2xl backdrop-blur-xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800">
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-cyan-300">
            <Bot className="w-3.5 h-3.5 text-cyan-400" />
            Hymli AI Bot Commands
          </span>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close command menu"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Command list */}
        <div
          ref={listRef}
          className="max-h-64 overflow-y-auto p-1.5 space-y-0.5"
        >
          {filtered.length === 0 ? (
            <div className="px-3 py-4 text-center text-xs text-slate-500">
              No commands match "/{query}"
            </div>
          ) : (
            filtered.map((cmd, idx) => (
              <button
                key={cmd.command}
                data-index={idx}
                onClick={() => onSelect(cmd)}
                onMouseEnter={() => setActiveIndex(idx)}
                className={`w-full flex items-start gap-2.5 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                  activeIndex === idx
                    ? "bg-cyan-500/15 border border-cyan-500/30"
                    : "bg-transparent border border-transparent"
                }`}
              >
                <span className="mt-0.5 shrink-0">{cmd.icon}</span>
                <span className="flex-1 min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-100">
                      {cmd.command}
                    </span>
                    {idx === 0 && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        ENTER
                      </span>
                    )}
                  </span>
                  <span className="block text-[10px] text-slate-400 truncate">
                    {cmd.description}
                  </span>
                </span>
                <span className="text-[9px] uppercase tracking-wider text-slate-500 shrink-0 mt-0.5">
                  {cmd.category}
                </span>
              </button>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="px-3 py-1.5 border-t border-slate-800 text-[9px] text-slate-500 flex items-center gap-2">
          <span className="font-mono">↑↓</span> Navigate
          <span className="font-mono ml-2">Enter</span> Run
          <span className="font-mono ml-2">Esc</span> Close
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
