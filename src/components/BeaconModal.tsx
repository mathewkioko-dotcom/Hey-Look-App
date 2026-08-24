import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Radio,
  Image as ImageIcon,
  Video,
  Mic,
  Code,
  Clock,
  Lock,
  MessageSquare,
  Sparkles,
  Send,
  Flame,
  Type,
  Palette,
  Square,
  Play,
  Pause,
  Upload,
  FileAudio,
  Activity,
  Sliders,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { Beacon, Profile } from '../types';
import { supabase } from '../lib/supabase';

interface BeaconModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Profile;
  onCreateBeacon: (newBeacon: Beacon) => void;
  /** Present only when the modal is opened from within a 1:1 chat — enables
   * the "This Chat Only" audience option, scoped to that chat partner. */
  chatPartner?: { id: string; name: string };
}

const PRESET_GRADIENTS = [
  'from-cyan-600 via-indigo-600 to-purple-800',
  'from-rose-500 via-purple-600 to-indigo-800',
  'from-amber-500 via-rose-600 to-purple-900',
  'from-emerald-600 via-teal-700 to-cyan-900',
  'from-slate-900 via-cyan-950 to-slate-900',
];

export const AUDIO_VISUALIZERS = [
  'frequency',
  'sonar',
  'neon',
  'ripples',
  'orbital',
  'cassette',
  'vinyl',
  'matrix',
  'laser',
  'telemetry',
] as const;

export const GOOGLE_FONTS_200 = [
  'Abel', 'Abril Fatface', 'Acme', 'Advent Pro', 'Alegreya', 'Alex Brush', 'Alfa Slab One', 'Amatic SC',
  'Amiri', 'Anonymus Pro', 'Antic Didone', 'Anton', 'Architects Daughter', 'Arimo', 'Arsenal', 'Asap',
  'Assistant', 'Atomic Age', 'Audiowide', 'Bebas Neue', 'BioRhyme', 'Bodoni Moda', 'Bungee', 'Cabin',
  'Cairo', 'Calligraffitti', 'Cantarell', 'Caveat', 'Chakra Petch', 'Charm', 'Cinzel', 'Comfortaa',
  'Cookie', 'Cormorant', 'Courgette', 'Covered By Your Grace', 'Creepster', 'Dancing Script', 'Declaration', 'DM Sans',
  'Domine', 'Dosis', 'Eczar', 'El Messiri', 'Electrolize', 'Enriqueta', 'Epilogue', 'Exo 2',
  'Fira Code', 'Fjalla One', 'Fredoka', 'Fugaz One', 'Garamond', 'Geist', 'Great Vibes', 'Gruppo',
  'Hammersmith One', 'Heebo', 'Hind', 'Hitmost', 'Iceberg', 'Imbue', 'Inconsolata', 'Indie Flower',
  'Inter', 'Josefin Sans', 'Jura', 'Kalam', 'Kanit', 'Karma', 'Kaushan Script', 'Khand',
  'Kumar One', 'Lato', 'Lexend', 'Libre Baskerville', 'Lobster', 'Lora', 'Luckiest Guy', 'Macondo',
  'Manrope', 'Marcellus', 'Maven Pro', 'Merriweather', 'Monoton', 'Montserrat', 'Museum', 'Nanum Gothic',
  'Neucha', 'Newsreader', 'Niconne', 'Notable', 'Noto Sans', 'Nunito', 'Old Standard TT', 'Oleo Script',
  'Open Sans', 'Orbitron', 'Oswald', 'Outfit', 'Overpass', 'Oxygen', 'Pacifico', 'Parisienne',
  'Passero One', 'Patua One', 'Permanent Marker', 'Philosopher', 'Playfair Display', 'Plus Jakarta Sans', 'Poiret One', 'Poppins',
  'Prata', 'Press Start 2P', 'Prompt', 'PT Sans', 'Public Sans', 'Quicksand', 'Rajdhani', 'Rakkas',
  'Raleway', 'Rammetto One', 'Righteous', 'Roboto', 'Rubik', 'Russo One', 'Sacramento', 'Saira',
  'Satisfy', 'Schooldays', 'Shadows Into Light', 'Shantell Sans', 'Sigmar', 'Silkscreen', 'Sora', 'Space Grotesk',
  'Spectral', 'Staatliches', 'Syne', 'Teko', 'Titillium Web', 'Trirong', 'Ubuntu', 'UnifrakturMaguntia',
  'Varela Round', 'Vast Shadow', 'Vibur', 'Vollkorn', 'Wallpoet', 'Work Sans', 'Yatra One', 'Yellowtail',
  'Zeyada', 'Anek Malayalam', 'Barlow', 'Bebas Neue', 'Bitter', 'Bree Serif', 'Cardo', 'Chivo',
  'Cormorant Garamond', 'Crimson Text', 'Fira Sans', 'Inconsolata', 'Inter Tight', 'Jost', 'Karla', 'Libre Franklin',
  'Merriweather Sans', 'Mukta', 'Mulish', 'Noto Serif', 'Overpass Mono', 'PT Serif', 'Red Hat Display', 'Rubik Mono One',
  'Source Code Pro', 'Source Sans 3', 'Space Mono', 'Urbanist', 'Varela', 'Volkhov', 'Yantramanav', 'Zilla Slab'
].sort();

export const loadGoogleFont = (fontName: string) => {
  if (!fontName) return;
  const formattedFamily = fontName.replace(/\s+/g, '+');
  const linkId = `google-font-${formattedFamily}`;
  if (!document.getElementById(linkId)) {
    const link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${formattedFamily}:wght@400;700&display=swap`;
    document.head.appendChild(link);
  }
};

/** Client-Side Photo Compression to WebP max 1080p, 0.75 quality */
export const compressImage = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const MAX_DIM = 1080;
        let width = img.width;
        let height = img.height;

        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              resolve(file);
            }
          },
          'image/webp',
          0.75
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export const BeaconModal: React.FC<BeaconModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onCreateBeacon,
  chatPartner,
}) => {
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'audio' | 'text'>('text');
  const [textContent, setTextContent] = useState('');
  
  // File & Media Preview state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);

  // Audio Recorder State Machine
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string>('');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioVisualizer, setAudioVisualizer] = useState<typeof AUDIO_VISUALIZERS[number]>('frequency');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Styling & Aura State
  const [selectedGradient, setSelectedGradient] = useState(PRESET_GRADIENTS[0]);
  const [customHex, setCustomHex] = useState('#06b6d4');
  const [useCustomHex, setUseCustomHex] = useState(false);
  
  // Typography State
  const [mainFontFamily, setMainFontFamily] = useState('Inter');
  const [captionFontFamily, setCaptionFontFamily] = useState('Roboto');

  // Expiry TTL State
  const [ttlSetting, setTtlSetting] = useState<'1h' | '6h' | '12h' | '24h' | '48h' | '7d' | '1-time' | 'custom'>('24h');
  const [customHours, setCustomHours] = useState<number>(3);
  const [allowPublicComments, setAllowPublicComments] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Audience: who can see this Beacon. Defaults to a chat-scoped anchor when
  // opened from within a 1:1 chat, otherwise visible to everyone.
  const [audience, setAudience] = useState<'Everyone' | 'Contacts Only' | 'This Chat Only'>(
    chatPartner ? 'This Chat Only' : 'Everyone',
  );

  // Load selected fonts dynamically
  useEffect(() => {
    loadGoogleFont(mainFontFamily);
    loadGoogleFont(captionFontFamily);
  }, [mainFontFamily, captionFontFamily]);

  // Clean up object URLs when unmounting or changing files
  useEffect(() => {
    return () => {
      if (mediaPreviewUrl && mediaPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(mediaPreviewUrl);
      }
      if (recordedAudioUrl && recordedAudioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(recordedAudioUrl);
      }
    };
  }, [mediaPreviewUrl, recordedAudioUrl]);

  if (!isOpen) return null;

  // Format Switch Reset
  const handleFormatChange = (newType: 'image' | 'video' | 'audio' | 'text') => {
    setMediaType(newType);
    setTextContent('');
    setSelectedFile(null);
    if (mediaPreviewUrl && mediaPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(mediaPreviewUrl);
    }
    setMediaPreviewUrl('');
    setRecordedAudioBlob(null);
    if (recordedAudioUrl && recordedAudioUrl.startsWith('blob:')) {
      URL.revokeObjectURL(recordedAudioUrl);
    }
    setRecordedAudioUrl('');
    setIsRecording(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  // Audio Recording Handlers with 64kbps Opus WebM requirement
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      let options: MediaRecorderOptions = { audioBitsPerSecond: 64000 };
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        options.mimeType = 'audio/webm;codecs=opus';
      }

      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudioBlob(audioBlob);
        setRecordedAudioUrl(audioUrl);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to access microphone:', err);
      alert('Could not access microphone for voice recording. Please check permissions.');
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  const toggleAudioPlayback = () => {
    if (!audioPlayerRef.current) return;
    if (isPlayingAudio) {
      audioPlayerRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setMediaPreviewUrl(objectUrl);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const fileToDataUrl = (fileOrBlob: File | Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(fileOrBlob);
    });
  };

  // Upload file with compression pipeline for photos
  const uploadMediaToStorage = async (): Promise<string | undefined> => {
    let payloadToUpload: File | Blob | null = selectedFile;

    if (mediaType === 'image' && selectedFile) {
      try {
        payloadToUpload = await compressImage(selectedFile);
      } catch (err) {
        console.warn('Image compression fallback:', err);
      }
    } else if (mediaType === 'audio' && recordedAudioBlob) {
      payloadToUpload = recordedAudioBlob;
    }

    if (!payloadToUpload) return undefined;

    const fileExt = mediaType === 'image' ? 'webp' : payloadToUpload instanceof File ? payloadToUpload.name.split('.').pop() : 'webm';
    const fileName = `${currentUser.id}_${Date.now()}.${fileExt}`;
    const filePath = `beacons/${fileName}`;

    try {
      const { data, error } = await supabase.storage
        .from('beacons-media')
        .upload(filePath, payloadToUpload, { upsert: true });

      if (error) {
        console.warn('Storage upload note (using Data URL fallback):', error.message);
        return await fileToDataUrl(payloadToUpload);
      }

      const { data: publicData } = supabase.storage
        .from('beacons-media')
        .getPublicUrl(data.path);

      return publicData.publicUrl;
    } catch (err) {
      console.warn('Storage upload exception (using Data URL fallback):', err);
      return await fileToDataUrl(payloadToUpload);
    }
  };

  const calculateExpiresAt = (): { expiresAt: string; hoursCount: number } => {
    const now = new Date();
    let hoursCount = 24;

    if (ttlSetting === 'custom') {
      hoursCount = Math.max(1, Number(customHours) || 1);
      now.setHours(now.getHours() + hoursCount);
    } else {
      switch (ttlSetting) {
        case '1h':
          hoursCount = 1;
          now.setHours(now.getHours() + 1);
          break;
        case '6h':
          hoursCount = 6;
          now.setHours(now.getHours() + 6);
          break;
        case '12h':
          hoursCount = 12;
          now.setHours(now.getHours() + 12);
          break;
        case '24h':
          hoursCount = 24;
          now.setHours(now.getHours() + 24);
          break;
        case '48h':
          hoursCount = 48;
          now.setHours(now.getHours() + 48);
          break;
        case '7d':
          hoursCount = 168;
          now.setDate(now.getDate() + 7);
          break;
        case '1-time':
          hoursCount = 24;
          now.setHours(now.getHours() + 24);
          break;
        default:
          hoursCount = 24;
          now.setHours(now.getHours() + 24);
      }
    }
    return { expiresAt: now.toISOString(), hoursCount };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    let finalMediaUrl: string | undefined = undefined;

    if (mediaType !== 'text') {
      finalMediaUrl = await uploadMediaToStorage();
    }

    const { expiresAt } = calculateExpiresAt();
    const isOneTime = ttlSetting === '1-time';
    const sharedWithUserId = audience === 'This Chat Only' ? chatPartner?.id : undefined;

    const newBeacon: Beacon = {
      id: `beacon_${Date.now()}`,
      user_id: currentUser.id,
      author: {
        name: currentUser.full_name || currentUser.username,
        avatar: currentUser.avatar_url,
        username: currentUser.username,
      },
      media_type: mediaType,
      content_url: finalMediaUrl || mediaPreviewUrl || recordedAudioUrl || undefined,
      text_content: textContent.trim() || (mediaType === 'text' ? '✨ Cast a new Beacon into the harbor!' : ''),
      bg_gradient: useCustomHex ? undefined : selectedGradient,
      custom_hex: useCustomHex ? customHex : undefined,
      font_family: mainFontFamily,
      caption_font_family: captionFontFamily,
      audio_visualizer: mediaType === 'audio' ? audioVisualizer : undefined,
      is_one_time: isOneTime,
      created_at: new Date().toISOString(),
      expires_at: expiresAt,
      ttl_setting: ttlSetting,
      allow_public_comments: allowPublicComments,
      viewed_by: [currentUser.id],
      comments: [],
      audience,
      shared_with_user_id: sharedWithUserId,
    };

    try {
      const { data, error } = await supabase
        .from('beacons')
        .insert({
          user_id: currentUser.id,
          media_type: mediaType,
          content_url: finalMediaUrl || mediaPreviewUrl || recordedAudioUrl || null,
          text_content: newBeacon.text_content,
          bg_gradient: useCustomHex ? null : selectedGradient,
          custom_hex: useCustomHex ? customHex : null,
          font_family: mainFontFamily,
          caption_font_family: captionFontFamily,
          audio_visualizer: mediaType === 'audio' ? audioVisualizer : null,
          expires_at: expiresAt,
          ttl_setting: ttlSetting,
          allow_public_comments: allowPublicComments,
          is_one_time: isOneTime,
          audience,
          shared_with_user_id: sharedWithUserId || null,
        })
        .select()
        .single();

      if (error) {
        console.warn('[Supabase Beacon Insert Note]:', error.message);
      } else if (data?.id) {
        // Use the real DB-generated id (not the client placeholder) so
        // downstream features that reference this beacon by id — anchoring
        // it to a chat, deleting it, commenting — all resolve correctly.
        newBeacon.id = data.id;
      }
    } catch (err) {
      console.warn('[Supabase Beacon Insert Exception]:', err);
    }

    onCreateBeacon(newBeacon);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl overflow-hidden my-6 text-slate-100 transition-all duration-500 ease-in-out"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/20">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-white">Cast a Beacon</h2>
              <p className="text-xs text-slate-400">Share ephemeral media & audio updates with harbor network</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4 relative z-10">
          {/* 1. Format Selection */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">
              1. Choose Beacon Format
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'text', label: 'Text/Code', icon: <Code className="w-4 h-4" /> },
                { id: 'image', label: 'Photo', icon: <ImageIcon className="w-4 h-4" /> },
                { id: 'video', label: 'Video', icon: <Video className="w-4 h-4" /> },
                { id: 'audio', label: 'Voice/Audio', icon: <Mic className="w-4 h-4" /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleFormatChange(tab.id as any)}
                  className={`py-2 px-2.5 rounded-2xl text-xs font-semibold flex flex-col items-center gap-1 transition-all border cursor-pointer ${
                    mediaType === tab.id
                      ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300 shadow-md shadow-cyan-500/10'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. INNER CONTENT BOX AURA CONTAINER */}
          <div
            className={`p-6 rounded-2xl shadow-inner border border-white/10 transition-all duration-500 relative overflow-hidden ${
              !useCustomHex ? `bg-gradient-to-br ${selectedGradient}` : ''
            }`}
            style={useCustomHex ? { background: customHex } : undefined}
          >
            <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] pointer-events-none" />

            <div className="relative z-10 space-y-4">
              {/* Text / Code Mode */}
              {mediaType === 'text' && (
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-200 block">
                    Text Message & Typography
                  </label>
                  <textarea
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder="Type your beacon update..."
                    rows={4}
                    style={{ fontFamily: mainFontFamily }}
                    className="w-full p-4 rounded-xl bg-slate-950/80 border border-white/10 text-white text-base focus:outline-none focus:border-cyan-400 transition-all placeholder:text-slate-400 resize-none shadow-lg"
                  />

                  {/* Dual Font Pickers for Text/Code Mode */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1 mb-1">
                        <Type className="w-3.5 h-3.5 text-cyan-400" />
                        Main Content Font
                      </label>
                      <select
                        value={mainFontFamily}
                        onChange={(e) => setMainFontFamily(e.target.value)}
                        className="w-full p-2 rounded-xl bg-slate-950/90 border border-slate-700 text-xs text-cyan-300 font-bold focus:outline-none focus:border-cyan-400 cursor-pointer max-h-48 overflow-y-auto"
                      >
                        {GOOGLE_FONTS_200.map((font) => (
                          <option key={font} value={font} style={{ fontFamily: font }}>
                            {font}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1 mb-1">
                        <Type className="w-3.5 h-3.5 text-indigo-400" />
                        Caption / Note Font
                      </label>
                      <select
                        value={captionFontFamily}
                        onChange={(e) => setCaptionFontFamily(e.target.value)}
                        className="w-full p-2 rounded-xl bg-slate-950/90 border border-slate-700 text-xs text-indigo-300 font-bold focus:outline-none focus:border-indigo-400 cursor-pointer max-h-48 overflow-y-auto"
                      >
                        {GOOGLE_FONTS_200.map((font) => (
                          <option key={font} value={font} style={{ fontFamily: font }}>
                            {font}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Photo Mode */}
              {mediaType === 'image' && (
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-200 block">
                    Upload Photo (WebP Compressed)
                  </label>
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-4 text-center transition-all backdrop-blur-md ${
                      isDragging ? 'border-cyan-400 bg-cyan-500/20' : 'border-white/20 bg-slate-950/60'
                    }`}
                  >
                    {mediaPreviewUrl ? (
                      <div className="relative group max-h-48 overflow-hidden rounded-xl mx-auto">
                        <img src={mediaPreviewUrl} alt="Preview" className="w-full h-44 object-cover rounded-xl" />
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFile(null);
                            setMediaPreviewUrl('');
                          }}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-950/80 text-white hover:bg-slate-900 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center gap-2 cursor-pointer py-4">
                        <Upload className="w-8 h-8 text-cyan-300" />
                        <span className="text-xs text-slate-200 font-medium">
                          Click to select photo or drag file
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => e.target.files && e.target.files[0] && handleFileSelect(e.target.files[0])}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  <input
                    type="text"
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder="Add optional image caption..."
                    style={{ fontFamily: captionFontFamily }}
                    className="w-full p-2.5 rounded-xl bg-slate-950/80 border border-white/10 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-400"
                  />

                  {/* Caption Font Picker */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1 mb-1">
                      <Type className="w-3.5 h-3.5 text-cyan-400" />
                      Caption Font Family
                    </label>
                    <select
                      value={captionFontFamily}
                      onChange={(e) => setCaptionFontFamily(e.target.value)}
                      className="w-full p-2 rounded-xl bg-slate-950/90 border border-slate-700 text-xs text-cyan-300 font-bold focus:outline-none focus:border-cyan-400 cursor-pointer"
                    >
                      {GOOGLE_FONTS_200.map((font) => (
                        <option key={font} value={font} style={{ fontFamily: font }}>
                          {font}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Video Mode */}
              {mediaType === 'video' && (
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-200 block">
                    Upload Video or Drag File
                  </label>
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-4 text-center transition-all backdrop-blur-md ${
                      isDragging ? 'border-cyan-400 bg-cyan-500/20' : 'border-white/20 bg-slate-950/60'
                    }`}
                  >
                    {mediaPreviewUrl ? (
                      <div className="relative group max-h-48 overflow-hidden rounded-xl mx-auto">
                        <video src={mediaPreviewUrl} controls className="w-full h-44 object-cover rounded-xl" />
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFile(null);
                            setMediaPreviewUrl('');
                          }}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-950/80 text-white hover:bg-slate-900 z-20 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center gap-2 cursor-pointer py-4">
                        <Video className="w-8 h-8 text-cyan-300" />
                        <span className="text-xs text-slate-200 font-medium">
                          Click to choose video file or drag & drop
                        </span>
                        <input
                          type="file"
                          accept="video/*"
                          onChange={(e) => e.target.files && e.target.files[0] && handleFileSelect(e.target.files[0])}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  <input
                    type="text"
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder="Add optional video caption..."
                    style={{ fontFamily: captionFontFamily }}
                    className="w-full p-2.5 rounded-xl bg-slate-950/80 border border-white/10 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-400"
                  />

                  {/* Caption Font Picker */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1 mb-1">
                      <Type className="w-3.5 h-3.5 text-cyan-400" />
                      Caption Font Family
                    </label>
                    <select
                      value={captionFontFamily}
                      onChange={(e) => setCaptionFontFamily(e.target.value)}
                      className="w-full p-2 rounded-xl bg-slate-950/90 border border-slate-700 text-xs text-cyan-300 font-bold focus:outline-none focus:border-cyan-400 cursor-pointer"
                    >
                      {GOOGLE_FONTS_200.map((font) => (
                        <option key={font} value={font} style={{ fontFamily: font }}>
                          {font}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Audio / Voice Mode */}
              {mediaType === 'audio' && (
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-200 block">
                    Voice Note Recorder (64kbps Opus) & Audio Options
                  </label>

                  {/* Recorder Controls */}
                  <div className="flex flex-wrap items-center justify-around gap-2 p-3.5 rounded-xl bg-slate-950/80 border border-white/10">
                    {!isRecording ? (
                      <button
                        type="button"
                        onClick={startVoiceRecording}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-500/20 transition-all cursor-pointer"
                      >
                        <Mic className="w-4 h-4 animate-bounce" />
                        <span>Record Voice Note</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={stopVoiceRecording}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                      >
                        <Square className="w-4 h-4 fill-current" />
                        <span>Stop ({recordingSeconds}s)</span>
                      </button>
                    )}

                    <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer border border-slate-700">
                      <FileAudio className="w-4 h-4 text-cyan-400" />
                      <span>Upload File</span>
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={(e) => e.target.files && e.target.files[0] && handleFileSelect(e.target.files[0])}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Audio Playback Preview */}
                  {(recordedAudioUrl || mediaPreviewUrl) && (
                    <div className="p-3 rounded-xl bg-slate-950/90 border border-cyan-400/40 flex items-center justify-between shadow-md">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={toggleAudioPlayback}
                          className="p-2.5 rounded-full bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-all cursor-pointer"
                        >
                          {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                        </button>
                        <div>
                          <span className="text-xs font-bold text-cyan-300 block">
                            {recordedAudioBlob ? 'Recorded Voice Note' : selectedFile?.name || 'Audio File'}
                          </span>
                          <span className="text-[10px] text-slate-400">Ready for harbor broadcast</span>
                        </div>
                      </div>
                      <audio
                        ref={audioPlayerRef}
                        src={recordedAudioUrl || mediaPreviewUrl}
                        onEnded={() => setIsPlayingAudio(false)}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setRecordedAudioBlob(null);
                          setRecordedAudioUrl('');
                          setSelectedFile(null);
                          setMediaPreviewUrl('');
                        }}
                        className="p-1 rounded-full text-slate-400 hover:text-white cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* 10 Audio Playback Visualizer Selector */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1 mb-1">
                      <Activity className="w-3.5 h-3.5 text-cyan-400" />
                      Choose Audio Visualizer (1 of 10)
                    </label>
                    <select
                      value={audioVisualizer}
                      onChange={(e) => setAudioVisualizer(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl bg-slate-950/90 border border-slate-700 text-xs text-cyan-300 font-bold capitalize focus:outline-none focus:border-cyan-400 cursor-pointer"
                    >
                      {AUDIO_VISUALIZERS.map((viz) => (
                        <option key={viz} value={viz}>
                          {viz.toUpperCase()} Visualizer
                        </option>
                      ))}
                    </select>
                  </div>

                  <input
                    type="text"
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder="Add optional audio caption..."
                    style={{ fontFamily: captionFontFamily }}
                    className="w-full p-2.5 rounded-xl bg-slate-950/80 border border-white/10 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              )}
            </div>
          </div>

          {/* 3. Aura Color & Gradient Selector */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                <Palette className="w-3.5 h-3.5 text-cyan-400" />
                Inner Box Aura Background Color
              </span>
              <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useCustomHex}
                  onChange={(e) => setUseCustomHex(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span>Custom Hex</span>
              </label>
            </div>

            {useCustomHex ? (
              <div className="flex items-center gap-3 pt-1">
                <input
                  type="color"
                  value={customHex}
                  onChange={(e) => setCustomHex(e.target.value)}
                  className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 cursor-pointer p-1"
                />
                <input
                  type="text"
                  value={customHex}
                  onChange={(e) => setCustomHex(e.target.value)}
                  placeholder="#06b6d4"
                  className="w-28 p-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono focus:outline-none"
                />
                <span className="text-[11px] text-slate-400">Custom hex aura backdrop</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 pt-1">
                {PRESET_GRADIENTS.map((grad, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setUseCustomHex(false);
                      setSelectedGradient(grad);
                    }}
                    className={`w-8 h-8 rounded-full bg-gradient-to-r ${grad} border-2 transition-all cursor-pointer ${
                      selectedGradient === grad && !useCustomHex
                        ? 'border-white scale-110 shadow-lg shadow-cyan-500/20'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 4. TTL Vanish Timer Engine */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                Beacon Lifespan (TTL Expiry)
              </label>
              {ttlSetting === '1-time' && (
                <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                  <Flame className="w-3 h-3" /> Submerge on 1 View
                </span>
              )}
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
              {[
                { id: '1h', label: '1 Hour' },
                { id: '6h', label: '6 Hours' },
                { id: '12h', label: '12 Hours' },
                { id: '24h', label: '24 Hours' },
                { id: '48h', label: '48 Hours' },
                { id: '7d', label: '7 Days' },
                { id: '1-time', label: '1-Time' },
                { id: 'custom', label: 'Custom' },
              ].map((ttl) => (
                <button
                  key={ttl.id}
                  type="button"
                  onClick={() => setTtlSetting(ttl.id as any)}
                  className={`py-2 px-1 rounded-xl text-[10px] sm:text-[11px] font-bold text-center transition-all border cursor-pointer ${
                    ttlSetting === ttl.id
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {ttl.label}
                </button>
              ))}
            </div>

            {ttlSetting === 'custom' && (
              <div className="mt-2.5 p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-3">
                <span className="text-xs text-slate-300 font-semibold shrink-0">Custom Lifespan Hours:</span>
                <input
                  type="number"
                  min="1"
                  value={customHours}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setCustomHours(val < 1 ? 1 : val);
                  }}
                  className="w-20 p-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-bold focus:outline-none focus:border-cyan-500"
                />
                <span className="text-[11px] text-slate-400">(Minimum 1 Hour limit)</span>
              </div>
            )}
          </div>

          {/* 5. Interaction Settings */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {allowPublicComments ? (
                <MessageSquare className="w-4 h-4 text-cyan-400" />
              ) : (
                <Lock className="w-4 h-4 text-amber-400" />
              )}
              <div>
                <span className="text-xs font-bold text-white block">
                  {allowPublicComments ? 'Allow Public Thread Comments' : 'Private DM Replies Only'}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  {allowPublicComments ? 'Harbor members can post public comments' : 'Replies sent as private DMs'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setAllowPublicComments(!allowPublicComments)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                allowPublicComments ? 'bg-cyan-500' : 'bg-slate-800'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  allowPublicComments ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 6. Audience */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" /> Who can see this Beacon?
            </span>
            <div className="space-y-1.5">
              {(
                [
                  { k: 'Everyone' as const, label: 'Everyone', desc: 'Visible to anyone on HeyLook' },
                  { k: 'Contacts Only' as const, label: 'Contacts Only', desc: 'Only accepted fleet members' },
                  ...(chatPartner
                    ? [{ k: 'This Chat Only' as const, label: `Just ${chatPartner.name} (This Chat)`, desc: 'Anchored to this conversation only' }]
                    : []),
                ]
              ).map((opt) => (
                <button
                  key={opt.k}
                  type="button"
                  onClick={() => setAudience(opt.k)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer text-left ${
                    audience === opt.k ? 'border-cyan-500/60 bg-cyan-500/10' : 'border-slate-700 bg-slate-900/50'
                  }`}
                >
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-slate-200">{opt.label}</p>
                    <p className="text-[10px] text-slate-500">{opt.desc}</p>
                  </div>
                  {audience === opt.k && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-2xl font-bold text-sm bg-gradient-to-r from-cyan-500 via-indigo-600 to-pink-500 text-white shadow-lg shadow-cyan-500/20 hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? 'Casting Beacon...' : 'Cast Beacon into Harbor'}</span>
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
