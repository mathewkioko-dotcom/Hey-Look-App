import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Anchor,
  Waves,
  Compass,
  ChevronLeft,
  ChevronRight,
  Send,
} from "lucide-react";

/**
 * Left-column interactive 3-slide feature carousel for the Auth screen.
 * Fully self-contained (no props) — manages its own slide state + auto-advance.
 */
export const AuthCarousel: React.FC = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const totalSlides = 3;

  // Carousel Auto-advance every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % totalSlides);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="lg:col-span-7 flex flex-col justify-between space-y-6 px-2 sm:px-4">
      {/* Top Brand Header Tagline */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold mb-4 backdrop-blur-md">
          <Compass
            className="w-3.5 h-3.5 animate-spin"
            style={{ animationDuration: "10s" }}
          />
          <span>Nautical Matrix • Next-Gen Communication</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white">
          Experience the next evolution of{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-indigo-400 to-pink-500">
            real-time communication.
          </span>
        </h1>
        <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-lg font-medium">
          One unified workspace seamlessly merging status matrixes, instant
          messaging with nautical delivery vectors, and rich interactive social
          feeds.
        </p>
      </div>

      {/* Interactive Feature Slide Box */}
      <div className="relative min-h-[290px] rounded-3xl bg-slate-900/70 border border-slate-800/80 p-6 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col justify-between">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        <AnimatePresence mode="wait">
          {activeSlide === 0 && (
            <motion.div
              key="slide-0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.35 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white">
                      Nautical Presence Engine
                    </h3>
                    <p className="text-xs text-slate-400">
                      Real-time activity matrix & custom focus states
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Feature 01 / 03
                </span>
              </div>

              {/* Visual Radar Matrix Simulation */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-around relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                  <div
                    className="w-40 h-40 rounded-full border border-cyan-500 animate-ping"
                    style={{ animationDuration: "3s" }}
                  />
                  <div className="w-24 h-24 rounded-full border border-cyan-400" />
                </div>

                <div className="flex items-center gap-3 z-10">
                  <div className="relative">
                    <img
                      src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150"
                      alt="Sara"
                      className="w-10 h-10 rounded-full object-cover border-2 border-cyan-400"
                    />
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-cyan-400 ring-2 ring-slate-950" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-white block">
                      Sara Chen
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30 mt-0.5">
                      <Anchor className="w-3 h-3 text-cyan-400" /> In Focus
                    </span>
                  </div>
                </div>

                <div className="h-8 w-px bg-slate-800" />

                <div className="flex items-center gap-3 z-10">
                  <div className="relative">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
                      alt="Alex"
                      className="w-10 h-10 rounded-full object-cover border-2 border-amber-400 opacity-80"
                    />
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-amber-400 ring-2 ring-slate-950" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-200 block">
                      Alex Rivera
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30 mt-0.5">
                      <Waves className="w-3 h-3 text-amber-400" /> Adrift
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeSlide === 1 && (
            <motion.div
              key="slide-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.35 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white">
                      Metaphoric Delivery Mechanics
                    </h3>
                    <p className="text-xs text-slate-400">
                      Granular 3-stage delivery & receipt state machine
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Feature 02 / 03
                </span>
              </div>

              {/* Metaphoric Vector Steps Simulation */}
              <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-1">
                  <div className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto text-xs font-bold">
                    ⛵
                  </div>
                  <span className="text-[11px] font-bold text-cyan-300 block">
                    Launched
                  </span>
                  <span className="text-[9px] text-slate-400 block leading-tight">
                    Sent from device
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-1">
                  <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto text-xs font-bold">
                    ⚓
                  </div>
                  <span className="text-[11px] font-bold text-indigo-300 block">
                    Docked
                  </span>
                  <span className="text-[9px] text-slate-400 block leading-tight">
                    Delivered to harbor
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-1">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-xs font-bold">
                    🌊
                  </div>
                  <span className="text-[11px] font-bold text-emerald-300 block">
                    Submerged
                  </span>
                  <span className="text-[9px] text-slate-400 block leading-tight">
                    Read in viewport
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {activeSlide === 2 && (
            <motion.div
              key="slide-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.35 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-pink-500/20 text-pink-400 border border-pink-500/30">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white">
                      Dynamic 6-State Emoji Stream
                    </h3>
                    <p className="text-xs text-slate-400">
                      Interactive reaction picker with consensus counts
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/20">
                  Feature 03 / 03
                </span>
              </div>

              {/* Floating Glassmorphic Reaction Bar Simulation */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-around bg-slate-900/90 p-2 rounded-2xl border border-slate-800 shadow-lg">
                  <span
                    className="text-lg hover:scale-125 transition-transform cursor-pointer"
                    title="Like"
                  >
                    👍
                  </span>
                  <span
                    className="text-lg hover:scale-125 transition-transform cursor-pointer"
                    title="Love"
                  >
                    ❤️
                  </span>
                  <span
                    className="text-lg hover:scale-125 transition-transform cursor-pointer"
                    title="Insight"
                  >
                    💡
                  </span>
                  <span
                    className="text-lg hover:scale-125 transition-transform cursor-pointer"
                    title="Anchored"
                  >
                    ⚓
                  </span>
                  <span
                    className="text-lg hover:scale-125 transition-transform cursor-pointer"
                    title="Wave"
                  >
                    🌊
                  </span>
                  <span
                    className="text-lg hover:scale-125 transition-transform cursor-pointer"
                    title="Fire"
                  >
                    🔥
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    Live Post Reactions Stream
                  </span>
                  <span className="font-mono text-[11px] text-cyan-300">
                    142 reactions • 18 reshares
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Carousel Navigation Dots Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800/80 mt-2">
          <div className="flex items-center gap-2">
            {[0, 1, 2].map((idx) => (
              <button
                key={idx}
                onClick={() => setActiveSlide(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  activeSlide === idx
                    ? "w-8 bg-cyan-400"
                    : "w-2 bg-slate-700 hover:bg-slate-600"
                }`}
                title={`Go to Slide ${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() =>
                setActiveSlide((prev) =>
                  prev === 0 ? totalSlides - 1 : prev - 1,
                )
              }
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveSlide((prev) => (prev + 1) % totalSlides)}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
