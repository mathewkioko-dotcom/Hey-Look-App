import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Maximize2,
  Minimize2,
  Volume2,
  Sparkles,
  ShieldCheck,
  Radio,
  Anchor
} from 'lucide-react';
import { Profile } from '../types';

interface CallModalProps {
  isOpen: boolean;
  callType: 'audio' | 'video';
  targetUser: {
    id: string;
    name: string;
    avatar: string;
  };
  currentUser: Profile;
  onEndCall: (durationSec: number) => void;
  isDark: boolean;
}

export const CallModal: React.FC<CallModalProps> = ({
  isOpen,
  callType,
  targetUser,
  currentUser,
  onEndCall,
  isDark,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType === 'audio');
  const [callDuration, setCallDuration] = useState(0);
  const [callState, setCallState] = useState<'connecting' | 'connected'>('connecting');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCallDuration(0);
      setCallState('connecting');
      return;
    }

    // Simulate Agora connection setup
    const connectTimer = setTimeout(() => {
      setCallState('connected');
    }, 1800);

    return () => clearTimeout(connectTimer);
  }, [isOpen]);

  useEffect(() => {
    if (callState !== 'connected' || !isOpen) return;

    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [callState, isOpen]);

  if (!isOpen) return null;

  const formatDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl"
      >
        <div
          className={`relative w-full max-w-4xl h-[85vh] rounded-3xl border shadow-2xl overflow-hidden flex flex-col justify-between ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-900 border-slate-700'
          } ${isFullscreen ? 'max-w-none h-screen rounded-none' : ''}`}
        >
          {/* TOP OVERLAY HEADER */}
          <div className="absolute top-0 inset-x-0 z-30 p-6 bg-gradient-to-b from-black/90 via-black/40 to-transparent flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 backdrop-blur-md">
                <Anchor className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-extrabold text-base tracking-wide flex items-center gap-2">
                  {targetUser.name}
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-semibold border border-emerald-500/30">
                    E2EE Stream
                  </span>
                </h3>
                <p className="text-xs text-slate-300 font-mono flex items-center gap-1.5 mt-0.5">
                  <Radio className="w-3 h-3 text-emerald-400 animate-ping" />
                  {callState === 'connecting' ? 'Establishing Nautical Audio/Video Link...' : formatDuration(callDuration)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white transition-all cursor-pointer"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* MAIN VIDEO CANVAS AREA */}
          <div className="relative flex-1 w-full h-full bg-slate-900 flex items-center justify-center overflow-hidden">
            {/* Remote Feed (Main Background) */}
            {callType === 'video' && !isVideoOff && callState === 'connected' ? (
              <div className="absolute inset-0 z-0">
                <img
                  src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1200"
                  alt="Remote feed"
                  className="w-full h-full object-cover filter brightness-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
              </div>
            ) : (
              /* Audio call / Camera off Fallback Avatar presentation */
              <div className="relative z-10 flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-2xl animate-pulse">
                    <img
                      src={targetUser.avatar}
                      alt={targetUser.name}
                      className="w-full h-full rounded-full object-cover border-4 border-slate-900"
                    />
                  </div>
                  <div className="absolute inset-0 -m-4 rounded-full border border-dashed border-indigo-400/40 animate-spin-slow pointer-events-none" />
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-white">{targetUser.name}</h2>
                  <p className="text-sm text-indigo-300 font-medium mt-1">
                    {callState === 'connecting' ? 'Calling...' : 'Nautical Voice Channel Active'}
                  </p>
                </div>
              </div>
            )}

            {/* Local Video Picture-in-Picture Preview */}
            <div className="absolute bottom-24 right-6 z-20 w-36 h-48 sm:w-44 sm:h-56 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-slate-950/80 backdrop-blur-md">
              {!isVideoOff ? (
                <div className="relative w-full h-full">
                  <img
                    src={currentUser.avatar_url}
                    alt="Local feed"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-[10px] text-white font-mono">
                    You (Local)
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-slate-400">
                  <VideoOff className="w-6 h-6 mb-1 text-slate-500" />
                  <span className="text-[10px]">Cam Off</span>
                </div>
              )}
            </div>
          </div>

          {/* BOTTOM FLOATING CONTROL DOCK */}
          <div className="absolute bottom-6 inset-x-0 z-30 flex items-center justify-center gap-4 px-6">
            <div className="flex items-center gap-4 p-3 px-6 rounded-full bg-slate-900/80 border border-slate-700/80 backdrop-blur-xl shadow-2xl">
              {/* Mute Audio */}
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-3.5 rounded-full transition-all cursor-pointer ${
                  isMuted ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
                title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Toggle Camera */}
              <button
                onClick={() => setIsVideoOff(!isVideoOff)}
                className={`p-3.5 rounded-full transition-all cursor-pointer ${
                  isVideoOff ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
                title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
              >
                {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </button>

              {/* End Call Button */}
              <button
                onClick={() => onEndCall(callDuration)}
                className="p-4 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-xl shadow-rose-600/40 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                title="End Call"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
