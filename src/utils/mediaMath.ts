export type AspectRatio = '16:9' | '9:16' | '1:1';

export interface PhotoAdjustments {
  brightness: number; // 50 to 150 (100 default)
  contrast: number; // 50 to 150 (100 default)
  saturate: number; // 0 to 200 (100 default)
  warmth: number; // 0 to 100 sepia blend (0 default)
  blur: number; // 0 to 10 px (0 default)
  grayscale: number; // 0 to 100 (0 default)
  vignette: number; // 0 to 100 (0 default)
}

export const DEFAULT_PHOTO_ADJUSTMENTS: PhotoAdjustments = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
  warmth: 0,
  blur: 0,
  grayscale: 0,
  vignette: 0,
};

export function formatTimecode(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '00:00.0';
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const tenths = Math.floor((seconds - Math.floor(seconds)) * 10);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${tenths}`;
}

export function clampTrimRange(
  start: number,
  end: number,
  duration: number,
  minGap = 0.5
): { start: number; end: number } {
  const safeDuration = Math.max(minGap, duration);
  let s = Math.max(0, Math.min(start, safeDuration - minGap));
  let e = Math.min(safeDuration, Math.max(end, s + minGap));
  if (e - s < minGap) {
    e = Math.min(safeDuration, s + minGap);
    if (e - s < minGap) {
      s = Math.max(0, e - minGap);
    }
  }
  return {
    start: Number(s.toFixed(2)),
    end: Number(e.toFixed(2)),
  };
}

export function buildCssFilterString(adj: PhotoAdjustments): string {
  const parts = [
    `brightness(${adj.brightness}%)`,
    `contrast(${adj.contrast}%)`,
    `saturate(${adj.saturate}%)`,
  ];
  if (adj.warmth > 0) parts.push(`sepia(${adj.warmth}%)`);
  if (adj.grayscale > 0) parts.push(`grayscale(${adj.grayscale}%)`);
  if (adj.blur > 0) parts.push(`blur(${adj.blur}px)`);
  return parts.join(' ');
}

export function wrapTextLines(text: string, maxCharsPerLine = 28): string[] {
  const cleaned = text.trim();
  if (!cleaned) return ['AKOOL Local Studio'];

  const paragraphs = cleaned.split(/\n+/);
  const lines: string[] = [];

  for (const para of paragraphs) {
    const words = para.trim().split(/\s+/);
    let current = '';
    for (const word of words) {
      if (!current) {
        current = word;
      } else if (current.length + 1 + word.length <= maxCharsPerLine) {
        current += ` ${word}`;
      } else {
        lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

export function splitScenesFromPrompt(prompt: string): string[] {
  const cleaned = prompt.trim();
  if (!cleaned) {
    return ['Scene 1: Golden Light Over Studio', 'Scene 2: Dynamic Motion Typography', 'Scene 3: Crafted Locally Without APIs'];
  }
  const raw = cleaned
    .split(/(?:\n+|\.\s+|;\s+)/)
    .map((s) => s.trim())
    .filter(Boolean);
  return raw.length > 0 ? raw.slice(0, 6) : [cleaned];
}

export function computeAspectDimensions(
  ratio: AspectRatio,
  baseWidth = 960
): { width: number; height: number } {
  const even = (n: number) => Math.round(n / 2) * 2;
  if (ratio === '9:16') {
    const w = even(baseWidth * 0.5625);
    return { width: w, height: even(w * (16 / 9)) };
  }
  if (ratio === '1:1') {
    const s = even(baseWidth * 0.75);
    return { width: s, height: s };
  }
  return { width: even(baseWidth), height: even(baseWidth * (9 / 16)) };
}
