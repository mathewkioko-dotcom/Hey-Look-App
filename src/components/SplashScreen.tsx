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
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    let isMounted = true;

    const runAuthCheck = async () => {
      // Step 1: Initializing UI
      await new Promise((r) => setTimeout(r, 600));
      if (!isMounted) return;
      setProgress(45);
      setStatusText('Connecting to Supabase Auth...');

      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        await new Promise((r) => setTimeout(r, 700));
        if (!isMounted) return;
        setProgress(85);
        setStatusText(session ? 'Session Restored! Opening HeyLook...' : 'Ready for Authentication');

        await new Promise((r) => setTimeout(r, 500));
        if (!isMounted) return;
        setProgress(100);

        if (session) {
          onFinish(true, session.user);
        } else {
          onFinish(false);
        }
      } catch (error) {
        console.warn('Supabase auth check error:', error);
        if (isMounted) {
          setProgress(100);
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
          className={`text-sm font-medium mb-8 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}
        >
          WhatsApp • Facebook • Instagram • All in One
        </motion.p>

        {/* Loading Progress Bar */}
        <div className="w-full space-y-2 mb-4">
          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <motion.div
              className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Radio className="w-3 h-3 text-indigo-500 animate-ping" />
              {statusText}
            </span>
            <span>{progress}%</span>
          </div>
        </div>

        {/* Direct Skip Button if user wants to bypass splash instantly */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          onClick={() => onFinish(false)}
          className="mt-4 text-xs font-medium text-indigo-500 hover:underline cursor-pointer focus:outline-none"
        >
          Skip Loading →
        </motion.button>
      </div>
    </div>
  );
};
