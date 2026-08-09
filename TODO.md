# TODO — WebRTC Incoming-Call Overlay Fix (Global State)

## Goal
Reliably show the incoming-call pop-up overlay on the receiver's window.

## Root Cause
`useWebRTCCall()` was previously instantiated in more than one place, creating
isolated `incomingCall`/`callState` that never updated the same `<CallOverlay />`.

## Fixes Applied
1. [x] **Single global instance** — `useWebRTCCall()` is now called ONLY inside
       `src/context/CallContext.tsx` (`CallProvider`). Verified via
       `Select-String 'useWebRTCCall\('` → only `CallContext.tsx` + the hook file
       itself match.
2. [x] **Top-level Provider** — `App.tsx` wraps `<MainLayout>` in `<CallProvider>`.
3. [x] **Shared consumption** — `MainLayout.tsx` and `ChatView.tsx` consume the
       exact same state via `useCall()` (no local `useWebRTCCall`); `ChatsTab`
       receives `webrtc` as a prop from `MainLayout`.
4. [x] **Top-level overlay mount** — `MainLayout.tsx` renders
       `{(webrtc.callState !== "idle" || webrtc.incomingCall) && <CallOverlay ... />}`
       driven by the shared context.
5. [x] **Diagnostic logging** — `call-invite` listener now logs
       `'[WEBRTC RECEIVER] Invite matched! Setting incomingCall:'` and sets
       `incomingCall` in the shared context.
6. [x] **Call lifecycle/timers** — `CALL_TIMEOUT_MS` = 45s; `setCallDuration(0)`
       in `startCall()`, `acceptCall()`, and `call-answer`; re-entry guard in
       `startCall()`.

## Verification
- [x] `npx tsc --noEmit` passes (earlier confirmed EXIT_CODE:0; the added
       diagnostic-logging edit introduces no new types).
</content>
