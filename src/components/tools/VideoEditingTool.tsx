import React, { useEffect, useRef, useState } from 'react';
import {
  Download,
  Film,
  Pause,
  Play,
  Scissors,
  Upload,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { SavedStudioItem } from '../../utils/authSubscription';
import { generateSampleVideoClipUrl } from '../../utils/localMediaSamples';
import {
  DEFAULT_PHOTO_ADJUSTMENTS,
  buildCssFilterString,
  clampTrimRange,
  formatTimecode,
} from '../../utils/mediaMath';
import { pickSupportedVideoMimeType, triggerFileDownload } from '../../utils/videoExport';

interface VideoEditingToolProps {
  onSaveProject: (item: SavedStudioItem) => void;
}

export const VideoEditingTool: React.FC<VideoEditingToolProps> = ({ onSaveProject }) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [clipName, setClipName] = useState<string>('No video loaded');
  const [isGeneratingSample, setIsGeneratingSample] = useState(false);

  const [duration, setDuration] = useState<number>(4);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number>(4);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [saturate, setSaturate] = useState<number>(100);
  const [grayscale, setGrayscale] = useState<number>(0);
  const [overlayTitle, setOverlayTitle] = useState<string>('');
  const [overlayPos, setOverlayPos] = useState<'bottom' | 'center' | 'top'>('bottom');

  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [exportedUrl, setExportedUrl] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      if (exportedUrl) URL.revokeObjectURL(exportedUrl);
    };
  }, [videoUrl, exportedUrl]);

  const handleLoadSampleClip = async () => {
    if (isGeneratingSample) return;
    setIsGeneratingSample(true);
    try {
      const url = await generateSampleVideoClipUrl(4);
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      setVideoUrl(url);
      setClipName('AKOOL Studio Sample Clip (4s)');
      setTrimStart(0);
      setTrimEnd(4);
      setDuration(4);
    } finally {
      setIsGeneratingSample(false);
    }
  };

  const handleUploadVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setClipName(file.name);
  };

  // Draw live video frame + grading + title onto preview canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;

    const render = () => {
      const vid = videoRef.current;
      const w = canvas.width;
      const h = canvas.height;

      ctx.fillStyle = '#08080e';
      ctx.fillRect(0, 0, w, h);

      if (vid && vid.readyState >= 2) {
        if (vid.currentTime >= trimEnd && isPlaying) {
          vid.currentTime = trimStart;
        }
        setCurrentTime(vid.currentTime);

        ctx.save();
        ctx.filter = buildCssFilterString({
          ...DEFAULT_PHOTO_ADJUSTMENTS,
          brightness,
          contrast,
          saturate,
          grayscale,
        });
        ctx.drawImage(vid, 0, 0, w, h);
        ctx.restore();
      } else {
        ctx.fillStyle = '#13131c';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 20px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Upload a video or click "Load Studio Sample Clip"', w / 2, h / 2);
      }

      if (overlayTitle.trim()) {
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 32px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.75)';
        ctx.shadowBlur = 10;
        const y = overlayPos === 'top' ? 62 : overlayPos === 'center' ? h / 2 : h - 46;
        ctx.fillText(overlayTitle.trim(), w / 2, y);
        ctx.restore();
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [brightness, contrast, saturate, grayscale, overlayTitle, overlayPos, trimStart, trimEnd, isPlaying]);

  useEffect(() => {
    const vid = videoRef.current;
    if (vid) {
      vid.playbackRate = playbackSpeed;
      vid.muted = isMuted;
    }
  }, [playbackSpeed, isMuted]);

  const togglePlay = () => {
    const vid = videoRef.current;
    if (!vid || !videoUrl) return;
    if (vid.paused) {
      if (vid.currentTime < trimStart || vid.currentTime >= trimEnd) {
        vid.currentTime = trimStart;
      }
      vid.play().catch(() => undefined);
      setIsPlaying(true);
    } else {
      vid.pause();
      setIsPlaying(false);
    }
  };

  const handleExportEditedVideo = async () => {
    const vid = videoRef.current;
    const canvas = canvasRef.current;
    if (!vid || !canvas || !videoUrl || isExporting || typeof MediaRecorder === 'undefined') return;

    setIsExporting(true);
    setExportProgress(0);
    if (exportedUrl) {
      URL.revokeObjectURL(exportedUrl);
      setExportedUrl(null);
    }

    vid.pause();
    vid.currentTime = trimStart;
    await new Promise((r) => setTimeout(r, 120));

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
    vid.playbackRate = playbackSpeed;
    vid.play().catch(() => undefined);
    setIsPlaying(true);

    const clipSpan = Math.max(0.5, (trimEnd - trimStart) / playbackSpeed);
    const steps = 25;
    for (let i = 1; i <= steps; i++) {
      await new Promise((r) => setTimeout(r, (clipSpan * 1000) / steps));
      setExportProgress(Math.round((i / steps) * 100));
    }

    vid.pause();
    setIsPlaying(false);
    recorder.stop();
    const blob = await done;
    const outUrl = URL.createObjectURL(blob);
    setExportedUrl(outUrl);
    setIsExporting(false);

    onSaveProject({
      id: `proj_${Date.now().toString(36)}`,
      tool: 'video-editing',
      title: `${clipName} (Edited)`,
      format: 'webm',
      createdAt: Date.now(),
      durationSec: Math.round(clipSpan),
      previewDataUrl: canvas.toDataURL('image/png'),
    });
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Left Editor Controls */}
      <div className="space-y-5 rounded-2xl border border-white/10 bg-[#13131C] p-5 lg:col-span-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scissors className="h-4 w-4 text-[#818CF8]" aria-hidden="true" />
            <h3 className="font-display text-base font-bold text-white">Video Editor</h3>
          </div>
          <span className="text-xs font-medium text-slate-400">Trim & Grade</span>
        </div>

        {/* Source Buttons */}
        <div className="grid grid-cols-2 gap-2.5">
          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/15 bg-[#0B0B10] px-3 py-2.5 text-xs font-semibold text-white hover:border-[#5D4DF4]">
            <Upload className="h-3.5 w-3.5 text-[#818CF8]" />
            <span>Upload Video</span>
            <input type="file" accept="video/*" onChange={handleUploadVideo} className="sr-only" />
          </label>

          <button
            type="button"
            onClick={handleLoadSampleClip}
            disabled={isGeneratingSample}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#5D4DF4]/50 bg-[#5D4DF4]/15 px-3 py-2.5 text-xs font-semibold text-[#C7D2FE] hover:bg-[#5D4DF4]/25 disabled:opacity-60"
          >
            <Film className="h-3.5 w-3.5" />
            <span>{isGeneratingSample ? 'Creating Clip...' : 'Load Sample Clip'}</span>
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Clip: <span className="text-slate-200">{clipName}</span>
        </p>

        {/* Trim Bounds */}
        <div className="space-y-3 rounded-xl border border-white/[0.08] bg-[#0B0B10] p-3.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-white">Trim Range</span>
            <span className="font-mono-tabular text-slate-400">
              {formatTimecode(trimStart)} – {formatTimecode(trimEnd)}
            </span>
          </div>

          <div>
            <label htmlFor="vid-trim-start" className="text-[11px] text-slate-400">
              Start Time
            </label>
            <input
              id="vid-trim-start"
              type="range"
              min={0}
              max={Math.max(0.5, duration - 0.5)}
              step={0.1}
              value={trimStart}
              onChange={(e) => {
                const next = clampTrimRange(Number(e.target.value), trimEnd, duration);
                setTrimStart(next.start);
                setTrimEnd(next.end);
              }}
              className="studio-range mt-1 w-full"
            />
          </div>

          <div>
            <label htmlFor="vid-trim-end" className="text-[11px] text-slate-400">
              End Time
            </label>
            <input
              id="vid-trim-end"
              type="range"
              min={0.5}
              max={duration}
              step={0.1}
              value={trimEnd}
              onChange={(e) => {
                const next = clampTrimRange(trimStart, Number(e.target.value), duration);
                setTrimStart(next.start);
                setTrimEnd(next.end);
              }}
              className="studio-range mt-1 w-full"
            />
          </div>
        </div>

        {/* Speed & Color Grading */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="block text-xs font-medium text-slate-300">Playback Speed</span>
            <div className="mt-1.5 grid grid-cols-4 gap-1 rounded-lg bg-[#0B0B10] p-1">
              {[0.5, 1, 1.5, 2].map((spd) => (
                <button
                  key={spd}
                  type="button"
                  onClick={() => setPlaybackSpeed(spd)}
                  className={`cursor-pointer rounded-md py-1 text-[11px] font-semibold ${
                    playbackSpeed === spd ? 'bg-[#5D4DF4] text-white' : 'text-slate-400'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => setGrayscale((g) => (g === 0 ? 100 : 0))}
              className={`w-full cursor-pointer rounded-xl border py-2 text-xs font-semibold transition-colors ${
                grayscale === 100
                  ? 'border-[#5D4DF4] bg-[#5D4DF4]/20 text-white'
                  : 'border-white/15 bg-[#0B0B10] text-slate-300'
              }`}
            >
              {grayscale === 100 ? 'Noir B&W: ON' : 'Noir B&W: OFF'}
            </button>
          </div>
        </div>

        <div className="space-y-2.5">
          <div>
            <div className="flex justify-between text-xs">
              <label htmlFor="vid-brightness" className="text-slate-300">Brightness</label>
              <span className="font-mono-tabular text-slate-400">{brightness}%</span>
            </div>
            <input
              id="vid-brightness"
              type="range"
              min={60}
              max={140}
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
              className="studio-range mt-1 w-full"
            />
          </div>
          <div>
            <div className="flex justify-between text-xs">
              <label htmlFor="vid-contrast" className="text-slate-300">Contrast</label>
              <span className="font-mono-tabular text-slate-400">{contrast}%</span>
            </div>
            <input
              id="vid-contrast"
              type="range"
              min={60}
              max={150}
              value={contrast}
              onChange={(e) => setContrast(Number(e.target.value))}
              className="studio-range mt-1 w-full"
            />
          </div>
          <div>
            <div className="flex justify-between text-xs">
              <label htmlFor="vid-saturate" className="text-slate-300">Saturation</label>
              <span className="font-mono-tabular text-slate-400">{saturate}%</span>
            </div>
            <input
              id="vid-saturate"
              type="range"
              min={0}
              max={200}
              value={saturate}
              onChange={(e) => setSaturate(Number(e.target.value))}
              className="studio-range mt-1 w-full"
            />
          </div>
        </div>

        {/* Lower Third Overlay */}
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <label htmlFor="vid-title" className="block text-xs font-medium text-slate-300">
              Title Overlay
            </label>
            <input
              id="vid-title"
              type="text"
              value={overlayTitle}
              onChange={(e) => setOverlayTitle(e.target.value)}
              placeholder="Optional lower-third..."
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#0B0B10] px-3 py-2 text-xs text-white focus:border-[#5D4DF4] focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="vid-pos" className="block text-xs font-medium text-slate-300">
              Position
            </label>
            <select
              id="vid-pos"
              value={overlayPos}
              onChange={(e) => setOverlayPos(e.target.value as 'bottom' | 'center' | 'top')}
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#0B0B10] px-2 py-2 text-xs text-white focus:border-[#5D4DF4] focus:outline-none"
            >
              <option value="bottom">Bottom</option>
              <option value="center">Center</option>
              <option value="top">Top</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={handleExportEditedVideo}
          disabled={!videoUrl || isExporting}
          className="w-full cursor-pointer rounded-xl bg-[#5D4DF4] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#4F3FE6] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isExporting ? `Exporting Video ${exportProgress}%` : 'Export Edited Video (.webm)'}
        </button>
      </div>

      {/* Right Canvas Preview */}
      <div className="space-y-4 rounded-2xl border border-white/10 bg-[#13131C] p-5 lg:col-span-7">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">
            Composite Timeline Preview
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMuted((m) => !m)}
              aria-label={isMuted ? 'Unmute clip' : 'Mute clip'}
              className="cursor-pointer rounded-lg border border-white/10 bg-[#0B0B10] p-1.5 text-slate-300 hover:text-white"
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={togglePlay}
              disabled={!videoUrl}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 bg-[#0B0B10] px-3 py-1.5 text-xs font-medium text-white hover:bg-white/5 disabled:opacity-50"
            >
              {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>
          </div>
        </div>

        {/* Hidden source video element driving the composite canvas */}
        {videoUrl && (
          <video
            ref={videoRef}
            src={videoUrl}
            preload="auto"
            playsInline
            onLoadedMetadata={(e) => {
              const d = e.currentTarget.duration;
              if (Number.isFinite(d) && d > 0) {
                setDuration(Number(d.toFixed(1)));
                setTrimStart(0);
                setTrimEnd(Number(d.toFixed(1)));
              }
            }}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />
        )}

        <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0B0B10] p-2">
          <canvas
            ref={canvasRef}
            width={960}
            height={540}
            data-testid="video-editor-canvas"
            className="w-full rounded-lg"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono-tabular text-xs text-slate-400">
            {formatTimecode(currentTime)}
          </span>
          <input
            type="range"
            aria-label="Seek video timeline"
            min={0}
            max={duration}
            step={0.1}
            value={currentTime}
            disabled={!videoUrl}
            onChange={(e) => {
              const t = Number(e.target.value);
              if (videoRef.current) videoRef.current.currentTime = t;
              setCurrentTime(t);
            }}
            className="studio-range flex-1"
          />
          <span className="font-mono-tabular text-xs text-slate-400">
            {formatTimecode(duration)}
          </span>
        </div>

        {exportedUrl && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-white">Edited Video Ready</p>
              <button
                type="button"
                onClick={() => triggerFileDownload(exportedUrl, 'akool-edited-video.webm')}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
              >
                <Download className="h-3.5 w-3.5" />
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
