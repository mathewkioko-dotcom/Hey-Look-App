# WebRTC Call Crash Fix — useWebRTCCall.ts

## Steps
1. [ ] Add re-entrancy/subscription guard ref
2. [ ] Restructure persistent effect for safe channel rebuilds
3. [ ] Add transient-channel cleanup helper (startCall/acceptCall/declineCall/endCall)
4. [ ] Decouple streams from signaling (stabilize effect deps)
5. [ ] TypeScript check (`tsc --noEmit`)

## Notes
- Fixes `cannot add postgres_changes callbacks ... after subscribe()`
- Prevents `<ChatView>` from crashing on channel errors

