import React, { useState } from 'react';
import { Anchor, Sparkles, Loader2, Bot, Cpu, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { hymliAiService, HYMLI_BOT_PROFILE, AiProvider } from '../services/hymliAiService';
import { Profile } from '../types';

interface HymliAiButtonProps {
  currentUserId: string;
  onSelectConversation?: (conversationId: string, partnerProfile: Profile) => void;
  className?: string;
  variant?: 'sidebar' | 'floating' | 'header' | 'compact';
  showProviderToggle?: boolean;
}

export const HymliAiButton: React.FC<HymliAiButtonProps> = ({
  currentUserId,
  onSelectConversation,
  className = '',
  variant = 'sidebar',
  showProviderToggle = true,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [provider, setProvider] = useState<AiProvider>(hymliAiService.getProvider());
  const [showStatusToast, setShowStatusToast] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLoading || !currentUserId) return;

    setIsLoading(true);
    try {
      // Check or auto-inject Hymli AI thread in Supabase
      const { conversationId, partner } = await hymliAiService.getOrCreateAiConversation(currentUserId);

      if (onSelectConversation) {
        onSelectConversation(conversationId, partner);
      }
    } catch (err) {
      console.warn('[HymliAiButton] Error launching Hymli AI thread:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleProvider = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newProvider = hymliAiService.toggleProvider();
    setProvider(newProvider);
    setShowStatusToast(true);
    setTimeout(() => setShowStatusToast(false), 2500);
  };

  // FLOATING FAB VARIANT
  if (variant === 'floating') {
    return (
      <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 ${className}`}>
        <AnimatePresence>
          {showStatusToast && (
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              className="px-3 py-1.5 rounded-2xl bg-slate-900/90 text-white border border-indigo-500/30 text-xs font-medium shadow-xl flex items-center gap-1.5 backdrop-blur-md"
            >
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <span>Engine: <strong className="uppercase text-indigo-300">{provider}</strong></span>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleClick}
          disabled={isLoading}
          className="relative group p-4 rounded-3xl bg-gradient-to-r from-indigo-600 via-sky-600 to-teal-500 text-white shadow-2xl shadow-indigo-500/40 border border-white/20 flex items-center justify-center overflow-hidden cursor-pointer"
          title="Launch Hymli AI Fleet Copilot"
        >
          {/* Pulsing nautical ring background */}
          <span className="absolute inset-0 rounded-3xl bg-indigo-400/20 animate-ping pointer-events-none" />

          <div className="relative flex items-center gap-2.5">
            <div className="relative">
              <Anchor className="w-6 h-6 text-sky-200 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-indigo-900" />
            </div>

            <span className="font-bold tracking-wide text-sm hidden sm:inline">Hymli AI</span>

            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Sparkles className="w-4 h-4 text-amber-300" />
            )}
          </div>
        </motion.button>
      </div>
    );
  }

  // HEADER / COMPACT VARIANT
  if (variant === 'header' || variant === 'compact') {
    return (
      <div className={`relative flex items-center gap-2 ${className}`}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleClick}
          disabled={isLoading}
          className="px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-indigo-900/80 via-sky-900/80 to-slate-900 border border-indigo-500/40 text-indigo-100 hover:text-white hover:border-indigo-400 shadow-md flex items-center gap-2 text-xs font-semibold backdrop-blur-md transition-all cursor-pointer"
        >
          <div className="relative">
            <Anchor className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          </div>

          <span>Hymli AI</span>

          {isLoading ? (
            <Loader2 className="w-3 h-3 animate-spin text-indigo-300" />
          ) : (
            <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/30 text-[10px] font-bold tracking-wider text-indigo-300 uppercase">
              {provider}
            </span>
          )}
        </motion.button>

        {showProviderToggle && (
          <button
            onClick={handleToggleProvider}
            title={`Toggle LLM Provider (Current: ${provider.toUpperCase()})`}
            className="p-1.5 rounded-xl bg-slate-800/80 border border-slate-700 hover:border-indigo-500 text-slate-300 hover:text-indigo-400 transition-colors text-xs flex items-center justify-center cursor-pointer"
          >
            <Cpu className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  // DEFAULT SIDEBAR BUTTON VARIANT
  return (
    <div className={`w-full relative ${className}`}>
      <motion.div
        whileHover={{ scale: 1.01, translateY: -1 }}
        whileTap={{ scale: 0.99 }}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        className="w-full relative group p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 border border-indigo-500/30 hover:border-indigo-400/60 text-left shadow-lg shadow-indigo-950/40 transition-all cursor-pointer overflow-hidden select-none"
      >
        {/* Glow backdrop */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-sky-500/10 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />

        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Nautical Anchor Badge with Pulse Ring */}
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 text-white shadow-md shadow-indigo-500/30">
              <Anchor className="w-5 h-5 text-sky-100 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-slate-950 animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-slate-100 group-hover:text-white">
                  Hymli AI
                </span>
                <span className="px-1.5 py-0.2 rounded-md bg-indigo-500/20 text-indigo-300 text-[9px] font-extrabold uppercase border border-indigo-500/30">
                  Fleet AI
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium line-clamp-1">
                Executive Fleet Copilot & Voice Assistant
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {showProviderToggle && (
              <button
                type="button"
                onClick={handleToggleProvider}
                title={`Switch Provider (Current: ${provider.toUpperCase()})`}
                className="px-2 py-1 rounded-lg bg-slate-800/90 border border-slate-700/80 hover:border-indigo-400 text-[10px] font-bold tracking-wider text-slate-300 hover:text-indigo-300 uppercase transition-colors"
              >
                {provider}
              </button>
            )}

            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
            ) : (
              <Sparkles className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
            )}
          </div>
        </div>
      </motion.div>

      {/* Provider Switch Notification Toast */}
      <AnimatePresence>
        {showStatusToast && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            className="mt-2 p-2 rounded-xl bg-indigo-950 border border-indigo-500/40 text-indigo-200 text-xs font-medium flex items-center justify-between"
          >
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Switched Hymli AI Engine to <strong className="uppercase text-white">{provider}</strong></span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
