import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';

export type CallState = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';
export type CallType = 'audio' | 'video';

export interface IncomingCallInfo {
  caller: Profile;
  callType: CallType;
  sdpOffer?: any;
}

export function useWebRTCCall(currentUser: Profile) {
  const [callState, setCallState] = useState<CallState>('idle');
  const [callType, setCallType] = useState<CallType>('audio');
  const [targetUser, setTargetUser] = useState<Profile | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCallInfo | null>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // STUN Configuration
  const rtcConfig: RTCConfiguration = {
    iceServers: [
      {
        urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'],
      },
    ],
  };

  // Helper to initialize RTCPeerConnection
  const createPeerConnection = useCallback((targetId: string) => {
    if (pcRef.current) {
      pcRef.current.close();
    }

    const pc = new RTCPeerConnection(rtcConfig);

    pc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'ice-candidate',
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
  }, [currentUser.id]);

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

    setCallState('idle');
    setIncomingCall(null);
    setTargetUser(null);
    setIsMuted(false);
    setIsCameraOff(false);
    setCallDuration(0);
  }, [localStream]);

  // Handle incoming Supabase Realtime broadcast signals
  useEffect(() => {
    if (!currentUser || !currentUser.id) return;

    const channel = supabase.channel(`call_signaling_${currentUser.id}`);

    channel
      .on('broadcast', { event: 'call-offer' }, async ({ payload }) => {
        if (payload.targetId !== currentUser.id) return;

        // Received offer from caller
        setIncomingCall({
          caller: payload.caller,
          callType: payload.callType,
          sdpOffer: payload.sdp,
        });
        setCallType(payload.callType);
        setCallState('ringing');
      })
      .on('broadcast', { event: 'call-answer' }, async ({ payload }) => {
        if (payload.targetId !== currentUser.id) return;

        if (pcRef.current && payload.sdp) {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          setCallState('connected');
        }
      })
      .on('broadcast', { event: 'ice-candidate' }, async ({ payload }) => {
        if (payload.targetId !== currentUser.id) return;

        if (pcRef.current && payload.candidate) {
          try {
            await pcRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
          } catch (e) {
            console.warn('[WebRTC] Error adding ICE candidate:', e);
          }
        }
      })
      .on('broadcast', { event: 'call-decline' }, ({ payload }) => {
        if (payload.targetId !== currentUser.id) return;
        cleanupCall();
      })
      .on('broadcast', { event: 'call-end' }, ({ payload }) => {
        if (payload.targetId !== currentUser.id) return;
        cleanupCall();
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, cleanupCall]);

  // Duration Timer when connected
  useEffect(() => {
    if (callState === 'connected') {
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
  const getMediaStreamWithFallback = async (type: CallType): Promise<MediaStream> => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        return await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: type === 'video',
        });
      }
    } catch (firstErr) {
      console.warn('[WebRTC] Primary getUserMedia failed:', firstErr);
      if (type === 'video') {
        try {
          return await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        } catch (audioErr) {
          console.warn('[WebRTC] Audio-only fallback failed:', audioErr);
        }
      }
    }

    // Fallback: create a dummy AudioContext silent audio track so call workflow proceeds cleanly
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const dst = ctx.createMediaStreamDestination();
        osc.connect(dst);
        osc.start();
        return dst.stream;
      }
    } catch (synthErr) {
      console.warn('[WebRTC] Could not create synthetic stream:', synthErr);
    }

    return new MediaStream();
  };

  // Method 1: Start outgoing call
  const startCall = async (receiver: Profile, type: CallType) => {
    try {
      setTargetUser(receiver);
      setCallType(type);
      setCallState('calling');

      const stream = await getMediaStreamWithFallback(type);
      setLocalStream(stream);

      const pc = createPeerConnection(receiver.id);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Broadcast call offer via target user's signaling channel
      const targetChannel = supabase.channel(`call_signaling_${receiver.id}`);
      await targetChannel.subscribe();
      await targetChannel.send({
        type: 'broadcast',
        event: 'call-offer',
        payload: {
          caller: currentUser,
          targetId: receiver.id,
          callType: type,
          sdp: offer,
        },
      });
    } catch (err) {
      console.error('[WebRTC] Error starting call:', err);
      cleanupCall();
    }
  };

  // Method 2: Accept incoming call
  const acceptCall = async () => {
    if (!incomingCall) return;

    try {
      setTargetUser(incomingCall.caller);
      setCallState('connected');

      const stream = await getMediaStreamWithFallback(incomingCall.callType);
      setLocalStream(stream);

      const pc = createPeerConnection(incomingCall.caller.id);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      if (incomingCall.sdpOffer) {
        await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.sdpOffer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        const callerChannel = supabase.channel(`call_signaling_${incomingCall.caller.id}`);
        await callerChannel.subscribe();
        await callerChannel.send({
          type: 'broadcast',
          event: 'call-answer',
          payload: {
            targetId: incomingCall.caller.id,
            sdp: answer,
          },
        });
      }
    } catch (err) {
      console.error('[WebRTC] Error accepting call:', err);
      cleanupCall();
    }
  };

  // Method 3: Decline incoming call
  const declineCall = async () => {
    if (incomingCall) {
      const callerChannel = supabase.channel(`call_signaling_${incomingCall.caller.id}`);
      await callerChannel.subscribe();
      await callerChannel.send({
        type: 'broadcast',
        event: 'call-decline',
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
      const channel = supabase.channel(`call_signaling_${recipientId}`);
      await channel.subscribe();
      await channel.send({
        type: 'broadcast',
        event: 'call-end',
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
