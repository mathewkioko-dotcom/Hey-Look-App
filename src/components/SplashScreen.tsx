import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, MessageCircle, Newspaper, Film, Radio } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SplashScreenProps {
  onFinish: (sessionExists: boolean, userProfile?: any) => void;
  isDark: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish, isDark }) => {
  const [statusText, setStatusText] = useState('Initializing HeyLook Core...');
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const runAuthCheck = async () => {
      // Step 1: Initialize UI
      await new Promise((r) => setTimeout(r, 300));
      if (!isMounted) return;
      setProgress(10);

      await new Promise((r) => setTimeout(r, 400));
      if (!isMounted) return;
      setProgress(25);
      setStatusText('Loading UI Components...');

      await new Promise((r) => setTimeout(r, 400));
      if (!isMounted) return;
      setProgress(40);
      setStatusText('Connecting to Supabase...');

      try {
        // Fetch session
        const { data: { session } } = await supabase.auth.getSession();
        
        await new Promise((r) => setTimeout(r, 500));
        if (!isMounted) return;
        setProgress(60);
        setStatusText('Validating Session...');

        await new Promise((r) => setTimeout(r, 400));
        if (!isMounted) return;
        setProgress(75);
        setStatusText('Loading User Profile...');

        await new Promise((r) => setTimeout(r, 400));
        if (!isMounted) return;
        setProgress(90);
        setStatusText('Preparing Workspace...');

        await new Promise((r) => setTimeout(r, 300));
        if (!isMounted) return;
        setProgress(100);
        setStatusText(session ? '✓ Ready!' : '✓ Complete!');
        setIsComplete(true);

        // Show 100% for a moment before finishing
        await new Promise((r) => setTimeout(r, 800));
        if (!isMounted) return;

        if (session) {
          onFinish(true, session.user);
        } else {
          onFinish(false);
        }
      } catch (error) {
        console.warn('Supabase auth check error:', error);
        if (isMounted) {
          setProgress(100);
          setStatusText('✓ Ready!');
          setIsComplete(true);
          await new Promise((r) => setTimeout(r, 800));
          onFinish(false);
        }
      }
    };

    runAuthCheck();

    return () => {
      isMounted = false;
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-6 transition-colors duration-500 ${
        isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Background ambient glow effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl opacity-30 ${
            isDark ? 'bg-indigo-600' : 'bg-indigo-400'
          }`}
        />
        <div
          className={`absolute -bottom-32 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl opacity-30 ${
            isDark ? 'bg-pink-600' : 'bg-pink-400'
          }`}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-sm w-full text-center">
        {/* Animated Brand Logo Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: [0.9, 1.05, 1], opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="relative mb-8"
        >
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-0.5 shadow-2xl shadow-indigo-500/30">
            <div
              className={`w-full h-full rounded-[22px] flex items-center justify-center ${
                isDark ? 'bg-slate-900' : 'bg-white'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-indigo-500 animate-pulse" />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 -m-2 rounded-full border border-dashed border-indigo-400/40"
                />
              </div>
            </div>
          </div>

          {/* Platform Mini Badges */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: 'spring' }}
            className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-full shadow-lg border-2 border-slate-900"
            title="WhatsApp style"
          >
            <MessageCircle className="w-4 h-4" />
          </motion.div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
            className="absolute -top-2 -left-2 bg-blue-600 text-white p-2 rounded-full shadow-lg border-2 border-slate-900"
            title="Facebook style"
          >
            <Newspaper className="w-4 h-4" />
          </motion.div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.6, type: 'spring' }}
            className="absolute -top-2 -right-2 bg-pink-500 text-white p-2 rounded-full shadow-lg border-2 border-slate-900"
            title="Instagram style"
          >
            <Film className="w-4 h-4" />
          </motion.div>
        </motion.div>

        {/* Title & Tagline */}
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-4xl font-extrabold tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
        >
          HeyLook
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className={`w-screen max-w-none whitespace-nowrap text-center text-sm sm:text-base font-bold tracking-[0.58em] mb-8 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}
        >
         - M A T H E W     P R E S E N T S -
        </motion.p>

        {/* Loading Progress Bar */}
        <div className="w-full space-y-2 mb-4">
          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <motion.div
              className={`h-full rounded-full transition-all ${
                isComplete
                  ? 'bg-gradient-to-r from-emerald-400 to-cyan-400'
                  : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500'
              }`}
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          <div className="flex items-center justify-between text-xs font-mono">
            <span className={`flex items-center gap-1 ${
              isComplete
                ? 'text-emerald-500 dark:text-emerald-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}>
              {isComplete ? (
                <span className="inline-block animate-bounce">✓</span>
              ) : (
                <Radio className="w-3 h-3 text-indigo-500 animate-ping" />
              )}
              {statusText}
            </span>
            <motion.span
              className={`font-bold ${
                progress === 100
                  ? 'text-emerald-500 dark:text-emerald-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
              animate={{ scale: progress === 100 ? [1, 1.1, 1] : 1 }}
              transition={{ duration: 0.6, repeat: progress === 100 ? Infinity : 0 }}
            >
              {progress}%
            </motion.span>
          </div>
        </div>

        {/* Direct Skip Button - only show during loading (not at 100%) */}
        {progress < 100 && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            onClick={() => onFinish(false)}
            className="mt-4 text-xs font-medium text-indigo-500 hover:text-indigo-400 hover:underline cursor-pointer focus:outline-none transition-colors"
          >
            Skip to HeyLook →
          </motion.button>
        )}
      </div>
    </div>
  );
};
