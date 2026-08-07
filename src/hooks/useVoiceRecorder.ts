import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

export interface VoiceRecordingResult {
  /** Public URL of the uploaded audio clip (or object URL fallback). */
  audioUrl: string;
  /** Human-readable duration string like "0:08". */
  duration: string;
  /** MIME type of the recording (e.g. audio/webm;codecs=opus). */
  mimeType: string;
  /** Raw blob for local playback before upload resolves. */
  blob: Blob;
  /** Local object URL (revoked after upload completes). */
  previewUrl: string;
}

const STORAGE_BUCKET = "voice-notes";

/**
 * WhatsApp-style voice note recorder hook.
 *
 * - Uses the standard browser MediaRecorder API (64kbps Opus WebM when
 *   supported) to capture microphone input.
 * - Exposes start / stop / cancel with a live elapsed timer.
 * - Uploads the finished blob to a Supabase Storage bucket (`voice-notes`)
 *   and resolves the public URL so the message can be persisted with
 *   `type: "voice"` + `audio_url`.
 */
export function useVoiceRecorder(currentUserId?: string) {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup tracks + timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  /** Start a new recording session. */
  const startRecording = useCallback(async (): Promise<boolean> => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Microphone not supported in this browser.");
        return false;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      let options: MediaRecorderOptions = { audioBitsPerSecond: 64000 };
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        options = { ...options, mimeType: "audio/webm;codecs=opus" };
      } else if (MediaRecorder.isTypeSupported("audio/webm")) {
        options = { ...options, mimeType: "audio/webm" };
      }

      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        // Tracks are stopped by caller (stop or cancel).
      };

      recorder.start();
      setIsRecording(true);
      setElapsedSeconds(0);
      setError(null);

      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);

      return true;
    } catch (err: any) {
      console.error("[useVoiceRecorder] Mic access failed:", err);
      setError(
        err?.message ||
          "Could not access microphone. Please check permissions.",
      );
      return false;
    }
  }, []);

  /** Stop recording, assemble the blob, upload to Supabase, return result. */
  const stopRecording =
    useCallback(async (): Promise<VoiceRecordingResult | null> => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        stopTracks();
        setIsRecording(false);
        return null;
      }

      const mimeType = recorder.mimeType || "audio/webm";
      const durationLabel = formatClock(elapsedSeconds);

      const stopPromise = new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
      });

      recorder.stop();
      await stopPromise;

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setIsRecording(false);
      stopTracks();

      const blob = new Blob(audioChunksRef.current, { type: mimeType });
      if (blob.size === 0) {
        setError("Recording was empty. Please try again.");
        return null;
      }

      const previewUrl = URL.createObjectURL(blob);

      // Upload to Supabase Storage with a stable per-user + timestamp path.
      let publicUrl = previewUrl;
      try {
        const ext = mimeType.includes("ogg")
          ? "ogg"
          : mimeType.includes("mp4") || mimeType.includes("m4a")
            ? "m4a"
            : "webm";
        const fileName = `${currentUserId || "anon"}_${Date.now()}.${ext}`;
        const filePath = `voice-notes/${fileName}`;

        const { data, error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(filePath, blob, { contentType: mimeType, upsert: false });

        if (uploadError) {
          console.warn(
            "[useVoiceRecorder] Storage upload failed, using object URL fallback:",
            uploadError.message,
          );
        } else {
          const { data: publicData } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(data.path);
          publicUrl = publicData.publicUrl;
          // Release the local object URL now that we have a real URL.
          setTimeout(() => URL.revokeObjectURL(previewUrl), 5000);
        }
      } catch (err) {
        console.warn("[useVoiceRecorder] Upload exception:", err);
      }

      return {
        audioUrl: publicUrl,
        duration: durationLabel,
        mimeType,
        blob,
        previewUrl,
      };
    }, [currentUserId, elapsedSeconds, stopTracks]);

  /** Cancel the current recording and discard the audio. */
  const cancelRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.ondataavailable = null;
      recorder.onstop = null;
      try {
        recorder.stop();
      } catch {
        /* noop */
      }
    }
    audioChunksRef.current = [];
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
    setElapsedSeconds(0);
    stopTracks();
    setError(null);
  }, [stopTracks]);

  return {
    isRecording,
    elapsedSeconds,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}

/** Format seconds as m:ss for the live timer label. */
export const formatClock = (sec: number): string => {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
};
