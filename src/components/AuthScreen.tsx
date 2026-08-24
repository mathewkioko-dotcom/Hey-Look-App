import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Sun,
  Moon,
  Instagram,
  Globe,
  Facebook,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  KeyRound,
  Compass,
  Anchor,
  Waves,
  Send,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { OAuthProvider } from "../types";
import { AuthCarousel } from "./auth/AuthCarousel";

interface AuthScreenProps {
  isDark: boolean;
  onToggleTheme: () => void;
  onLoginSuccess: (userProfile: any) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  isDark,
  onToggleTheme,
  onLoginSuccess,
}) => {
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(
    null,
  );
  const [authError, setAuthError] = useState<string | null>(null);
  const [showConfigNotice, setShowConfigNotice] = useState<boolean>(false);

  // Email & Password Auth State
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Mouse Reactive Background position
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  // Carousel State
  const [activeSlide, setActiveSlide] = useState(0);
  const totalSlides = 3;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const x = Math.round((clientX / innerWidth) * 100);
    const y = Math.round((clientY / innerHeight) * 100);
    setMousePos({ x, y });
  };

  // Popup & Auth callback listener for Supabase authentication state changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const user = session.user;
        const profile = {
          id: user.id,
          username:
            user.user_metadata?.username ||
            user.email?.split("@")[0] ||
            "nautical_user",
          full_name:
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            "Nautical Explorer",
          avatar_url:
            user.user_metadata?.avatar_url ||
            `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.id)}`,
          is_online: true,
          last_seen: new Date().toISOString(),
          bio: "✨ Exploring the future of social apps on HeyLook!",
          followers_count: 0,
          following_count: 0,
          posts_count: 0,
        };
        onLoginSuccess(profile);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [onLoginSuccess]);

  // Native Email & Password Sign In / Sign Up Handler
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    // Form Validations
    if (!email.trim() || !email.includes("@")) {
      setFormError("Please enter a valid email address.");
      return;
    }
    if (!password || password.length < 6) {
      setFormError("Password must be at least 6 characters long.");
      return;
    }
    if (authMode === "signup" && !fullName.trim()) {
      setFormError("Please enter your full name or display name.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (authMode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              username: email.split("@")[0],
            },
          },
        });

        if (error) {
          setFormError(error.message);
        } else if (data.session?.user) {
          const user = data.session.user;
          const profile = {
            id: user.id,
            username: user.user_metadata?.username || email.split("@")[0],
            full_name:
              fullName.trim() ||
              user.user_metadata?.full_name ||
              "Nautical Explorer",
            avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.id)}`,
            is_online: true,
            last_seen: new Date().toISOString(),
            bio: "✨ Exploring the future of social apps on HeyLook!",
            followers_count: 0,
            following_count: 0,
            posts_count: 0,
          };
          onLoginSuccess(profile);
        } else if (data.user) {
          setFormSuccess(
            'Account created successfully! If email confirmation is required, check your inbox, or click "Sign In" above to enter.',
          );
        }
      } else {
        // Sign In Mode
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          setFormError(
            error.message === "Invalid login credentials"
              ? "Invalid email or password. Please check your credentials and try again."
              : error.message,
          );
        } else if (data.session?.user) {
          const user = data.session.user;
          const profile = {
            id: user.id,
            username: user.user_metadata?.username || email.split("@")[0],
            full_name: user.user_metadata?.full_name || "Nautical Explorer",
            avatar_url:
              user.user_metadata?.avatar_url ||
              `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.id)}`,
            is_online: true,
            last_seen: new Date().toISOString(),
            bio: "✨ Exploring the future of social apps on HeyLook!",
            followers_count: 1420,
            following_count: 380,
            posts_count: 24,
          };
          onLoginSuccess(profile);
        }
      }
    } catch (err: any) {
      setFormError(
        err?.message || "An unexpected error occurred. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOAuthSignIn = async (provider: OAuthProvider) => {
    setLoadingProvider(provider);
    setAuthError(null);
    setShowConfigNotice(false);

    try {
      const isIframe = window.self !== window.top;
      // Always redirect back to this app's origin (never a hardcoded AI Studio URL).
      const redirectUrl = `${window.location.origin}`;

      const options: any = {
        redirectTo: redirectUrl,
        skipBrowserRedirect: isIframe,
      };

      if (provider === "facebook") {
        options.scopes = "email";
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider as any,
        options,
      });

      if (error) {
        setAuthError(`OAuth Notice: ${error.message}`);
        setShowConfigNotice(true);
      } else if (data?.url) {
        if (isIframe) {
          const width = 600;
          const height = 700;
          const left = window.screen.width / 2 - width / 2;
          const top = window.screen.height / 2 - height / 2;

          const popup = window.open(
            data.url,
            "OAuth",
            `width=${width},height=${height},top=${top},left=${left},toolbar=no,location=no,status=no,menubar=no`,
          );

          if (!popup || popup.closed || typeof popup.closed === "undefined") {
            try {
              if (window.top) {
                window.top.location.href = data.url;
              } else {
                window.location.href = data.url;
              }
            } catch {
              window.location.href = data.url;
            }
          }
        } else {
          window.location.href = data.url;
        }
      } else {
        setShowConfigNotice(true);
      }
    } catch (err: any) {
      setAuthError(
        `Authentication Notice: ${err?.message || "Provider connection initiated"}`,
      );
      setShowConfigNotice(true);
    } finally {
      setLoadingProvider(null);
    }
  };

  // Dedicated Google OAuth handler using the standard Supabase flow
  const handleGoogleLogin = async () => {
    setLoadingProvider("google");
    setAuthError(null);
    setShowConfigNotice(false);

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          // Always redirect back to this app's current origin (never a hardcoded
          // AI Studio URL). Supabase exchanges the OAuth code at this URL.
          redirectTo: `${window.location.origin}`,
        },
      });

      if (error) {
        console.error("Login failed:", error.message);
        setAuthError(`OAuth Notice: ${error.message}`);
        setShowConfigNotice(true);
      } else if (data?.url) {
        window.location.href = data.url;
      } else {
        setShowConfigNotice(true);
      }
    } catch (err: any) {
      console.error("Login failed:", err?.message || err);
      setAuthError(
        `Authentication Notice: ${err?.message || "Provider connection initiated"}`,
      );
      setShowConfigNotice(true);
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleGuestDemoLogin = (
    role: "default" | "creator" | "business" = "default",
  ) => {
    const demoProfiles = {
      default: {
        id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        username: "anonymous_user",
        full_name: "Anonymous",
        avatar_url:
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
        is_online: true,
        last_seen: new Date().toISOString(),
        bio: "✨ Exploring the future of social apps on HeyLook!",
        followers_count: 1420,
        following_count: 380,
        posts_count: 24,
      },
      creator: {
        id: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
        username: "sara_design",
        full_name: "Sara Chen",
        avatar_url:
          "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200",
        is_online: true,
        last_seen: new Date().toISOString(),
        bio: "🎨 Digital Creator & Storyteller • 📍 Nairobi / Tokyo",
        followers_count: 28500,
        following_count: 410,
        posts_count: 182,
      },
      business: {
        id: "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33",
        username: "zeel_ventures",
        full_name: "Zeel Ventures",
        avatar_url:
          "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200",
        is_online: true,
        last_seen: new Date().toISOString(),
        bio: "💼 Business Commander • Strategic Partnerships",
        followers_count: 5200,
        following_count: 96,
        posts_count: 64,
      },
    };

    onLoginSuccess(demoProfiles[role] || demoProfiles.default);
  };

  const oauthButtons = [
    {
      id: "google" as OAuthProvider,
      name: "Google",
      icon: (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
      ),
    },
    {
      id: "instagram" as OAuthProvider,
      name: "Instagram",
      icon: <Instagram className="w-4 h-4 text-pink-400 shrink-0" />,
    },
    {
      id: "facebook" as OAuthProvider,
      name: "Facebook",
      icon: (
        <Facebook className="w-4 h-4 text-blue-500 fill-current shrink-0" />
      ),
    },
  ];

  return (
    <div
      onMouseMove={handleMouseMove}
      className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 lg:p-8 overflow-hidden relative transition-colors duration-300 ${
        !isDark ? "light-mode-override" : ""
      }`}
    >
      {/* Mouse-Reactive Ambient Background Aura */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-300 ease-out"
        style={{
          background: `radial-gradient(900px circle at ${mousePos.x}% ${mousePos.y}%, rgba(6, 182, 212, 0.18), rgba(99, 102, 241, 0.12) 40%, transparent 80%)`,
        }}
      />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Controls */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-3 z-30">
        <button
          onClick={onToggleTheme}
          className={`p-2.5 rounded-full transition-all shadow-sm flex items-center justify-center ${
            isDark
              ? "bg-slate-900/80 hover:bg-slate-800 text-amber-400 border border-slate-700/60"
              : "bg-slate-900/80 hover:bg-slate-800 text-amber-400 border border-slate-700/60"
          }`}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      {/* Main 2-Column Responsive Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-6xl w-full items-center z-10 py-6">
        {/* LEFT COLUMN: Interactive 3-Slide Feature Carousel (lg:col-span-7) */}
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
              messaging with nautical delivery vectors, and rich interactive
              social feeds.
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
                  onClick={() =>
                    setActiveSlide((prev) => (prev + 1) % totalSlides)
                  }
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Glassmorphic Auth Card (lg:col-span-5) */}
        <div className="lg:col-span-5 w-full max-w-md mx-auto">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl border bg-slate-900/85 border-slate-800/80 shadow-cyan-500/10"
          >
            {/* Ambient inner glow */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-gradient-to-br from-cyan-500 to-indigo-500 rounded-full blur-3xl opacity-20 pointer-events-none" />

            {/* Brand Header */}
            <div className="text-center mb-5">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-pink-500 p-0.5 mb-2.5 shadow-lg shadow-cyan-500/20">
                <div className="w-full h-full rounded-[14px] flex items-center justify-center bg-slate-950">
                  <Sparkles className="w-6 h-6 text-cyan-400" />
                </div>
              </div>

              <h2 className="text-2xl font-extrabold tracking-tight mb-1 text-white">
                Welcome to{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-indigo-400 to-pink-500">
                  HeyLook
                </span>
              </h2>

              <p className="text-xs font-medium text-slate-400">
                Next-Gen Nautical Communication Matrix
              </p>
            </div>

            {/* Tab Switcher: Sign In vs Create Account */}
            <div className="p-1 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center mb-5 relative">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("signin");
                  setFormError(null);
                  setFormSuccess(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                  authMode === "signin"
                    ? "bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-500/20"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMode("signup");
                  setFormError(null);
                  setFormSuccess(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                  authMode === "signup"
                    ? "bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-500/20"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Create Account</span>
              </button>
            </div>

            {/* Form Feedback Alerts */}
            {formError && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 rounded-2xl text-xs flex items-start gap-2.5 bg-rose-950/60 border border-rose-800/80 text-rose-200 shadow-lg"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <p className="leading-snug">{formError}</p>
              </motion.div>
            )}

            {formSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 rounded-2xl text-xs flex items-start gap-2.5 bg-emerald-950/60 border border-emerald-800/80 text-emerald-200 shadow-lg"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="leading-snug">{formSuccess}</p>
              </motion.div>
            )}

            {/* OAuth Failure / Config Notice Banner */}
            {showConfigNotice && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                className="mb-4 p-3 rounded-2xl text-xs space-y-2 border bg-indigo-950/40 border-indigo-800/60 text-indigo-200"
              >
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">OAuth Connection Info</p>
                    <p className="mt-0.5 opacity-90">
                      {authError ||
                        "OAuth authorization requested. You can enter via Demo Mode or Email login below."}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Native Email and Password Form */}
            <form onSubmit={handleEmailAuth} className="space-y-3.5">
              {authMode === "signup" && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Full Name / Display Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. Captain Nemo"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950/90 border border-slate-800 focus:border-cyan-400 focus:outline-none text-xs text-slate-100 placeholder:text-slate-600 transition-all"
                      required={authMode === "signup"}
                    />
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="explorer@nautical.app"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950/90 border border-slate-800 focus:border-cyan-400 focus:outline-none text-xs text-slate-100 placeholder:text-slate-600 transition-all"
                    required
                  />
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-950/90 border border-slate-800 focus:border-cyan-400 focus:outline-none text-xs text-slate-100 placeholder:text-slate-600 transition-all"
                    required
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-2xl font-bold text-sm bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white shadow-lg shadow-cyan-500/25 transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>
                      {authMode === "signup" ? "Create Account" : "Sign In"}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Social SSO Quick Options */}
            <div className="mt-4 pt-4 border-t border-slate-800/80">
              <p className="text-[10px] uppercase font-semibold tracking-wider text-center text-slate-500 mb-2.5">
                Or Sign In with Social SSO
              </p>
              <div className="grid grid-cols-3 gap-2">
                {oauthButtons.map((btn) => (
                  <button
                    key={btn.id}
                    type="button"
                    onClick={() =>
                      btn.id === "google"
                        ? handleGoogleLogin()
                        : handleOAuthSignIn(btn.id)
                    }
                    disabled={loadingProvider !== null}
                    className="py-2 px-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900 text-slate-300 transition-all flex items-center justify-center gap-1.5 text-xs font-medium cursor-pointer"
                  >
                    {btn.icon}
                    <span className="hidden sm:inline">{btn.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Divider & Instant Demo Access */}
            <div className="relative my-4 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <span className="relative px-2 text-[10px] uppercase font-semibold tracking-wider bg-slate-900 text-slate-500">
                Instant Preview
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleGuestDemoLogin("default")}
              className="w-full py-2.5 px-4 rounded-2xl font-semibold text-xs transition-all flex items-center justify-center gap-2 border bg-gradient-to-r from-cyan-950/40 via-indigo-950/40 to-purple-950/40 border-cyan-800/50 text-cyan-200 hover:bg-cyan-900/60 shadow-md cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Launch Demo Session</span>
              <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
            </button>

            {/* Security Trust Badges */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-around text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Supabase Auth
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-cyan-400" />
                Encrypted Credentials
              </span>
              <span className="flex items-center gap-1">
                <Globe className="w-3 h-3 text-indigo-400" />
                Real-Time Sync
              </span>
            </div>
            <p className="mt-3 text-center text-[10px] font-semibold tracking-[0.3em] text-slate-500">
              MATHEW PRESENTS
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
