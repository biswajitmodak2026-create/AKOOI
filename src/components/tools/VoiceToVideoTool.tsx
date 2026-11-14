import React, { useEffect, useRef, useState } from 'react';
import { Download, Mic, Pause, Play, Square, Upload, Volume2 } from 'lucide-react';
import { SavedStudioItem } from '../../utils/authSubscription';
import { formatTimecode, wrapTextLines } from '../../utils/mediaMath';
import { pickSupportedVideoMimeType, triggerFileDownload } from '../../utils/videoExport';

type VisualizerStyle = 'bars' | 'orb' | 'ribbon';

interface VoiceToVideoToolProps {
  onSaveProject: (item: SavedStudioItem) => void;
}

export const VoiceToVideoTool: React.FC<VoiceToVideoToolProps> = ({ onSaveProject }) => {
  const [captionText, setCaptionText] = useState(
    'Welcome to AKOOL Voice Studio. Speak or synthesize narration into an animated video locally.'
  );
  const [visualizerStyle, setVisualizerStyle] = useState<VisualizerStyle>('bars');
  const [accentColor, setAccentColor] = useState<string>('#6366f1');

  const [isRecordingMic, setIsRecordingMic] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioLabel, setAudioLabel] = useState<string>('No voice track loaded');
  const [audioDuration, setAudioDuration] = useState<number>(4);
  const [isPlaying, setIsPlaying] = useState(false);

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportedVideoUrl, setExportedVideoUrl] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const freqDataRef = useRef<Uint8Array<ArrayBuffer>>(new Uint8Array(64));

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (exportedVideoUrl) URL.revokeObjectURL(exportedVideoUrl);
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [audioUrl, exportedVideoUrl]);

  // Real-time canvas animation synced to frequency bins or rhythmic fallback
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    const start = performance.now();

    const draw = (now: number) => {
      const t = (now - start) / 1000;
      const w = canvas.width;
      const h = canvas.height;

      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, '#090910');
      bg.addColorStop(1, '#141427');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Update frequency bins
      const bins = freqDataRef.current;
      if (analyserRef.current && (isPlaying || isRecordingMic)) {
        analyserRef.current.getByteFrequencyData(bins);
      } else {
        for (let i = 0; i < bins.length; i++) {
          const wave = isPlaying || isRecordingMic
            ? Math.abs(Math.sin(t * 4.5 + i * 0.35)) * 180 + 40
            : Math.abs(Math.sin(t * 1.6 + i * 0.25)) * 45 + 18;
          bins[i] = wave;
        }
      }

      if (visualizerStyle === 'bars') {
        const barCount = 44;
        const barWidth = (w - 160) / barCount;
        for (let i = 0; i < barCount; i++) {
          const val = bins[i % bins.length] / 255;
          const barH = Math.max(8, val * (h * 0.42));
          const x = 80 + i * barWidth;
          const y = h * 0.52 - barH / 2;
          ctx.fillStyle = accentColor;
          ctx.fillRect(x, y, Math.max(4, barWidth - 5), barH);
        }
      } else if (visualizerStyle === 'orb') {
        const avg = bins.reduce((a, b) => a + b, 0) / bins.length / 255;
        const radius = 64 + avg * 75;
        const orb = ctx.createRadialGradient(w / 2, h * 0.45, 8, w / 2, h * 0.45, radius * 1.5);
        orb.addColorStop(0, '#ffffff');
        orb.addColorStop(0.3, accentColor);
        orb.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = orb;
        ctx.beginPath();
        ctx.arc(w / 2, h * 0.45, radius * 1.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 4;
        ctx.beginPath();
        for (let x = 60; x <= w - 60; x += 12) {
          const idx = Math.floor(((x - 60) / (w - 120)) * (bins.length - 1));
          const amp = (bins[idx] / 255) * 95;
          const y = h * 0.45 + Math.sin(t * 5 + x * 0.03) * amp;
          if (x === 60) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Captions at bottom
      const lines = wrapTextLines(captionText, 38).slice(0, 3);
      ctx.fillStyle = 'rgba(248, 250, 252, 0.94)';
      ctx.font = '600 26px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      lines.forEach((line, i) => {
        ctx.fillText(line, w / 2, h - 98 + i * 32);
      });

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [visualizerStyle, accentColor, captionText, isPlaying, isRecordingMic]);

  const attachAudioElementAnalyser = (el: HTMLAudioElement) => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume().catch(() => undefined);

      if (!analyserRef.current) {
        const src = ctx.createMediaElementSource(el);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 128;
        src.connect(analyser);
        analyser.connect(ctx.destination);
        analyserRef.current = analyser;
      }
    } catch {
      // fallback animation continues cleanly
    }
  };

  const handleStartMic = async () => {
    setMicError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setMicError('Microphone API is unavailable in this browser. Upload an audio file or synthesize narration below.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      src.connect(analyser);
      analyserRef.current = analyser;

      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setAudioLabel('Recorded Microphone Voice');
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecordingMic(true);
    } catch {
      setMicError('Microphone permission denied or no mic connected. Use "Synthesize Voice Track" or upload audio instead.');
    }
  };

  const handleStopMic = () => {
    mediaRecorderRef.current?.stop();
    setIsRecordingMic(false);
  };

  const handleUploadAudio = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMicError(null);
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    setAudioLabel(file.name);
  };

  /**
   * Generates a real local WAV audio track with rhythmic cadence (zero APIs)
   * and triggers optional Web Speech synthesis so Voice-to-Video always works cleanly.
   */
  const handleSynthesizeVoiceTrack = () => {
    setMicError(null);
    const duration = 4.5;
    const sampleRate = 22050;
    const numSamples = Math.floor(duration * sampleRate);
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);

    const writeStr = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    };
    writeStr(0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeStr(36, 'data');
    view.setUint32(40, numSamples * 2, true);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const syllableEnv = Math.max(0, Math.sin(t * 7.5));
      const freq = 140 + Math.sin(t * 2.2) * 35;
      const sample =
        (Math.sin(2 * Math.PI * freq * t) * 0.45 +
          Math.sin(2 * Math.PI * freq * 2 * t) * 0.25) *
        syllableEnv *
        0.5;
      view.setInt16(44 + i * 2, Math.max(-1, Math.min(1, sample)) * 32767, true);
    }

    const blob = new Blob([view], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    setAudioUrl(url);
    setAudioDuration(duration);
    setAudioLabel('Synthesized Local Voice Track (4.5s)');

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(captionText);
        utter.rate = 1.0;
        window.speechSynthesis.speak(utter);
      } catch {
        // ignore if blocked in headless environment
      }
    }
  };

  const handleTogglePlay = () => {
    const el = audioElRef.current;
    if (!el || !audioUrl) {
      setIsPlaying((p) => !p);
      return;
    }
    if (el.paused) {
      attachAudioElementAnalyser(el);
      el.play().catch(() => undefined);
      setIsPlaying(true);
    } else {
      el.pause();
      setIsPlaying(false);
    }
  };

  const handleExportVideo = async () => {
    const canvas = canvasRef.current;
    if (!canvas || isExporting || typeof MediaRecorder === 'undefined') return;

    setIsExporting(true);
    setExportProgress(0);
    if (exportedVideoUrl) {
      URL.revokeObjectURL(exportedVideoUrl);
      setExportedVideoUrl(null);
    }

    const stream = canvas.captureStream(30);
    const mimeType = pickSupportedVideoMimeType();
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 2_800_000 });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    const done = new Promise<Blob>((resolve) => {
      recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
    });

    recorder.start(100);
    const totalMs = Math.min(8000, Math.max(3000, Math.round(audioDuration * 1000)));
    const steps = 30;
    const stepMs = totalMs / steps;

    for (let s = 1; s <= steps; s++) {
      await new Promise((r) => setTimeout(r, stepMs));
      setExportProgress(Math.round((s / steps) * 100));
    }

    recorder.stop();
    const blob = await done;
    const url = URL.createObjectURL(blob);
    setExportedVideoUrl(url);
    setIsExporting(false);

    onSaveProject({
      id: `proj_${Date.now().toString(36)}`,
      tool: 'voice-to-video',
      title: captionText.slice(0, 36) || 'Voice to Video',
      format: 'webm',
      createdAt: Date.now(),
      durationSec: Math.round(totalMs / 1000),
      previewDataUrl: canvas.toDataURL('image/png'),
    });
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Left Controls */}
      <div className="space-y-5 rounded-2xl border border-white/10 bg-[#13131C] p-5 lg:col-span-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mic className="h-4 w-4 text-[#818CF8]" aria-hidden="true" />
            <h3 className="font-display text-base font-bold text-white">
              Voice to Video Studio
            </h3>
          </div>
          <span className="text-xs font-medium text-slate-400">Web Audio</span>
        </div>

        {/* Voice Sources */}
        <div className="space-y-2.5">
          <span className="block text-xs font-medium text-slate-300">1. Voice Input Source</span>
          <div className="grid grid-cols-2 gap-2.5">
            {isRecordingMic ? (
              <button
                type="button"
                onClick={handleStopMic}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-500 px-3 py-2.5 text-xs font-semibold text-white hover:bg-red-600"
              >
                <Square className="h-3.5 w-3.5" />
                <span>Stop Recording</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartMic}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/15 bg-[#0B0B10] px-3 py-2.5 text-xs font-semibold text-white hover:border-[#5D4DF4]"
              >
                <Mic className="h-3.5 w-3.5 text-[#818CF8]" />
                <span>Record Mic</span>
              </button>
            )}

            <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/15 bg-[#0B0B10] px-3 py-2.5 text-xs font-semibold text-white hover:border-[#5D4DF4]">
              <Upload className="h-3.5 w-3.5 text-[#818CF8]" />
              <span>Upload Audio</span>
              <input
                type="file"
                accept="audio/*"
                onChange={handleUploadAudio}
                className="sr-only"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={handleSynthesizeVoiceTrack}
            className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#5D4DF4]/50 bg-[#5D4DF4]/15 px-3 py-2.5 text-xs font-semibold text-[#C7D2FE] hover:bg-[#5D4DF4]/25"
          >
            <Volume2 className="h-3.5 w-3.5" />
            <span>Synthesize Local Voice Track (No Mic Needed)</span>
          </button>

          {micError && (
            <p role="alert" className="text-xs text-amber-300">
              {micError}
            </p>
          )}

          <p className="text-xs text-slate-400">
            Active Track: <span className="text-slate-200">{audioLabel}</span>
          </p>
        </div>

        {/* Captions */}
        <div>
          <label htmlFor="v2v-caption" className="block text-xs font-medium text-slate-300">
            2. Video Captions / Narration Text
          </label>
          <textarea
            id="v2v-caption"
            rows={3}
            value={captionText}
            onChange={(e) => setCaptionText(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0B0B10] px-3.5 py-2.5 text-sm text-white focus:border-[#5D4DF4] focus:outline-none"
          />
        </div>

        {/* Style & Color */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="v2v-style" className="block text-xs font-medium text-slate-300">
              Visualizer Style
            </label>
            <select
              id="v2v-style"
              value={visualizerStyle}
              onChange={(e) => setVisualizerStyle(e.target.value as VisualizerStyle)}
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0B0B10] px-3 py-2 text-xs font-semibold text-white focus:border-[#5D4DF4] focus:outline-none"
            >
              <option value="bars">Spectrum Bars</option>
              <option value="orb">Radial Pulse Orb</option>
              <option value="ribbon">Waveform Ribbon</option>
            </select>
          </div>

          <div>
            <label htmlFor="v2v-color" className="block text-xs font-medium text-slate-300">
              Wave Accent Color
            </label>
            <select
              id="v2v-color"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0B0B10] px-3 py-2 text-xs font-semibold text-white focus:border-[#5D4DF4] focus:outline-none"
            >
              <option value="#6366f1">Indigo Glow</option>
              <option value="#f59e0b">Cinema Gold</option>
              <option value="#10b981">Emerald Pulse</option>
              <option value="#38bdf8">Sky Cyan</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={handleExportVideo}
          disabled={isExporting}
          className="w-full cursor-pointer rounded-xl bg-[#5D4DF4] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#4F3FE6] disabled:opacity-60"
        >
          {isExporting ? `Rendering Voice Video ${exportProgress}%` : 'Generate Voice Video (.webm)'}
        </button>
      </div>

      {/* Right Canvas & Audio Preview */}
      <div className="space-y-4 rounded-2xl border border-white/10 bg-[#13131C] p-5 lg:col-span-7">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">
            Audio-Reactive Canvas · 960×540
          </span>
          <button
            type="button"
            onClick={handleTogglePlay}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 bg-[#0B0B10] px-3 py-1.5 text-xs font-medium text-white hover:bg-white/5"
          >
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            <span>{isPlaying ? 'Pause' : 'Animate & Play'}</span>
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0B0B10] p-2">
          <canvas
            ref={canvasRef}
            width={960}
            height={540}
            data-testid="voice-to-video-canvas"
            className="w-full rounded-lg"
          />
        </div>

        {audioUrl && (
          <div className="rounded-xl border border-white/10 bg-[#0B0B10] p-3">
            <audio
              ref={audioElRef}
              src={audioUrl}
              preload="auto"
              controls
              onLoadedMetadata={(e) => {
                const dur = e.currentTarget.duration;
                if (Number.isFinite(dur) && dur > 0) setAudioDuration(dur);
              }}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              className="w-full"
            />
            <p className="mt-1 font-mono-tabular text-[11px] text-slate-400">
              Track length: {formatTimecode(audioDuration)}
            </p>
          </div>
        )}

        {exportedVideoUrl && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-white">Voice Video Exported</p>
              <button
                type="button"
                onClick={() => triggerFileDownload(exportedVideoUrl, 'akool-voice-to-video.webm')}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download .webm</span>
              </button>
            </div>
            <video
              src={exportedVideoUrl}
              controls
              className="mt-3 max-h-48 w-full rounded-lg border border-white/10 bg-black"
            />
          </div>
        )}
      </div>
    </div>
  );
};
