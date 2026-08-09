import React, { createContext, useContext, useMemo } from "react";
import { Profile } from "../types";
import { useWebRTCCall, WebRTCState } from "../hooks/useWebRTCCall";

/**
 * Global Call Context — holds a SINGLE shared instance of `useWebRTCCall`
 * mounted once at the app root (`App.tsx`). Because the hook owns the
 * persistent `heylook_global_call_signaling` Supabase channel subscription,
 * incoming-call signaling, ringing chime, and overlay state stay ACTIVE across
 * every tab and view. Any component (MainLayout, ChatView, ChatHeader, etc.)
 * can consume the same shared `callState` / `incomingCall` via `useCall()`.
 */
interface CallContextValue extends WebRTCState {
  currentUser: Profile;
}

const CallContext = createContext<CallContextValue | null>(null);

export function CallProvider({
  currentUser,
  children,
}: {
  currentUser: Profile;
  children: React.ReactNode;
}) {
  const webrtc = useWebRTCCall(currentUser);

  const value = useMemo<CallContextValue>(
    () => ({
      ...webrtc,
      currentUser,
    }),
    [webrtc, currentUser],
  );

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
}

/** Hook to read the shared global WebRTC call state anywhere in the tree. */
export function useCall(): CallContextValue {
  const ctx = useContext(CallContext);
  if (!ctx) {
    throw new Error(
      "useCall() must be used within a <CallProvider>. Mount CallProvider at the app root.",
    );
  }
  return ctx;
}

export default CallProvider;
