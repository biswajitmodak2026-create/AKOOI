import React, { useEffect, useRef, useState } from 'react';
import { Film, Image, Mic, Pause, Play, Scissors } from 'lucide-react';

export type StudioTabId = 'text-to-video' | 'voice-to-video' | 'photo-editing' | 'video-editing';

interface HeroShowcaseProps {
  onSelectTool: (tab: StudioTabId) => void;
  onTryFree: () => void;
  onOpenAuthRegister: () => void;
  isLoggedIn: boolean;
}

export const HeroShowcase: React.FC<HeroShowcaseProps> = ({
  onSelectTool,
  onTryFree,
  onOpenAuthRegister,
  isLoggedIn,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let start = performance.now();

    const drawFrame = (now: number) => {
      const elapsed = isPlaying ? (now - start) / 1000 : 1.4;

      const w = canvas.width;
      const h = canvas.height;

      // Warm sepia-amber editorial atmosphere matching the reference screenshot
      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, '#120d0a');
      bg.addColorStop(0.5, '#2b1e14');
      bg.addColorStop(1, '#0d0b0e');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Slowly drifting warm cinema spotlight
      const lightX = w * (0.54 + Math.sin(elapsed * 0.6) * 0.08);
      const lightY = h * (0.42 + Math.cos(elapsed * 0.5) * 0.05);
      const glow = ctx.createRadialGradient(lightX, lightY, 12, lightX, lightY, w * 0.52);
      glow.addColorStop(0, 'rgba(245, 196, 128, 0.55)');
      glow.addColorStop(0.45, 'rgba(176, 114, 56, 0.22)');
      glow.addColorStop(1, 'rgba(13, 11, 14, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      // Subtle architectural light shafts
      ctx.save();
      ctx.fillStyle = 'rgba(255, 224, 178, 0.04)';
      for (let i = 0; i < 4; i++) {
        const x = w * (0.14 + i * 0.22) + Math.sin(elapsed * 0.4 + i) * 14;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 95, 0);
        ctx.lineTo(x + 185, h);
        ctx.lineTo(x + 45, h);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // Editorial silhouette figure matching reference framing
      ctx.save();
      const sway = Math.sin(elapsed * 0.8) * 3;
      ctx.fillStyle = '#120d0b';
      // Head
      ctx.beginPath();
      ctx.ellipse(w * 0.52 + sway, h * 0.41, 56, 70, -0.05, 0, Math.PI * 2);
      ctx.fill();
      // Shoulders & tailored jacket
      ctx.beginPath();
      ctx.moveTo(w * 0.28 + sway, h);
      ctx.quadraticCurveTo(w * 0.34 + sway, h * 0.6, w * 0.52 + sway, h * 0.58);
      ctx.quadraticCurveTo(w * 0.72 + sway, h * 0.6, w * 0.78 + sway, h);
      ctx.closePath();
      ctx.fill();

      // Golden rim light edge on hair/profile
      ctx.strokeStyle = 'rgba(251, 207, 138, 0.62)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(w * 0.52 + sway, h * 0.41, 57, -Math.PI * 0.72, Math.PI * 0.2);
      ctx.stroke();
      ctx.restore();

      // Soft floating film dust particles
      ctx.fillStyle = 'rgba(255, 225, 180, 0.35)';
      for (let i = 0; i < 18; i++) {
        const px = ((i * 137 + elapsed * 18) % (w + 40)) - 20;
        const py = ((i * 89 + Math.sin(elapsed + i) * 20) % h);
        ctx.beginPath();
        ctx.arc(px, py, 1.3 + (i % 2) * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }

      if (isPlaying) {
        rafId = requestAnimationFrame(drawFrame);
      }
    };

    rafId = requestAnimationFrame(drawFrame);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying]);

  const toolCards: { id: StudioTabId; num: string; label: string; desc: string; icon: React.ReactNode }[] = [
    {
      id: 'text-to-video',
      num: '01.',
      label: 'Text to Video',
      desc: 'Animate scripts & scenes into WebM video',
      icon: <Film className="h-4 w-4 text-[#818CF8]" aria-hidden="true" />,
    },
    {
      id: 'voice-to-video',
      num: '02.',
      label: 'Voice to Video',
      desc: 'Mic, audio file, or speech into visualizers',
      icon: <Mic className="h-4 w-4 text-[#818CF8]" aria-hidden="true" />,
    },
    {
      id: 'photo-editing',
      num: '03.',
      label: 'Photo Editing',
      desc: 'Filters, crop, text & lossless PNG export',
      icon: <Image className="h-4 w-4 text-[#818CF8]" aria-hidden="true" />,
    },
    {
      id: 'video-editing',
      num: '04.',
      label: 'Video Editing',
      desc: 'Trim, speed, grade & overlay titles locally',
      icon: <Scissors className="h-4 w-4 text-[#818CF8]" aria-hidden="true" />,
    },
  ];

  return (
    <section id="top" className="relative overflow-hidden pt-10 pb-14 sm:pt-14 sm:pb-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 text-center">
        {/* Main Headline matching screenshot */}
        <h1 className="mx-auto max-w-2xl font-display text-4xl font-bold tracking-tight text-white sm:text-6xl [text-wrap:balance]">
          AI Video Generator
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg">
          Create videos from text, voice, images, or clips. Run Text to Video, Voice to Video, Photo Editing, and Video Editing directly in your browser with zero external APIs.
        </p>

        {/* Reference Showcase Card matching screenshot */}
        <div className="mx-auto mt-8 max-w-3xl">
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#13131C] shadow-2xl">
            <div className="relative aspect-[16/9] w-full">
              <canvas
                ref={canvasRef}
                width={960}
                height={540}
                data-testid="hero-showcase-canvas"
                className="h-full w-full object-cover"
              />

              {/* Contrast Scrim */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/45" />

              {/* Top Card Brand Mark matching screenshot */}
              <div className="pointer-events-none absolute inset-x-0 top-5 flex items-center justify-center gap-2">
                <span className="font-display text-sm font-extrabold tracking-widest text-white/95">
                  AKOOL
                </span>
              </div>

              {/* Center Hero Overlay Copy matching screenshot */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6">
                <p className="font-display text-2xl font-semibold tracking-tight text-white sm:text-4xl">
                  Image to video with <span className="font-bold">AI</span>
                </p>
              </div>

              {/* Bottom attribution & play control */}
              <div className="absolute inset-x-0 bottom-3.5 flex items-center justify-between px-5">
                <span className="text-[11px] font-medium text-slate-300/80">
                  2026 · Local Browser Engine
                </span>
                <button
                  type="button"
                  onClick={() => setIsPlaying((p) => !p)}
                  aria-label={isPlaying ? 'Pause showcase animation' : 'Play showcase animation'}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/15 bg-black/50 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/75"
                >
                  {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  <span>{isPlaying ? 'Pause' : 'Play'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Primary Action matching screenshot's Try for free button */}
          <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onTryFree}
              className="w-full cursor-pointer rounded-xl bg-[#5D4DF4] px-8 py-3.5 text-base font-semibold text-white transition-colors hover:bg-[#4F3FE6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#818CF8] sm:w-auto sm:min-w-[260px]"
            >
              Try for free
            </button>
            {!isLoggedIn && (
              <button
                type="button"
                onClick={onOpenAuthRegister}
                className="w-full cursor-pointer rounded-xl border border-white/15 bg-[#13131C] px-6 py-3.5 text-sm font-semibold text-slate-100 transition-colors hover:border-white/25 hover:bg-[#191926] sm:w-auto"
              >
                Create Free Account
              </button>
            )}
          </div>
        </div>

        {/* 4-Tool Studio Quick Launch Strip */}
        <div className="mt-12 grid grid-cols-1 gap-3 text-left sm:grid-cols-2 lg:grid-cols-4">
          {toolCards.map((tool) => (
            <button
              key={tool.id}
              type="button"
              onClick={() => onSelectTool(tool.id)}
              className="group cursor-pointer rounded-xl border border-white/[0.08] bg-[#13131C] p-4 text-left transition-colors hover:border-[#5D4DF4]/60 hover:bg-[#171724]"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono-tabular text-xs font-medium text-slate-400">
                  {tool.num}
                </span>
                {tool.icon}
              </div>
              <h2 className="mt-2.5 font-display text-base font-semibold text-white group-hover:text-[#A5B4FC]">
                {tool.label}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                {tool.desc}
              </p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
