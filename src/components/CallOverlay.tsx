import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  PhoneCall,
  Volume2,
  Anchor,
  Radio,
  X,
} from "lucide-react";
import { Profile } from "../types";
import { CallState, CallType, IncomingCallInfo } from "../hooks/useWebRTCCall";

interface CallOverlayProps {
  currentUser: Profile;
  callState: CallState;
  callType: CallType;
  targetUser: Profile | null;
  incomingCall: IncomingCallInfo | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isCameraOff: boolean;
  callDuration: number;
  onAccept: () => void;
  onDecline: () => void;
  onEndCall: () => void;
  onToggleMute: () => void;
  onToggleCamera: () => void;
}

export const CallOverlay: React.FC<CallOverlayProps> = ({
  currentUser,
  callState,
  callType,
  targetUser,
  incomingCall,
  localStream,
  remoteStream,
  isMuted,
  isCameraOff,
  callDuration,
  onAccept,
  onDecline,
  onEndCall,
  onToggleMute,
  onToggleCamera,
}) => {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  // Attach local stream to local video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote stream to remote video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    if (remoteAudioRef.current && remoteStream && callType === "audio") {
      remoteAudioRef.current.srcObject = remoteStream;
      void remoteAudioRef.current.play().catch(() => undefined);
    }
  }, [remoteStream, callType]);

  const formatDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (callState === "idle") return null;

  return (
    <AnimatePresence>
      {/* 1. INCOMING CALL RINGING MODAL */}
      {callState === "ringing" && incomingCall && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-6 inset-x-4 max-w-md mx-auto z-50 p-5 rounded-3xl bg-slate-900/95 border-2 border-cyan-400 shadow-2xl backdrop-blur-2xl text-white space-y-4"
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={incomingCall.caller.avatar_url}
                alt={incomingCall.caller.full_name}
                className="w-14 h-14 rounded-full object-cover border-2 border-cyan-400"
              />
              <span className="absolute inset-0 rounded-full border-2 border-cyan-400 animate-ping opacity-75" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-white truncate">
                  {incomingCall.caller.full_name}
                </h4>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-semibold border border-cyan-500/30">
                  Incoming{" "}
                  {incomingCall.callType === "video" ? "Video" : "Audio"} Call
                </span>
              </div>
              <p className="text-xs text-cyan-300 font-mono flex items-center gap-1 mt-0.5">
                <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                Nautical WebRTC Channel Active...
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={onDecline}
              className="flex-1 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
            >
              <PhoneOff className="w-4 h-4" />
              <span>Decline</span>
            </button>

            <button
              onClick={onAccept}
              className="flex-1 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 transition-all cursor-pointer"
            >
              <PhoneCall className="w-4 h-4 animate-bounce" />
              <span>Accept Stream</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* 2. ACTIVE CALL / CALLING / RINGING OVERLAY
          Note: 'ringing' is shown here for the CALLER (callState === 'ringing'
          with no incomingCall) so the outgoing call stays visible after the
          receiver acknowledges. The receiver's incoming-call toast is handled
          by block 1 above (callState === 'ringing' && incomingCall). */}
      {(callState === "calling" ||
        callState === "connected" ||
        (callState === "ringing" && !incomingCall)) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl"
        >
          <div className="relative w-full max-w-4xl h-[85vh] rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden flex flex-col justify-between text-white">
            {/* Header */}
            <div className="absolute top-0 inset-x-0 z-30 p-6 bg-gradient-to-b from-black/90 via-black/40 to-transparent flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 backdrop-blur-md">
                  <Anchor className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base tracking-wide flex items-center gap-2">
                    {targetUser?.full_name ||
                      targetUser?.username ||
                      "Nautical Contact"}
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-semibold border border-emerald-500/30">
                      WebRTC E2EE Stream
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300 font-mono flex items-center gap-1.5 mt-0.5">
                    <Radio className="w-3 h-3 text-emerald-400 animate-ping" />
                    {callState === "calling"
                      ? "Calling..."
                      : callState === "ringing"
                        ? "Ringing..."
                        : formatDuration(callDuration)}
                  </p>
                </div>
              </div>

              <button
                onClick={onEndCall}
                className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Stage / Voice Stage */}
            <div className="relative flex-1 w-full h-full bg-slate-900 flex items-center justify-center overflow-hidden">
              <audio ref={remoteAudioRef} autoPlay playsInline />
              {/* Remote Stream Video */}
              {callType === "video" && remoteStream ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                /* Audio Call Avatar Presentation */
                <div className="relative z-10 flex flex-col items-center justify-center text-center p-6 space-y-4">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-cyan-400 via-indigo-500 to-pink-500 shadow-2xl animate-pulse">
                      <img
                        src={
                          targetUser?.avatar_url ||
                          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300"
                        }
                        alt={targetUser?.full_name}
                        className="w-full h-full rounded-full object-cover border-4 border-slate-900"
                      />
                    </div>
                    <div className="absolute inset-0 -m-4 rounded-full border border-dashed border-cyan-400/40 animate-spin-slow pointer-events-none" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold text-white">
                      {targetUser?.full_name}
                    </h2>
                    <p className="text-sm text-cyan-300 font-medium mt-1">
                      {callState === "calling"
                        ? "Connecting to Harbor Channel..."
                        : callState === "ringing"
                          ? "Ringing the remote harbor..."
                          : "Nautical Voice Channel Active"}
                    </p>
                  </div>
                </div>
              )}

              {/* Local Stream Video Preview */}
              {callType === "video" && (
                <div className="absolute bottom-24 right-6 z-20 w-36 h-48 sm:w-44 sm:h-56 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-slate-950/80 backdrop-blur-md">
                  {!isCameraOff && localStream ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover rounded-xl transform -scale-x-100"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-slate-400">
                      <VideoOff className="w-6 h-6 mb-1 text-slate-500" />
                      <span className="text-[10px]">Camera Off</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Floating Control Dock */}
            <div className="absolute bottom-6 inset-x-0 z-30 flex items-center justify-center gap-4 px-6">
              <div className="flex items-center gap-4 p-3 px-6 rounded-full bg-slate-900/90 border border-slate-700/80 backdrop-blur-xl shadow-2xl">
                {/* Mute Audio */}
                <button
                  onClick={onToggleMute}
                  className={`p-3.5 rounded-full transition-all cursor-pointer ${
                    isMuted
                      ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30"
                      : "bg-white/10 hover:bg-white/20 text-white"
                  }`}
                  title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
                >
                  {isMuted ? (
                    <MicOff className="w-5 h-5" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </button>

                {/* Toggle Camera */}
                {callType === "video" && (
                  <button
                    onClick={onToggleCamera}
                    className={`p-3.5 rounded-full transition-all cursor-pointer ${
                      isCameraOff
                        ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30"
                        : "bg-white/10 hover:bg-white/20 text-white"
                    }`}
                    title={isCameraOff ? "Turn Camera On" : "Turn Camera Off"}
                  >
                    {isCameraOff ? (
                      <VideoOff className="w-5 h-5" />
                    ) : (
                      <Video className="w-5 h-5" />
                    )}
                  </button>
                )}

                {/* End Call Button */}
                <button
                  onClick={onEndCall}
                  className="p-4 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-xl shadow-rose-600/40 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  title="End Call"
                >
                  <PhoneOff className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
