import React, { useEffect, useRef, useState } from 'react';
import { Download, Film, Pause, Play, RotateCcw, Sparkles } from 'lucide-react';
import { SavedStudioItem } from '../../utils/authSubscription';
import {
  AspectRatio,
  computeAspectDimensions,
  formatTimecode,
  splitScenesFromPrompt,
  wrapTextLines,
} from '../../utils/mediaMath';
import {
  createLocalAmbientSynthStream,
  pickSupportedVideoMimeType,
  triggerFileDownload,
} from '../../utils/videoExport';

type ThemeId = 'obsidian-indigo' | 'cinema-amber' | 'emerald-noir' | 'clean-slate';
type MotionStyle = 'kinetic' | 'particles' | 'spotlight' | 'grid';

interface TextToVideoToolProps {
  onSaveProject: (item: SavedStudioItem) => void;
}

const THEMES: Record<
  ThemeId,
  { label: string; bgA: string; bgB: string; accent: string; text: string }
> = {
  'obsidian-indigo': {
    label: 'Obsidian Indigo',
    bgA: '#0b0b16',
    bgB: '#1e1b4b',
    accent: '#6366f1',
    text: '#f8fafc',
  },
  'cinema-amber': {
    label: 'Cinema Gold',
    bgA: '#130d09',
    bgB: '#3b2312',
    accent: '#f59e0b',
    text: '#fef3c7',
  },
  'emerald-noir': {
    label: 'Emerald Noir',
    bgA: '#07110e',
    bgB: '#064e3b',
    accent: '#10b981',
    text: '#ecfdf5',
  },
  'clean-slate': {
    label: 'Editorial Slate',
    bgA: '#0f172a',
    bgB: '#334155',
    accent: '#38bdf8',
    text: '#f8fafc',
  },
};

export const TextToVideoTool: React.FC<TextToVideoToolProps> = ({ onSaveProject }) => {
  const [prompt, setPrompt] = useState(
    'Golden light across the studio. Kinetic motion typography in real time. Exported locally with zero external APIs.'
  );
  const [aspect, setAspect] = useState<AspectRatio>('16:9');
  const [theme, setTheme] = useState<ThemeId>('obsidian-indigo');
  const [motionStyle, setMotionStyle] = useState<MotionStyle>('kinetic');
  const [durationSec, setDurationSec] = useState<number>(6);
  const [includeAudio, setIncludeAudio] = useState<boolean>(true);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [exportedUrl, setExportedUrl] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timeRef = useRef<number>(0);
  const playingRef = useRef<boolean>(true);

  useEffect(() => {
    playingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      if (exportedUrl) URL.revokeObjectURL(exportedUrl);
    };
  }, [exportedUrl]);

  const dims = computeAspectDimensions(aspect, 960);
  const scenes = splitScenesFromPrompt(prompt);

  const drawSceneFrame = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    tSec: number
  ) => {
    const cfg = THEMES[theme];
    const total = Math.max(2, durationSec);
    const norm = (tSec % total) / total;
    const sceneIdx = Math.min(scenes.length - 1, Math.floor(norm * scenes.length));
    const sceneLocalP = (norm * scenes.length) % 1;

    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, cfg.bgA);
    bg.addColorStop(1, cfg.bgB);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Motion layer
    if (motionStyle === 'spotlight' || motionStyle === 'kinetic') {
      const lx = w * (0.5 + Math.sin(tSec * 0.9) * 0.25);
      const ly = h * (0.45 + Math.cos(tSec * 0.7) * 0.15);
      const glow = ctx.createRadialGradient(lx, ly, 10, lx, ly, w * 0.55);
      glow.addColorStop(0, `${cfg.accent}88`);
      glow.addColorStop(0.5, `${cfg.accent}22`);
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);
    }

    if (motionStyle === 'particles' || motionStyle === 'kinetic') {
      ctx.fillStyle = `${cfg.accent}99`;
      for (let i = 0; i < 28; i++) {
        const px = ((i * 149 + tSec * (28 + (i % 5) * 8)) % (w + 40)) - 20;
        const py = (i * 83 + Math.sin(tSec * 1.3 + i) * 32) % h;
        const r = 1.5 + (i % 3) * 1.2;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (motionStyle === 'grid') {
      ctx.strokeStyle = `${cfg.accent}33`;
      ctx.lineWidth = 1.5;
      const offset = (tSec * 40) % 48;
      for (let x = -48 + offset; x < w; x += 48) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = -48 + offset; y < h; y += 48) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    }

    // Subtle film framing border
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 2;
    ctx.strokeRect(24, 24, w - 48, h - 48);

    // Scene badge & typography
    const sceneText = scenes[sceneIdx] ?? prompt;
    const lines = wrapTextLines(sceneText, aspect === '9:16' ? 18 : 28);
    const fadeIn = Math.min(1, sceneLocalP * 4);
    const slideY = (1 - fadeIn) * 18;

    ctx.save();
    ctx.globalAlpha = fadeIn;
    ctx.fillStyle = cfg.text;
    const fontSize = aspect === '9:16' ? 38 : 44;
    ctx.font = `700 ${fontSize}px "Plus Jakarta Sans", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const lineHeight = fontSize * 1.25;
    const startY = h / 2 - ((lines.length - 1) * lineHeight) / 2 + slideY;
    lines.forEach((line, idx) => {
      ctx.fillText(line, w / 2, startY + idx * lineHeight);
    });

    // Scene counter caption
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.font = '500 15px "JetBrains Mono", monospace';
    ctx.fillText(
      `SCENE ${sceneIdx + 1} / ${scenes.length} · ${formatTimecode(tSec % total)}`,
      w / 2,
      h - 52
    );
    ctx.restore();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let lastTs = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - lastTs) / 1000);
      lastTs = now;
      if (playingRef.current && !isExporting) {
        timeRef.current = (timeRef.current + dt) % durationSec;
        setCurrentTime(timeRef.current);
      }
      drawSceneFrame(ctx, canvas.width, canvas.height, timeRef.current);
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  });

  const handleExportVideo = async () => {
    const canvas = canvasRef.current;
    if (!canvas || isExporting) return;

    if (typeof MediaRecorder === 'undefined') {
      setStatusMessage('MediaRecorder is unavailable in this browser.');
      return;
    }

    setIsExporting(true);
    setExportProgress(0);
    setStatusMessage('Rendering video frames locally...');

    if (exportedUrl) {
      URL.revokeObjectURL(exportedUrl);
      setExportedUrl(null);
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsExporting(false);
      return;
    }

    const canvasStream = canvas.captureStream(30);
    const audioHandle = includeAudio ? createLocalAmbientSynthStream() : null;
    const tracks = [...canvasStream.getVideoTracks()];
    if (audioHandle) {
      tracks.push(...audioHandle.stream.getAudioTracks());
    }
    const combined = new MediaStream(tracks);
    const mimeType = pickSupportedVideoMimeType();

    const chunks: Blob[] = [];
    const recorder = new MediaRecorder(combined, { mimeType, videoBitsPerSecond: 3_000_000 });
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    const finished = new Promise<Blob>((resolve) => {
      recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
    });

    recorder.start(100);
    const fps = 30;
    const totalFrames = Math.round(durationSec * fps);

    for (let f = 0; f <= totalFrames; f++) {
      const t = (f / totalFrames) * durationSec;
      timeRef.current = t;
      setCurrentTime(t);
      drawSceneFrame(ctx, canvas.width, canvas.height, t);
      setExportProgress(Math.round((f / totalFrames) * 100));
      await new Promise((r) => setTimeout(r, 1000 / fps));
    }

    recorder.stop();
    const blob = await finished;
    audioHandle?.stop();

    const url = URL.createObjectURL(blob);
    setExportedUrl(url);
    setIsExporting(false);
    setStatusMessage('Video ready for preview and download.');

    const thumbUrl = canvas.toDataURL('image/png');
    onSaveProject({
      id: `proj_${Date.now().toString(36)}`,
      tool: 'text-to-video',
      title: scenes[0]?.slice(0, 36) || 'Text to Video Clip',
      format: 'webm',
      createdAt: Date.now(),
      durationSec,
      previewDataUrl: thumbUrl,
    });
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Left Control Panel */}
      <div className="space-y-5 rounded-2xl border border-white/10 bg-[#13131C] p-5 lg:col-span-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film className="h-4 w-4 text-[#818CF8]" aria-hidden="true" />
            <h3 className="font-display text-base font-bold text-white">
              Text to Video Generator
            </h3>
          </div>
          <span className="text-xs font-medium text-slate-400">Local Engine</span>
        </div>

        <div>
          <label htmlFor="t2v-prompt" className="block text-xs font-medium text-slate-300">
            Script / Scene Prompts (separate scenes with periods or new lines)
          </label>
          <textarea
            id="t2v-prompt"
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe each scene..."
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0B0B10] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#5D4DF4] focus:outline-none"
          />
          <p className="mt-1 text-[11px] text-slate-500">
            Detected {scenes.length} animated {scenes.length === 1 ? 'scene' : 'scenes'}
          </p>
        </div>

        {/* Aspect Ratio & Duration */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="block text-xs font-medium text-slate-300">Aspect Ratio</span>
            <div className="mt-1.5 grid grid-cols-3 gap-1 rounded-xl bg-[#0B0B10] p-1">
              {(['16:9', '9:16', '1:1'] as AspectRatio[]).map((ratio) => (
                <button
                  key={ratio}
                  type="button"
                  onClick={() => setAspect(ratio)}
                  className={`cursor-pointer rounded-lg py-1.5 text-xs font-semibold transition-colors ${
                    aspect === ratio ? 'bg-[#5D4DF4] text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="t2v-duration" className="block text-xs font-medium text-slate-300">
              Duration
            </label>
            <select
              id="t2v-duration"
              value={durationSec}
              onChange={(e) => setDurationSec(Number(e.target.value))}
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0B0B10] px-3 py-2 text-xs font-semibold text-white focus:border-[#5D4DF4] focus:outline-none"
            >
              <option value={4}>4 seconds</option>
              <option value={6}>6 seconds</option>
              <option value={9}>9 seconds</option>
            </select>
          </div>
        </div>

        {/* Visual Theme & Motion */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="t2v-theme" className="block text-xs font-medium text-slate-300">
              Visual Theme
            </label>
            <select
              id="t2v-theme"
              value={theme}
              onChange={(e) => setTheme(e.target.value as ThemeId)}
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0B0B10] px-3 py-2 text-xs font-semibold text-white focus:border-[#5D4DF4] focus:outline-none"
            >
              {Object.entries(THEMES).map(([id, cfg]) => (
                <option key={id} value={id}>
                  {cfg.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="t2v-motion" className="block text-xs font-medium text-slate-300">
              Motion Style
            </label>
            <select
              id="t2v-motion"
              value={motionStyle}
              onChange={(e) => setMotionStyle(e.target.value as MotionStyle)}
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0B0B10] px-3 py-2 text-xs font-semibold text-white focus:border-[#5D4DF4] focus:outline-none"
            >
              <option value="kinetic">Kinetic Typography</option>
              <option value="particles">Particle Drift</option>
              <option value="spotlight">Spotlight Sweep</option>
              <option value="grid">Perspective Grid</option>
            </select>
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-2.5 text-xs text-slate-300">
          <input
            type="checkbox"
            checked={includeAudio}
            onChange={(e) => setIncludeAudio(e.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-[#0B0B10] text-[#5D4DF4]"
          />
          <span>Synthesize ambient Web Audio pad during export</span>
        </label>

        <div className="flex flex-wrap gap-3 pt-1">
          <button
            type="button"
            onClick={handleExportVideo}
            disabled={isExporting}
            className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#5D4DF4] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#4F3FE6] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            <span>{isExporting ? `Rendering ${exportProgress}%` : 'Generate Video'}</span>
          </button>
        </div>

        {statusMessage && (
          <p className="text-xs text-slate-300" role="status">
            {statusMessage}
          </p>
        )}
      </div>

      {/* Right Live Canvas & Export Preview */}
      <div className="space-y-4 rounded-2xl border border-white/10 bg-[#13131C] p-5 lg:col-span-7">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">
            Live Canvas Preview · {dims.width}×{dims.height}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPlaying((p) => !p)}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 bg-[#0B0B10] px-3 py-1.5 text-xs font-medium text-white hover:bg-white/5"
            >
              {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                timeRef.current = 0;
                setCurrentTime(0);
              }}
              aria-label="Restart preview"
              className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-white/10 bg-[#0B0B10] px-2.5 py-1.5 text-xs text-slate-300 hover:bg-white/5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[#0B0B10] p-2">
          <canvas
            ref={canvasRef}
            width={dims.width}
            height={dims.height}
            data-testid="text-to-video-canvas"
            data-rendering={isPlaying ? 'playing' : 'paused'}
            className="max-h-[360px] w-auto max-w-full rounded-lg"
          />
        </div>

        {/* Scrub bar */}
        <div className="flex items-center gap-3">
          <span className="font-mono-tabular text-xs text-slate-400">
            {formatTimecode(currentTime)}
          </span>
          <input
            type="range"
            aria-label="Preview timeline scrub"
            min={0}
            max={durationSec}
            step={0.1}
            value={currentTime}
            onChange={(e) => {
              const v = Number(e.target.value);
              timeRef.current = v;
              setCurrentTime(v);
            }}
            className="studio-range flex-1"
          />
          <span className="font-mono-tabular text-xs text-slate-400">
            {formatTimecode(durationSec)}
          </span>
        </div>

        {exportedUrl && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">Rendered WebM Video</p>
                <p className="text-xs text-emerald-300">Ready for offline playback or download</p>
              </div>
              <button
                type="button"
                onClick={() => triggerFileDownload(exportedUrl, 'akool-text-to-video.webm')}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Download .webm</span>
              </button>
            </div>
            <video
              src={exportedUrl}
              controls
              className="mt-3 max-h-48 w-full rounded-lg border border-white/10 bg-black"
            />
          </div>
        )}
      </div>
    </div>
  );
};
