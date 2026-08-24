import React, { useState, useEffect } from "react";
import { SplashScreen } from "./components/SplashScreen";
import { AuthScreen } from "./components/AuthScreen";
import { MainLayout } from "./components/MainLayout";
import { Profile } from "./types";
import { supabase } from "./lib/supabase";
import { CallProvider } from "./context/CallContext";
import { ensureProfile } from "./services/chatService.profiles";

type AppStep = "splash" | "auth" | "main";

class AppErrorBoundary extends React.Component<
  React.PropsWithChildren,
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-slate-950 px-6 py-16 text-center text-white">
          <h1 className="text-xl font-bold">HeyLook could not open</h1>
          <p className="mx-auto mt-2 max-w-lg text-sm text-slate-400">
            {this.state.error.message || "An unexpected error occurred after sign-in."}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-bold text-slate-950"
          >
            Reload HeyLook
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [step, setStep] = useState<AppStep>("splash");
  const [isDark, setIsDark] = useState<boolean>(true); // Sleek dark mode default as requested
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);

  // Apply dark mode class to html element for Tailwind
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  // Listen for Supabase Auth state changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        const u = session.user;
        const profile = {
          id: u.id,
          username:
            u.user_metadata?.username ||
            u.user_metadata?.preferred_username ||
            u.email?.split("@")[0] ||
            "nautical_user",
          full_name:
            u.user_metadata?.full_name ||
            u.user_metadata?.name ||
            u.email?.split("@")[0] ||
            "Nautical Explorer",
          avatar_url:
            u.user_metadata?.avatar_url ||
            u.user_metadata?.picture ||
            `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(u.id)}`,
          email: u.email,
          is_online: true,
          last_seen: new Date().toISOString(),
          bio: "✨ Exploring the future of social apps on HeyLook!",
          followers_count: 1420,
          following_count: 380,
          posts_count: 24,
        };
        void ensureProfile(profile);
        setCurrentUser(profile);
        setStep("main");
      } else if (event === "SIGNED_OUT") {
        setCurrentUser(null);
        setStep("auth");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSplashFinish = (sessionExists: boolean, userSession?: any) => {
    if (sessionExists && userSession) {
      setCurrentUser({
        id: userSession.id,
        username:
          userSession.user_metadata?.username ||
          userSession.email?.split("@")[0] ||
          "nautical_user",
        full_name:
          userSession.user_metadata?.full_name ||
          userSession.user_metadata?.name ||
          userSession.email?.split("@")[0] ||
          "Nautical Explorer",
        avatar_url:
          userSession.user_metadata?.avatar_url ||
          userSession.user_metadata?.picture ||
          `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(userSession.id)}`,
        email: userSession.email,
        is_online: true,
        last_seen: new Date().toISOString(),
        bio: "✨ Exploring the future of social apps on HeyLook!",
        followers_count: 1420,
        following_count: 380,
        posts_count: 24,
      });
      setStep("main");
    } else {
      setCurrentUser(null);
      setStep("auth");
    }
  };

  const handleLoginSuccess = (profile: Profile) => {
    void ensureProfile(profile);
    setCurrentUser(profile);
    setStep("main");
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Signout note:", e);
    }
    setStep("auth");
  };

  const handleUpdateProfile = (updatedProps: Partial<Profile>) => {
    setCurrentUser((prev) => {
      if (!prev) {
        return null;
      }

      return {
        ...prev,
        ...updatedProps,
      } as Profile;
    });
  };

  return (
    <AppErrorBoundary>
    <div
      className={
        isDark
          ? "dark bg-[#050505] text-[#e0e0e0] min-h-screen w-full overflow-x-hidden"
          : "bg-slate-50 text-slate-900 min-h-screen w-full overflow-x-hidden"
      }
    >
      {step === "splash" && (
        <SplashScreen onFinish={handleSplashFinish} isDark={isDark} />
      )}

      {step === "auth" && (
        <AuthScreen
          isDark={isDark}
          onToggleTheme={() => setIsDark(!isDark)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {step === "main" && currentUser && (
        <CallProvider currentUser={currentUser}>
          <MainLayout
            currentUser={currentUser}
            onUpdateProfile={handleUpdateProfile}
            onLogout={handleLogout}
            isDark={isDark}
            onToggleTheme={() => setIsDark(!isDark)}
          />
        </CallProvider>
      )}
    </div>
    </AppErrorBoundary>
  );
}
