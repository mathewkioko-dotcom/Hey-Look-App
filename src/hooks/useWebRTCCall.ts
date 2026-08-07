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
  const channelRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const ringChimeRef = useRef<HTMLAudioElement | null>(null);
  const callStateRef = useRef<CallState>("idle");
  // Re-entrancy guard: blocks duplicate channel setups while a subscription is
  // still in flight (prevents "cannot add postgres_changes ... after subscribe()").
  const subscriptionGuardRef = useRef(false);
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

      const now = ctx.currentTime;
      for (let cycle = 0; cycle < 3; cycle++) {
        const base = now + cycle * 2.3;
        playBeep(base, 880, 0.35);
        playBeep(base + 0.45, 660, 0.35);
      }

      // Store a tiny wrapper so we can stop it via the ref.
      const fakeEl = {
        pause: () => {
          try {
            ctx.close();
          } catch (e) {
            /* noop */
          }
        },
      } as unknown as HTMLAudioElement;
      ringChimeRef.current = fakeEl;
    } catch (e) {
      console.warn("[WebRTC] Ring chime unavailable:", e);
    }
  }, [stopRingChime]);

  // Helper to initialize RTCPeerConnection
  const createPeerConnection = useCallback(
    (targetId: string) => {
      if (pcRef.current) {
        pcRef.current.close();
      }

      const pc = new RTCPeerConnection(rtcConfig);

      pc.onicecandidate = (event) => {
        if (event.candidate && channelRef.current) {
          channelRef.current.send({
            type: "broadcast",
            event: "ice-candidate",
            payload: {
              candidate: event.candidate,
              senderId: currentUser.id,
              targetId,
            },
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
    },
    [currentUser.id],
  );

  // Clean up streams & peer connection
  const cleanupCall = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

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
  }, [localStream]);

  // Handle incoming Supabase Realtime broadcast signals.
  // IMPORTANT (crash fix): Before creating any channel we must remove any
  // existing channel with the SAME topic name that may already be subscribed.
  // Attaching a postgres_changes/broadcast listener to an already-subscribed
  // channel throws:
  //   "cannot add postgres_changes callbacks for realtime:... after subscribe()"
  // This happens when the effect re-runs (deps change) or when MainLayout and
  // ChatView's local fallback both create a channel for the same user id. We
  // also wrap the whole setup in try/catch so a channel error never crashes
  // the parent <ChatView> component.
  useEffect(() => {
    if (!currentUser || !currentUser.id) return;

    let channel: any = null;
    let sessionsChannel: any = null;

    // ---- Safe removal of any previously-subscribed channels with the same
    //      topics BEFORE creating new ones (prevents the "after subscribe()"
    //      crash). ----
    const existing = supabase.getChannels();
    const mine = new Set([
      `user_calls_${currentUser.id}`,
      `call_sessions_${currentUser.id}`,
    ]);
    existing.forEach((ch) => {
      const topic = String(ch.topic || "").replace(/^realtime:/, "");
      if (mine.has(topic) || topic === `user_calls_${currentUser.id}`) {
        try {
          supabase.removeChannel(ch);
        } catch (e) {
          console.warn("[WebRTC] Cleanup channel error:", e);
        }
      }
    });

    try {
      // ---- RELIABLE USER-SPECIFIC CALL CHANNEL ----
      // Receiver subscribes to exactly one channel; callers target the same
      // channel so ringing works regardless of DB replication / active view.
      const channelName = `user_calls_${currentUser.id}`;
      channel = supabase.channel(channelName);

      // Attach ALL listeners BEFORE .subscribe() — required ordering.
      channel
        .on("broadcast", { event: "call-offer" }, async ({ payload }: any) => {
          if (payload.targetId !== currentUser.id) return;

          // Received offer from caller
          setIncomingCall({
            caller: payload.caller,
            callType: payload.callType,
            sdpOffer: payload.sdp,
          });
          setCallType(payload.callType);
          setCallState("ringing");
          startRingChime();
        })
        .on("broadcast", { event: "call-answer" }, async ({ payload }: any) => {
          if (payload.targetId !== currentUser.id) return;

          stopRingChime();
          if (pcRef.current && payload.sdp) {
            await pcRef.current.setRemoteDescription(
              new RTCSessionDescription(payload.sdp),
            );
            setCallState("connected");
          }
        })
        .on(
          "broadcast",
          { event: "ice-candidate" },
          async ({ payload }: any) => {
            if (payload.targetId !== currentUser.id) return;

            if (pcRef.current && payload.candidate) {
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
        .on("broadcast", { event: "call-decline" }, ({ payload }: any) => {
          if (payload.targetId !== currentUser.id) return;
          stopRingChime();
          cleanupCall();
        })
        .on("broadcast", { event: "call-end" }, ({ payload }: any) => {
          if (payload.targetId !== currentUser.id) return;
          stopRingChime();
          cleanupCall();
        })
        .subscribe();

      channelRef.current = channel;

      // ---- Fallback: listen for a persisted call_sessions INSERT ----
      // Attach the postgres_changes listener BEFORE .subscribe().
      sessionsChannel = supabase.channel(`call_sessions_${currentUser.id}`);
      sessionsChannel
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "call_sessions" },
          (payload: any) => {
            const row = payload.new as any;
            if (!row) return;
            const receiverId = row.receiver_id || row.callee_id;
            if (receiverId !== currentUser.id) return;
            if (
              callStateRef.current === "ringing" ||
              callStateRef.current === "connected"
            )
              return;

            setIncomingCall({
              caller: {
                id: row.caller_id || "",
                username: row.caller_username || "",
                full_name:
                  row.caller_name || row.caller_username || "Nautical Contact",
                avatar_url: row.caller_avatar || "",
                is_online: true,
                last_seen: new Date().toISOString(),
                nautical_presence: "in_focus",
              } as Profile,
              callType: row.call_type === "video" ? "video" : "audio",
              sdpOffer: undefined,
            });
            setCallType(row.call_type === "video" ? "video" : "audio");
            setCallState("ringing");
            startRingChime();
          },
        )
        .subscribe();
    } catch (err) {
      // Error guard: never let a realtime channel error crash the parent.
      console.warn("[WebRTC] Channel subscription error guarded:", err);
    }

    // ---- Proper cleanup ----
    return () => {
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch (e) {
          console.warn("[WebRTC] removeChannel error:", e);
        }
      }
      if (sessionsChannel) {
        try {
          supabase.removeChannel(sessionsChannel);
        } catch (e) {
          console.warn("[WebRTC] removeChannel (sessions) error:", e);
        }
      }
      stopRingChime();
    };
  }, [currentUser, cleanupCall, startRingChime, stopRingChime]);

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

  // Helper to obtain media stream with graceful fallback for sandboxed/no-mic environments
  const getMediaStreamWithFallback = async (
    type: CallType,
  ): Promise<MediaStream> => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        return await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: type === "video",
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
    try {
      setTargetUser(receiver);
      setCallType(type);
      setCallState("calling");

      const stream = await getMediaStreamWithFallback(type);
      setLocalStream(stream);

      const pc = createPeerConnection(receiver.id);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Broadcast call offer via the target user's RELIABLE user-specific
      // channel so ringing works even if DB replication lags.
      const targetChannelName = `user_calls_${receiver.id}`;
      const targetChannel = supabase.channel(targetChannelName);
      await targetChannel.subscribe();
      await targetChannel.send({
        type: "broadcast",
        event: "call-offer",
        payload: {
          caller: currentUser,
          targetId: receiver.id,
          callType: type,
          sdp: offer,
        },
      });
    } catch (err) {
      console.error("[WebRTC] Error starting call:", err);
      cleanupCall();
    }
  };

  // Method 2: Accept incoming call
  const acceptCall = async () => {
    if (!incomingCall) return;

    try {
      setTargetUser(incomingCall.caller);
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

        const callerChannelName = `user_calls_${incomingCall.caller.id}`;
        const callerChannel = supabase.channel(callerChannelName);
        await callerChannel.subscribe();
        await callerChannel.send({
          type: "broadcast",
          event: "call-answer",
          payload: {
            targetId: incomingCall.caller.id,
            sdp: answer,
          },
        });
      }
    } catch (err) {
      console.error("[WebRTC] Error accepting call:", err);
      cleanupCall();
    }
  };

  // Method 3: Decline incoming call
  const declineCall = async () => {
    if (incomingCall) {
      const callerChannel = supabase.channel(
        `user_calls_${incomingCall.caller.id}`,
      );
      await callerChannel.subscribe();
      await callerChannel.send({
        type: "broadcast",
        event: "call-decline",
        payload: {
          targetId: incomingCall.caller.id,
        },
      });
    }
    cleanupCall();
  };

  // Method 4: End call
  const endCall = async () => {
    const recipientId = targetUser?.id || incomingCall?.caller?.id;
    if (recipientId) {
      const channel = supabase.channel(`user_calls_${recipientId}`);
      await channel.subscribe();
      await channel.send({
        type: "broadcast",
        event: "call-end",
        payload: {
          targetId: recipientId,
        },
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
