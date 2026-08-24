import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, Lock, Mic } from "lucide-react";

interface WaveformPlayerProps {
  src: string;
  duration?: string;
  isMe?: boolean;
  compact?: boolean;
}

/**
 * Deterministic pseudo-random waveform generator seeded by the audio URL so
 * the same voice note always renders the same bar pattern (no flicker on re-
 * render) while still looking organic across different messages.
 */
const generateBars = (seed: string, count: number): number[] => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const bars: number[] = [];
  for (let i = 0; i < count; i++) {
    hash = (hash * 1103515245 + 12345) >>> 0;
    const r = (hash % 100) / 100; // 0..1
    const wave = Math.abs(Math.sin(i * 0.55) * 0.6 + r * 0.4);
    bars.push(Math.max(0.18, Math.min(1, wave)));
  }
  return bars;
};

/** Format seconds as m:ss (e.g. 92 -> "1:32"). */
const formatSeconds = (sec: number): string => {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
};

/**
 * Parse a stored duration string like "0:08" or "92" or "1:32" into seconds.
 */
const parseDuration = (duration?: string): number => {
  if (!duration) return 0;
  const trimmed = duration.trim();
  if (trimmed.includes(":")) {
    const parts = trimmed.split(":").map(Number);
    if (parts.length === 2 && parts.every(Number.isFinite)) {
      return parts[0] * 60 + parts[1];
    }
  }
  const num = Number(trimmed);
  return Number.isFinite(num) && num > 0 ? num : 0;
};

/**
 * WhatsApp-style voice note bubble: play/pause control, seeded waveform
 * visualizer with a live progress scrubber, and duration / time labels.
 */
export const WaveformPlayer: React.FC<WaveformPlayerProps> = ({
  src,
  duration,
  isMe,
  compact,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(parseDuration(duration));

  const totalSeconds = totalDuration || parseDuration(duration);
  const BAR_COUNT = compact ? 28 : 40;
  const bars = React.useMemo(
    () => generateBars(src || "waveform", BAR_COUNT),
    [src, BAR_COUNT],
  );

  // Auto-pause when src changes (e.g. switching conversations)
  useEffect(() => {
    setProgress(0);
    setCurrentTime(0);
    setIsPlaying(false);
  }, [src]);

  // Sync duration from the audio metadata once loaded (fallback to stored)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onLoaded = () => {
      if (isFinite(audio.duration) && audio.duration > 0) {
        setTotalDuration(audio.duration);
      }
    };
    audio.addEventListener("loadedmetadata", onLoaded);
    return () => audio.removeEventListener("loadedmetadata", onLoaded);
  }, [src]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      // `play()` returns a Promise that rejects on autoplay-policy blocks,
      // unsupported codecs, network/CORS failures, etc. Previously this was
      // fired-and-forgotten while `isPlaying` was set optimistically, so a
      // failed play left the button stuck showing "Pause" with nothing
      // actually playing. Await it and roll the state back on failure.
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn("[WaveformPlayer] Playback failed:", err);
          setIsPlaying(false);
        });
    }
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio || !isFinite(audio.duration) || audio.duration <= 0) return;
    const pct = audio.currentTime / audio.duration;
    setProgress(Math.min(1, Math.max(0, pct)));
    setCurrentTime(audio.currentTime);
    if (isFinite(audio.duration)) setTotalDuration(audio.duration);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(1);
    setCurrentTime(totalSeconds);
  };

  // Click / drag to seek on the waveform scrubber
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !isFinite(audio.duration) || audio.duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(
      1,
      Math.max(0, (e.clientX - rect.left) / rect.width),
    );
    audio.currentTime = ratio * audio.duration;
    setProgress(ratio);
    setCurrentTime(ratio * audio.duration);
  };

  const displayedTime = isPlaying || progress > 0 ? currentTime : 0;
  const timeLabel = progress > 0 ? formatSeconds(displayedTime) : "";
  const totalLabel = formatSeconds(totalSeconds);

  return (
    <div
      className={`flex items-center gap-2.5 select-none ${
        isMe
          ? "bg-indigo-700/60 border border-indigo-500/30"
          : "bg-slate-950/70 border border-slate-800"
      } rounded-xl px-2.5 py-2 w-60 sm:w-72 ${compact ? "w-52 sm:w-60" : ""}`}
    >
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Play / Pause Button */}
      <button
        onClick={togglePlay}
        className="shrink-0 w-9 h-9 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
        title={isPlaying ? "Pause voice note" : "Play voice note"}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 fill-current" />
        ) : (
          <Play className="w-4 h-4 fill-current ml-0.5" />
        )}
      </button>

      {/* Waveform + Scrubber */}
      <div
        className="flex-1 flex items-center gap-[2px] h-9 cursor-pointer"
        onClick={handleSeek}
        title="Click to seek"
      >
        {bars.map((h, i) => {
          const idx = i / bars.length;
          const isPlayed = idx <= progress;
          const barHeight = Math.max(4, Math.round(h * 32));
          return (
            <span
              key={i}
              className="flex-1 rounded-full transition-colors duration-75"
              style={{
                height: `${barHeight}px`,
                backgroundColor: isPlayed
                  ? isMe
                    ? "#67e8f9"
                    : "#22d3ee"
                  : "rgba(148,163,184,0.35)",
              }}
            />
          );
        })}
      </div>

      {/* Duration / Current Time + E2EE Badge */}
      <div className="flex flex-col items-end shrink-0 gap-0.5">
        <span className="text-[10px] font-bold text-slate-300 tabular-nums">
          {progress > 0 ? `${timeLabel} / ${totalLabel}` : totalLabel}
        </span>
        <span className="flex items-center gap-1 text-[9px] text-cyan-400/80 font-mono">
          <Lock className="w-2.5 h-2.5" />
          <span>E2EE</span>
        </span>
      </div>
    </div>
  );
};
