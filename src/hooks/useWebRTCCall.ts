import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { Profile } from "../types";

export type CallState = "idle" | "calling" | "ringing" | "connected" | "ended";
export type CallType = "audio" | "video";

export interface IncomingCallInfo {
  caller: Profile;
  callType: CallType;
  sdpOffer?: any;
}

/** Shape of the object returned by useWebRTCCall, shared across the app so
 *  MainLayout can own call state and pass it down to ChatsTab/ChatView. */
export interface WebRTCState {
  callState: CallState;
  callType: CallType;
  targetUser: Profile | null;
  incomingCall: IncomingCallInfo | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isCameraOff: boolean;
  callDuration: number;
  startCall: (receiver: Profile, type: CallType) => Promise<void>;
  acceptCall: () => Promise<void>;
  declineCall: () => Promise<void>;
  endCall: () => Promise<void>;
  toggleMute: () => void;
  toggleCamera: () => void;
}

// A single shared global broadcast channel carrying ALL call signaling
// (call-invite / call-ringing-ack / call-answer / ice-candidate / call-ended),
// so incoming calls trigger the modal from ANY tab or view.
const GLOBAL_CALL_CHANNEL = "heylook_global_call_signaling";
// Outgoing calls are given 45s to be answered before they auto-cancel.
const CALL_TIMEOUT_MS = 45 * 1000;

export function useWebRTCCall(currentUser: Profile) {
  const [callState, setCallState] = useState<CallState>("idle");
  const [callType, setCallType] = useState<CallType>("audio");
  const [targetUser, setTargetUser] = useState<Profile | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCallInfo | null>(
    null,
  );

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const ringChimeRef = useRef<HTMLAudioElement | null>(null);
  // Repeating ring-cycle timer so the synthesized ringtone LOOPS continuously
  // until the call is answered, declined, ended, or the component unmounts.
  const ringChimeTimerRef = useRef<NodeJS.Timeout | null>(null);
  // 30s timeout for outgoing calls that are never answered/acknowledged.
  const callTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callStateRef = useRef<CallState>("idle");
  // Holds the persistent global call-signaling channel (created ONCE on mount).
  const globalCallChannelRef = useRef<any>(null);
  // Tracks whether the global channel is subscribed & ready to send.
  const channelReadyRef = useRef(false);
  // Re-entrancy guard: blocks duplicate channel setups while a subscription is
  // still in flight (prevents "cannot add postgres_changes ... after subscribe()").
  const subscriptionGuardRef = useRef(false);
  // Holds the channel setup function so sendOnGlobalChannel can re-subscribe
  // on demand if the global channel was torn down (broadcast guarantee).
  const setupGlobalChannelRef = useRef<() => void>(() => {});
  // Stable ref to cleanupCall so media-stream changes don't tear down signaling.
  const cleanupCallRef = useRef<() => void>(() => {});

  // STUN Configuration
  const rtcConfig: RTCConfiguration = {
    iceServers: [
      {
        urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"],
      },
    ],
  };

  // ---- Ringing chime audio helpers ----
  const stopRingChime = useCallback(() => {
    // Stop the repeating ring-cycle timer so the ringtone stops looping.
    if (ringChimeTimerRef.current) {
      clearInterval(ringChimeTimerRef.current);
      ringChimeTimerRef.current = null;
    }

    if (ringChimeRef.current) {
      try {
        ringChimeRef.current.pause();
        ringChimeRef.current.currentTime = 0;
        ringChimeRef.current.muted = true;
      } catch (e) {
        console.warn("[WebRTC] Error stopping ring chime:", e);
      }
    }
  }, []);

  const startRingChime = useCallback(() => {
    try {
      stopRingChime();

      // Build a gentle oscillating ringtone using WebAudio (no asset needed).
      const AudioCtx =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx: AudioContext = new AudioCtx();

      // GRACEFUL SUSPENDED-STATE HANDLING: browsers may create the AudioContext
      // in a "suspended" state until a user gesture resumes it. If suspended,
      // attempt `resume()` (best-effort — it may be blocked outside a user
      // gesture, in which case we just continue silently; the ringtone will
      // start once the user interacts, e.g. via startCall/acceptCall).
      if (ctx && ctx.state === "suspended") {
        try {
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          void ctx.resume().catch((e) => {
            console.warn("[WebRTC] AudioContext resume blocked:", e);
          });
        } catch (e) {
          console.warn("[WebRTC] AudioContext resume error:", e);
        }
      }

      const master = ctx.createGain();
      master.gain.value = 0.12;
      master.connect(ctx.destination);

      // Ring pattern: two beeps, brief pause, repeat.
      const playBeep = (startAt: number, freq: number, dur: number) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        g.gain.setValueAtTime(0, startAt);
        g.gain.linearRampToValueAtTime(1, startAt + 0.03);
        g.gain.setValueAtTime(1, startAt + dur - 0.05);
        g.gain.linearRampToValueAtTime(0, startAt + dur);
        osc.connect(g);
        g.connect(master);
        osc.start(startAt);
        osc.stop(startAt + dur + 0.02);
      };

      const playRingCycle = (startAt: number) => {
        const base = startAt;
        playBeep(base, 880, 0.35);
        playBeep(base + 0.45, 660, 0.35);
      };

      // Play one cycle immediately, then LOOP the ringtone every 2.3s until
      // it is stopped (answered / declined / ended / unmount).
      playRingCycle(ctx.currentTime);
      ringChimeTimerRef.current = setInterval(() => {
        playRingCycle(ctx.currentTime);
      }, 2300);

      // Store a tiny wrapper so we can stop it via the ref.
      const fakeEl = {
        pause: () => {
          // AUDIO-CLEANUP GUARD: never attempt to close an already-closed
          // AudioContext — calling close() twice (or after a manual close)
          // throws an InvalidStateError.
          if (ctx && ctx.state !== "closed") {
            try {
              // eslint-disable-next-line @typescript-eslint/no-floating-promises
              void ctx.close().catch((e) => {
                console.warn("[WebRTC] AudioContext close ignored:", e);
              });
            } catch (e) {
              console.warn("[WebRTC] AudioContext close ignored:", e);
            }
          }
        },
        resume: () => {
          // GRACEFUL RESUME: unlock a suspended AudioContext. Only meaningful
          // inside a user gesture (startCall/acceptCall).
          if (ctx && ctx.state === "suspended") {
            return ctx.resume();
          }
          return Promise.resolve();
        },
      } as unknown as HTMLAudioElement;
      ringChimeRef.current = fakeEl;
    } catch (e) {
      console.warn("[WebRTC] Ring chime unavailable:", e);
    }
  }, [stopRingChime]);

  // Resume a suspended AudioContext. Browsers only unlock/start an AudioContext
  // inside a user gesture (e.g. clicking "Call" or "Accept Call"), so call this
  // from startCall/acceptCall so any held ring-chime context resumes cleanly.
  const resumeRingChime = useCallback(() => {
    const el = ringChimeRef.current as any;
    if (el && typeof el.resume === "function") {
      try {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        void el.resume().catch((e: any) => {
          console.warn("[WebRTC] Ring chime resume blocked:", e);
        });
      } catch (e) {
        console.warn("[WebRTC] Ring chime resume error:", e);
      }
    }
  }, []);

  // Helper to initialize RTCPeerConnection
  const createPeerConnection = useCallback(
    (targetId: string) => {
      if (pcRef.current) {
        pcRef.current.close();
      }

      const pc = new RTCPeerConnection(rtcConfig);

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          sendOnGlobalChannel("ice-candidate", {
            candidate: event.candidate,
            callerId: currentUser.id,
            targetUserId: targetId,
          });
        }
      };

      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
        } else {
          const newStream = new MediaStream([event.track]);
          setRemoteStream(newStream);
        }
      };

      pcRef.current = pc;
      return pc;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [currentUser.id],
  );

  // Clean up streams & peer connection. Stops all media tracks, clears all
  // timers/intervals, closes the peer connection, and stops the ringtone.
  const cleanupCall = useCallback(() => {
    // Clear the call-duration timer.
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Clear the outgoing-call timeout.
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }

    // Stop the ringtone (clears interval + closes AudioContext).
    stopRingChime();

    // Actively stop every local media track (camera + mic).
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }

    setRemoteStream(null);

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    setCallState("idle");
    setIncomingCall(null);
    setTargetUser(null);
    setIsMuted(false);
    setIsCameraOff(false);
    setCallDuration(0);
  }, [localStream, stopRingChime]);

  // Keep a stable ref to cleanupCall so media-stream changes don't tear down
  // signaling.
  cleanupCallRef.current = cleanupCall;

  // Send a broadcast on the persistent shared global channel. Because the
  // channel was created with `self: false`, our own broadcasts are not
  // re-delivered back to us (no echo loops). It waits for the channel to be
  // subscribed (ready) before calling `.send()`. If the global channel is
  // somehow not subscribed yet (or torn down), it re-subscribes on demand so
  // critical signaling (e.g. a fresh call-invite) is never dropped.
  const sendOnGlobalChannel = useCallback((event: string, payload: any) => {
    const dynamicSetup = () => {
      const ch = globalCallChannelRef.current;

      const doSend = () =>
        ch.send({ type: "broadcast", event, payload }).catch((e: any) => {
          console.warn("[WebRTC] send error on", event, e);
        });

      // If the channel is already subscribed, send immediately. Otherwise wait
      // for the subscription status to become ready before sending.
      if (channelReadyRef.current) {
        return doSend();
      }
      return new Promise<void>((resolve) => {
        // Poll briefly for readiness (broadcast channels mark ready on
        // SUBSCRIBED). Fall back after a short grace period.
        const startedAt = Date.now();
        const poll = setInterval(() => {
          if (channelReadyRef.current || Date.now() - startedAt > 2000) {
            clearInterval(poll);
            resolve(doSend());
          }
        }, 50);
      });
    };

    const trySend = (): Promise<void> => {
      if (!globalCallChannelRef.current) {
        // Broad-cost guarantee: if the global channel is missing (e.g. the
        // subscription effect has not run yet or the cleanup tore it down),
        // re-create + re-subscribe before sending — but ONLY for critical
        // signaling like call-invite to avoid hammering the socket.
        if (event === "call-invite") {
          console.warn(
            "[WebRTC] Global channel missing on " +
              event +
              "; forcing re-subscribe before send.",
          );
          if (typeof setupGlobalChannelRef.current === "function") {
            setupGlobalChannelRef.current();
          }
          // After re-subscribing, the setup resets channelReadyRef to false, so
          // dynamicSetup will wait for the new SUBSCRIBED status / grace period.
          return dynamicSetup();
        }
        console.warn("[WebRTC] Global channel not ready; dropping", event);
        return Promise.resolve();
      }
      return dynamicSetup();
    };

    return trySend();
  }, []);

  // ---- PERSISTENT GLOBAL SIGNALING SUBSCRIPTION ----
  // Mounted at the ROOT level (MainLayout) for the lifetime of the hook, so an
  // incoming call triggers the Incoming Call Modal on ANY tab or view. All
  // participants share the SAME channel and broadcast events; payload
  // filtering (targetUserId / callerId === currentUserId) routes messages.
  //
  // The actual channel construction + listener registration lives in
  // `doSetupGlobalChannel` so both the effect and `sendOnGlobalChannel` can
  // (re)create it on demand (broadcast guarantee).
  const doSetupGlobalChannel = useCallback(() => {
    if (!currentUser || !currentUser.id) return;
    // Re-entrancy guard to avoid duplicate channel setups on dep churn. If a
    // setup is already in-flight, skip (the caller will wait for readiness).
    if (subscriptionGuardRef.current) return;
    subscriptionGuardRef.current = true;

    let channel: any = null;

    // Safely remove any previously-subscribed channel with the same topic
    // BEFORE creating a new one (prevents the "after subscribe()" crash).
    const existing = supabase.getChannels();
    existing.forEach((ch) => {
      const topic = String(ch.topic || "").replace(/^realtime:/, "");
      if (topic === GLOBAL_CALL_CHANNEL) {
        try {
          supabase.removeChannel(ch);
        } catch (e) {
          console.warn("[WebRTC] Cleanup channel error:", e);
        }
      }
    });

    try {
      channel = supabase.channel(GLOBAL_CALL_CHANNEL, {
        config: { broadcast: { self: false } },
      });

      // Attach ALL listeners BEFORE .subscribe() — required ordering.
      channel
        // RECEIVER: instant incoming-call modal + ring + automatic ack back.
        .on("broadcast", { event: "call-invite" }, ({ payload }: any) => {
          // Debug logging so we can verify the broadcast payload + target
          // matching in real time.
          // eslint-disable-next-line no-console
          console.log(
            "[WebRTC Receiver] Received invite:",
            payload,
            "My User ID:",
            currentUser?.id,
          );

// DIAGNOSTIC LOGGING: verify the invite targets this device. If
          // isMatch is false, the broadcast is reaching the wrong user (e.g.
          // targetUserId is a chat/conv id instead of the receiver's auth id).
          // eslint-disable-next-line no-console
          console.log("[CALL-INVITE DEBUG]", {
            payloadTarget: payload?.targetUserId,
            currentUserId: currentUser?.id,
            isMatch:
              String(payload?.targetUserId) === String(currentUser?.id),
          });

          // Loosened ID check: normalize both sides to strings so a UUID
          // object/typed value or case/casing mismatch on either end never
          // blocks the incoming-call pop-up from rendering.
          if (
            !payload ||
            String(payload.targetUserId) !== String(currentUser?.id)
          ) {
            return;
          }

const caller =
            payload.caller ||
            ({
              id: payload.callerId || "",
              username: payload.callerName || "",
              full_name: payload.callerName || "Nautical Contact",
              avatar_url: payload.callerAvatar || "",
              is_online: true,
              last_seen: new Date().toISOString(),
              nautical_presence: "in_focus",
            } as Profile);

          const incomingCallInfo: IncomingCallInfo = {
            caller,
            callType: payload.isVideo ? "video" : "audio",
            sdpOffer: payload.sdp,
          };

          // ---- DIAGNOSTIC LOGGING ----
          // Verify the invite matched THIS device and that we are about to set
          // the shared context state that drives the <CallOverlay /> pop-up.
          // If this fires but no modal appears, the overlay mount condition in
          // MainLayout is the next thing to check.
          // eslint-disable-next-line no-console
          console.log(
            '[WEBRTC RECEIVER] Invite matched! Setting incomingCall:',
            incomingCallInfo,
          );

          // Instantly pop up the Incoming Call Modal + ring.
          setTargetUser(caller);
          setIncomingCall(incomingCallInfo);
          setCallType(payload.isVideo ? "video" : "audio");
          setCallState("ringing");
          startRingChime();

          // Automatically send 'call-ringing-ack' back to the caller so THEIR
          // device flips from 'calling...' to 'ringing...'.
          if (payload.callerId) {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            sendOnGlobalChannel("call-ringing-ack", {
              callerId: payload.callerId,
              targetUserId: currentUser.id,
            });
          }
        })
        // CALLER: received ack -> flip from 'calling...' to 'ringing...' and
        // start looping the outgoing ringtone.
        .on("broadcast", { event: "call-ringing-ack" }, ({ payload }: any) => {
          if (
            !payload ||
            String(payload.callerId) !== String(currentUser?.id)
          ) {
            return;
          }
          setCallState("ringing");
          startRingChime();
        })
        // CALLER: receiver answered -> stop ringing, connect.
        .on("broadcast", { event: "call-answer" }, async ({ payload }: any) => {
          stopRingChime();
          if (pcRef.current && payload && payload.sdp) {
            await pcRef.current.setRemoteDescription(
              new RTCSessionDescription(payload.sdp),
            );
            // Instantly connect and reset the call-duration counter so the
            // caller's timer starts from 0 the moment the receiver answers.
            setCallState("connected");
            setCallDuration(0);
          }
        })
        // BOTH: exchange ICE candidates.
        .on(
          "broadcast",
          { event: "ice-candidate" },
          async ({ payload }: any) => {
            if (pcRef.current && payload && payload.candidate) {
              try {
                await pcRef.current.addIceCandidate(
                  new RTCIceCandidate(payload.candidate),
                );
              } catch (e) {
                console.warn("[WebRTC] Error adding ICE candidate:", e);
              }
            }
          },
        )
        // EITHER SIDE: call ended/declined -> stop ringing, reset to idle.
        .on("broadcast", { event: "call-ended" }, ({ payload }: any) => {
          if (!payload) return;
          if (
            String(payload.targetUserId) === String(currentUser?.id) ||
            String(payload.callerId) === String(currentUser?.id)
          ) {
            stopRingChime();
            cleanupCallRef.current();
          }
        })
        .subscribe((status: any) => {
          if (status === "SUBSCRIBED") {
            channelReadyRef.current = true;
          }
        });

      globalCallChannelRef.current = channel;
    } catch (err) {
      // Error guard: never let a realtime channel error crash the parent.
      console.warn("[WebRTC] Channel subscription error guarded:", err);
    }
  }, [currentUser, startRingChime, stopRingChime, sendOnGlobalChannel]);

  // Keep the latest setup function reachable for on-demand re-subscription.
  setupGlobalChannelRef.current = doSetupGlobalChannel;

  // Subscribe whenever the current user id changes (global channel follows the
  // signed-in user). Re-runs are idempotent thanks to the re-entrancy guard.
  useEffect(() => {
    if (!currentUser?.id) return;

    // Reset readiness so viewers/senders wait for the (re)subscribe.
    channelReadyRef.current = false;
    doSetupGlobalChannel();

    // ---- Proper cleanup ----
    return () => {
      // Release the re-entrancy guard so the next dependency-driven run can
      // safely rebuild channels.
      subscriptionGuardRef.current = false;
      channelReadyRef.current = false;

      const ch = globalCallChannelRef.current;
      if (ch) {
        try {
          supabase.removeChannel(ch);
        } catch (e) {
          console.warn("[WebRTC] removeChannel error:", e);
        }
      }
      if (globalCallChannelRef.current === ch) {
        globalCallChannelRef.current = null;
      }
      stopRingChime();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  // Keep callStateRef in sync with callState (used by the fallback listener guard)
  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  // Duration Timer when connected
  useEffect(() => {
    if (callState === "connected") {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [callState]);

  // Full cleanup on unmount: stop ringtone, media tracks, timers, & peer conn.
  useEffect(() => {
    return () => {
      cleanupCallRef.current();
    };
  }, []);

  // Helper to obtain media stream with graceful fallback for sandboxed/no-mic
  // environments. Explicitly requests video + audio with camera permission
  // handling baked in.
  const getMediaStreamWithFallback = async (
    type: CallType,
  ): Promise<MediaStream> => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        return await navigator.mediaDevices.getUserMedia({
          audio: true,
          // Explicitly request video tracks with ideal 720p front-camera
          // constraints for video calls; otherwise omit video entirely.
          video:
            type === "video"
              ? {
                  width: { ideal: 1280 },
                  height: { ideal: 720 },
                  facingMode: "user",
                }
              : false,
        });
      }
    } catch (firstErr) {
      console.warn("[WebRTC] Primary getUserMedia failed:", firstErr);
      if (type === "video") {
        try {
          return await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false,
          });
        } catch (audioErr) {
          console.warn("[WebRTC] Audio-only fallback failed:", audioErr);
        }
      }
    }

    // Fallback: create a dummy AudioContext silent audio track so call workflow proceeds cleanly
    try {
      const AudioCtx =
        window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const dst = ctx.createMediaStreamDestination();
        osc.connect(dst);
        osc.start();
        return dst.stream;
      }
    } catch (synthErr) {
      console.warn("[WebRTC] Could not create synthetic stream:", synthErr);
    }

    return new MediaStream();
  };

  // Method 1: Start outgoing call
  const startCall = async (receiver: Profile, type: CallType) => {
    // Re-entrancy guard: prevent placing a NEW call if one is already active,
    // ringing, or connecting. Keeps the caller overlay pinned and avoids
    // duplicate 'call-invite' broadcasts / overlapping peer connections.
    if (
      callStateRef.current === "calling" ||
      callStateRef.current === "ringing" ||
      callStateRef.current === "connected"
    ) {
      console.warn("[WebRTC] Cannot start a new call while one is active.");
      return;
    }

    try {
      // This is a user-gesture handler (clicking "Call"), so attempt to resume
      // any suspended ring-chime AudioContext now that audio is allowed.
      resumeRingChime();
      stopRingChime();

      // Always reset the call-duration counter when a fresh call starts so the
      // timer never inherits a stale value from a previous call.
      setCallDuration(0);

      setTargetUser(receiver);
      setCallType(type);
      // Explicit call-status state machine: the caller starts in 'calling...'.
      // IMPORTANT: we do NOT reset to 'idle' on non-fatal background warnings;
      // the caller modal stays open in 'calling' until answered or timed out.
      setCallState("calling");

      const stream = await getMediaStreamWithFallback(type);
      setLocalStream(stream);

      const pc = createPeerConnection(receiver.id);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Debug logging to verify the outgoing broadcast targets the intended
      // recipient user id (NOT a chat/conversation id).
      // eslint-disable-next-line no-console
      console.log(
        "[WebRTC Caller] Sending invite to targetUserId:",
        receiver.id,
      );

      // Broadcast 'call-invite' on the SHARED global channel. The receiver's
      // listener filters by targetUserId and emits a 'call-ringing-ack' back.
      await sendOnGlobalChannel("call-invite", {
        callerId: currentUser.id,
        callerName: currentUser.full_name || currentUser.username,
        callerAvatar: currentUser.avatar_url,
        targetUserId: receiver.id,
        isVideo: type === "video",
        caller: currentUser,
        sdp: offer,
      });

      // Auto-cancel the outgoing call if it is never acknowledged/answered
      // within CALL_TIMEOUT_MS (30s). Non-fatal — keeps the modal open until
      // the timeout elapses.
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
      }
      callTimeoutRef.current = setTimeout(() => {
        if (
          callStateRef.current === "calling" ||
          callStateRef.current === "ringing"
        ) {
          cleanupCallRef.current();
        }
      }, CALL_TIMEOUT_MS);
    } catch (err) {
      console.error("[WebRTC] Error starting call:", err);
      cleanupCall();
    }
  };

  // Method 2: Accept incoming call
  const acceptCall = async () => {
    if (!incomingCall) return;

    try {
      // This is a user-gesture handler (clicking "Accept Call"), so attempt to
      // resume any suspended ring-chime AudioContext now that audio is allowed.
      resumeRingChime();
      // Stop the ringing sound immediately once the call is answered.
      stopRingChime();

      // Clear any pending outgoing-call timeout (if relevant).
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
        callTimeoutRef.current = null;
      }

      // Immediately reset the call-duration counter when the receiver accepts
      // so the timer always starts from 0 on 'connected'.
      setCallDuration(0);

      setCallState("connected");

      const stream = await getMediaStreamWithFallback(incomingCall.callType);
      setLocalStream(stream);

      const pc = createPeerConnection(incomingCall.caller.id);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      if (incomingCall.sdpOffer) {
        await pc.setRemoteDescription(
          new RTCSessionDescription(incomingCall.sdpOffer),
        );
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        await sendOnGlobalChannel("call-answer", {
          callerId: currentUser.id,
          targetUserId: incomingCall.caller.id,
          sdp: answer,
        });
      }
    } catch (err) {
      console.error("[WebRTC] Error accepting call:", err);
      cleanupCall();
    }
  };

  // Method 3: Decline incoming call
  const declineCall = async () => {
    // Stop the ringing sound immediately when the call is declined.
    stopRingChime();
    if (incomingCall) {
      await sendOnGlobalChannel("call-ended", {
        callerId: currentUser.id,
        targetUserId: incomingCall.caller.id,
      });
    }
    cleanupCall();
  };

  // Method 4: End call
  const endCall = async () => {
    // Stop the ringing sound immediately when the call is ended.
    stopRingChime();
    const recipientId = targetUser?.id || incomingCall?.caller?.id;
    if (recipientId) {
      await sendOnGlobalChannel("call-ended", {
        callerId: currentUser.id,
        targetUserId: recipientId,
      });
    }
    cleanupCall();
  };

  // Method 5: Toggle Mute
  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted((prev) => !prev);
    }
  };

  // Method 6: Toggle Camera
  const toggleCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsCameraOff((prev) => !prev);
    }
  };

  return {
    callState,
    callType,
    targetUser,
    incomingCall,
    localStream,
    remoteStream,
    isMuted,
    isCameraOff,
    callDuration,
    startCall,
    acceptCall,
    declineCall,
    endCall,
    toggleMute,
    toggleCamera,
  };
}
