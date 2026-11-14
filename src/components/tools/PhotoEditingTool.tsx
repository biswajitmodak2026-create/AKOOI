import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Download,
  Eye,
  FlipHorizontal,
  FlipVertical,
  Image as ImageIcon,
  RotateCcw,
  RotateCw,
  Upload,
} from 'lucide-react';
import { SavedStudioItem } from '../../utils/authSubscription';
import { generateStudioSamplePhotos } from '../../utils/localMediaSamples';
import {
  DEFAULT_PHOTO_ADJUSTMENTS,
  PhotoAdjustments,
  buildCssFilterString,
} from '../../utils/mediaMath';
import { triggerFileDownload } from '../../utils/videoExport';

interface PhotoEditingToolProps {
  onSaveProject: (item: SavedStudioItem) => void;
}

const FILTER_PRESETS: { name: string; values: Partial<PhotoAdjustments> }[] = [
  { name: 'Original', values: DEFAULT_PHOTO_ADJUSTMENTS },
  { name: 'Cinema Gold', values: { brightness: 105, contrast: 118, saturate: 112, warmth: 24, vignette: 35 } },
  { name: 'Noir B&W', values: { brightness: 102, contrast: 128, saturate: 0, grayscale: 100, vignette: 40 } },
  { name: 'Obsidian Cool', values: { brightness: 96, contrast: 114, saturate: 88, vignette: 30 } },
  { name: 'Vivid Pop', values: { brightness: 106, contrast: 115, saturate: 145, vignette: 10 } },
  { name: 'Soft Matte', values: { brightness: 108, contrast: 88, saturate: 92, warmth: 12 } },
];

export const PhotoEditingTool: React.FC<PhotoEditingToolProps> = ({ onSaveProject }) => {
  const samples = useMemo(() => generateStudioSamplePhotos(), []);
  const [selectedSrc, setSelectedSrc] = useState<string>(samples[0]?.dataUrl ?? '');
  const [photoTitle, setPhotoTitle] = useState<string>(samples[0]?.title ?? 'Studio Photo');
  const [adj, setAdj] = useState<PhotoAdjustments>(DEFAULT_PHOTO_ADJUSTMENTS);
  const [rotationDeg, setRotationDeg] = useState<number>(0);
  const [flipX, setFlipX] = useState<boolean>(false);
  const [flipY, setFlipY] = useState<boolean>(false);
  const [cropMode, setCropMode] = useState<'free' | '1:1' | '16:9'>('free');
  const [overlayText, setOverlayText] = useState<string>('');
  const [overlayColor, setOverlayColor] = useState<string>('#ffffff');
  const [showOriginal, setShowOriginal] = useState<boolean>(false);
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const loadedImageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!selectedSrc) return;
    const img = new Image();
    img.onload = () => {
      loadedImageRef.current = img;
      renderPhotoCanvas();
    };
    img.src = selectedSrc;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSrc]);

  const renderPhotoCanvas = () => {
    const canvas = canvasRef.current;
    const img = loadedImageRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isQuarterTurn = Math.abs(rotationDeg % 180) === 90;
    const srcW = isQuarterTurn ? img.naturalHeight : img.naturalWidth;
    const srcH = isQuarterTurn ? img.naturalWidth : img.naturalHeight;

    let targetW = srcW;
    let targetH = srcH;
    if (cropMode === '1:1') {
      const side = Math.min(srcW, srcH);
      targetW = side;
      targetH = side;
    } else if (cropMode === '16:9') {
      const targetRatio = 16 / 9;
      if (srcW / srcH > targetRatio) {
        targetH = srcH;
        targetW = Math.round(srcH * targetRatio);
      } else {
        targetW = srcW;
        targetH = Math.round(srcW / targetRatio);
      }
    }

    canvas.width = targetW;
    canvas.height = targetH;

    ctx.save();
    ctx.clearRect(0, 0, targetW, targetH);

    if (!showOriginal) {
      ctx.filter = buildCssFilterString(adj);
    } else {
      ctx.filter = 'none';
    }

    ctx.translate(targetW / 2, targetH / 2);
    ctx.rotate((rotationDeg * Math.PI) / 180);
    ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    ctx.restore();

    // Vignette
    if (!showOriginal && adj.vignette > 0) {
      const vGrad = ctx.createRadialGradient(
        targetW / 2,
        targetH / 2,
        Math.min(targetW, targetH) * 0.25,
        targetW / 2,
        targetH / 2,
        Math.max(targetW, targetH) * 0.72
      );
      vGrad.addColorStop(0, 'rgba(0,0,0,0)');
      vGrad.addColorStop(1, `rgba(0,0,0,${(adj.vignette / 100) * 0.75})`);
      ctx.fillStyle = vGrad;
      ctx.fillRect(0, 0, targetW, targetH);
    }

    // Watermark / Text overlay
    if (overlayText.trim()) {
      ctx.save();
      ctx.fillStyle = overlayColor;
      const fontSize = Math.max(24, Math.round(targetW * 0.042));
      ctx.font = `700 ${fontSize}px "Plus Jakarta Sans", sans-serif`;
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.65)';
      ctx.shadowBlur = 12;
      ctx.fillText(overlayText.trim(), targetW / 2, targetH - fontSize * 1.1);
      ctx.restore();
    }
  };

  useEffect(() => {
    renderPhotoCanvas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adj, rotationDeg, flipX, flipY, cropMode, overlayText, overlayColor, showOriginal]);

  const handleUploadPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSelectedSrc(reader.result);
        setPhotoTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    setAdj(DEFAULT_PHOTO_ADJUSTMENTS);
    setRotationDeg(0);
    setFlipX(false);
    setFlipY(false);
    setCropMode('free');
    setOverlayText('');
    setShowOriginal(false);
  };

  const handleExportPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    triggerFileDownload(dataUrl, `${photoTitle.toLowerCase().replace(/\s+/g, '-')}-edited.png`);
    onSaveProject({
      id: `proj_${Date.now().toString(36)}`,
      tool: 'photo-editing',
      title: `${photoTitle} (Edited)`,
      format: 'png',
      createdAt: Date.now(),
      previewDataUrl: dataUrl,
    });
    setSavedFeedback('Exported PNG and saved to Library.');
    setTimeout(() => setSavedFeedback(null), 3500);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Left Adjustments */}
      <div className="space-y-5 rounded-2xl border border-white/10 bg-[#13131C] p-5 lg:col-span-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-[#818CF8]" aria-hidden="true" />
            <h3 className="font-display text-base font-bold text-white">Photo Editor</h3>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="cursor-pointer text-xs font-medium text-slate-400 hover:text-white"
          >
            Reset All
          </button>
        </div>

        {/* Upload or Pick Sample */}
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-300">Source Image</span>
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/15 bg-[#0B0B10] px-3 py-1.5 text-xs font-semibold text-white hover:border-[#5D4DF4]">
              <Upload className="h-3.5 w-3.5 text-[#818CF8]" />
              <span>Upload Photo</span>
              <input type="file" accept="image/*" onChange={handleUploadPhoto} className="sr-only" />
            </label>
          </div>

          <div className="mt-2.5 grid grid-cols-3 gap-2">
            {samples.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setSelectedSrc(s.dataUrl);
                  setPhotoTitle(s.title);
                }}
                className={`cursor-pointer overflow-hidden rounded-lg border text-left transition-colors ${
                  selectedSrc === s.dataUrl
                    ? 'border-[#5D4DF4]'
                    : 'border-white/10 opacity-80 hover:opacity-100'
                }`}
              >
                <img
                  src={s.dataUrl}
                  alt={s.title}
                  referrerPolicy="no-referrer"
                  className="h-14 w-full object-cover"
                />
                <span className="block truncate px-1.5 py-1 text-[10px] font-medium text-slate-300">
                  {s.title}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Presets */}
        <div>
          <span className="block text-xs font-medium text-slate-300">Color Presets</span>
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {FILTER_PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => setAdj({ ...DEFAULT_PHOTO_ADJUSTMENTS, ...preset.values })}
                className="cursor-pointer rounded-lg border border-white/10 bg-[#0B0B10] px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:border-[#5D4DF4] hover:text-white"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Sliders */}
        <div className="space-y-3">
          {(
            [
              { key: 'brightness', label: 'Brightness', min: 50, max: 150, unit: '%' },
              { key: 'contrast', label: 'Contrast', min: 50, max: 160, unit: '%' },
              { key: 'saturate', label: 'Saturation', min: 0, max: 200, unit: '%' },
              { key: 'warmth', label: 'Warmth', min: 0, max: 100, unit: '%' },
              { key: 'vignette', label: 'Vignette', min: 0, max: 100, unit: '%' },
              { key: 'blur', label: 'Soft Blur', min: 0, max: 10, unit: 'px' },
            ] as const
          ).map((ctrl) => (
            <div key={ctrl.key}>
              <div className="flex justify-between text-xs">
                <label htmlFor={`photo-${ctrl.key}`} className="text-slate-300">
                  {ctrl.label}
                </label>
                <span className="font-mono-tabular text-slate-400">
                  {adj[ctrl.key]}
                  {ctrl.unit}
                </span>
              </div>
              <input
                id={`photo-${ctrl.key}`}
                type="range"
                min={ctrl.min}
                max={ctrl.max}
                value={adj[ctrl.key]}
                onChange={(e) =>
                  setAdj((prev) => ({ ...prev, [ctrl.key]: Number(e.target.value) }))
                }
                className="studio-range mt-1 w-full"
              />
            </div>
          ))}
        </div>

        {/* Transform & Overlay */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="block text-xs font-medium text-slate-300">Rotate & Flip</span>
            <div className="mt-1.5 flex items-center gap-1.5">
              <button
                type="button"
                aria-label="Rotate left 90 degrees"
                onClick={() => setRotationDeg((r) => (r - 90) % 360)}
                className="cursor-pointer rounded-lg border border-white/10 bg-[#0B0B10] p-2 text-slate-200 hover:border-[#5D4DF4]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label="Rotate right 90 degrees"
                onClick={() => setRotationDeg((r) => (r + 90) % 360)}
                className="cursor-pointer rounded-lg border border-white/10 bg-[#0B0B10] p-2 text-slate-200 hover:border-[#5D4DF4]"
              >
                <RotateCw className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label="Flip horizontal"
                onClick={() => setFlipX((v) => !v)}
                className="cursor-pointer rounded-lg border border-white/10 bg-[#0B0B10] p-2 text-slate-200 hover:border-[#5D4DF4]"
              >
                <FlipHorizontal className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label="Flip vertical"
                onClick={() => setFlipY((v) => !v)}
                className="cursor-pointer rounded-lg border border-white/10 bg-[#0B0B10] p-2 text-slate-200 hover:border-[#5D4DF4]"
              >
                <FlipVertical className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div>
            <span className="block text-xs font-medium text-slate-300">Crop Ratio</span>
            <div className="mt-1.5 grid grid-cols-3 gap-1 rounded-lg bg-[#0B0B10] p-1">
              {(['free', '1:1', '16:9'] as const).map((ratio) => (
                <button
                  key={ratio}
                  type="button"
                  onClick={() => setCropMode(ratio)}
                  className={`cursor-pointer rounded-md py-1 text-[11px] font-semibold ${
                    cropMode === ratio ? 'bg-[#5D4DF4] text-white' : 'text-slate-400'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <label htmlFor="photo-overlay-text" className="block text-xs font-medium text-slate-300">
              Caption / Watermark
            </label>
            <input
              id="photo-overlay-text"
              type="text"
              value={overlayText}
              onChange={(e) => setOverlayText(e.target.value)}
              placeholder="Optional title..."
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#0B0B10] px-3 py-2 text-xs text-white focus:border-[#5D4DF4] focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="photo-overlay-color" className="block text-xs font-medium text-slate-300">
              Text Color
            </label>
            <select
              id="photo-overlay-color"
              value={overlayColor}
              onChange={(e) => setOverlayColor(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#0B0B10] px-2 py-2 text-xs text-white focus:border-[#5D4DF4] focus:outline-none"
            >
              <option value="#ffffff">White</option>
              <option value="#fbbf24">Gold</option>
              <option value="#818cf8">Indigo</option>
            </select>
          </div>
        </div>
      </div>

      {/* Right Canvas Preview */}
      <div className="space-y-4 rounded-2xl border border-white/10 bg-[#13131C] p-5 lg:col-span-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-medium text-slate-400">
            Editing: <span className="text-white">{photoTitle}</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowOriginal((v) => !v)}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                showOriginal
                  ? 'border-[#5D4DF4] bg-[#5D4DF4]/20 text-white'
                  : 'border-white/10 bg-[#0B0B10] text-slate-300 hover:text-white'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>{showOriginal ? 'Viewing Original' : 'Compare Original'}</span>
            </button>

            <button
              type="button"
              onClick={handleExportPng}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#5D4DF4] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#4F3FE6]"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export PNG</span>
            </button>
          </div>
        </div>

        <div className="flex min-h-[340px] items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[#0B0B10] p-3">
          <canvas
            ref={canvasRef}
            data-testid="photo-editor-canvas"
            className="max-h-[420px] w-auto max-w-full rounded-lg"
          />
        </div>

        {savedFeedback && (
          <p role="status" className="text-xs font-medium text-emerald-400">
            {savedFeedback}
          </p>
        )}
      </div>
    </div>
  );
};
