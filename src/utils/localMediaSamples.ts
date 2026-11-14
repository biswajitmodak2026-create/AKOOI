export interface StudioSamplePhoto {
  id: string;
  title: string;
  subtitle: string;
  dataUrl: string;
}

function paintNoise(ctx: CanvasRenderingContext2D, w: number, h: number, alpha = 0.035) {
  ctx.save();
  ctx.fillStyle = `rgba(255,255,255,${alpha})`;
  for (let i = 0; i < 1800; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    ctx.fillRect(x, y, 1.5, 1.5);
  }
  ctx.restore();
}

export function generateStudioSamplePhotos(): StudioSamplePhoto[] {
  const samples: StudioSamplePhoto[] = [];

  // 1. Warm Editorial Silhouette (inspired by AKOOL cinema aesthetic)
  {
    const c = document.createElement('canvas');
    c.width = 1280;
    c.height = 720;
    const ctx = c.getContext('2d');
    if (ctx) {
      const bg = ctx.createLinearGradient(0, 0, 1280, 720);
      bg.addColorStop(0, '#18110c');
      bg.addColorStop(0.5, '#3b2818');
      bg.addColorStop(1, '#0c0a0d');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 1280, 720);

      // Warm studio key light
      const glow = ctx.createRadialGradient(690, 290, 20, 690, 290, 440);
      glow.addColorStop(0, 'rgba(245, 189, 108, 0.72)');
      glow.addColorStop(0.45, 'rgba(181, 114, 52, 0.28)');
      glow.addColorStop(1, 'rgba(12, 10, 13, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, 1280, 720);

      // Architectural window pillars
      ctx.fillStyle = 'rgba(14, 11, 10, 0.78)';
      ctx.fillRect(90, 60, 110, 600);
      ctx.fillRect(1080, 60, 110, 600);

      // Stylized editorial silhouette
      ctx.fillStyle = '#140f0c';
      ctx.beginPath();
      ctx.ellipse(640, 275, 86, 108, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(410, 720);
      ctx.quadraticCurveTo(440, 440, 640, 420);
      ctx.quadraticCurveTo(840, 440, 870, 720);
      ctx.closePath();
      ctx.fill();

      // Rim highlight arc
      ctx.strokeStyle = 'rgba(255, 214, 150, 0.65)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(642, 272, 87, -Math.PI * 0.65, Math.PI * 0.25);
      ctx.stroke();

      paintNoise(ctx, 1280, 720, 0.04);
      samples.push({
        id: 'warm-cinema',
        title: 'Editorial Silhouette',
        subtitle: 'Warm studio rim lighting · 16:9',
        dataUrl: c.toDataURL('image/png'),
      });
    }
  }

  // 2. Obsidian Horizon Architecture
  {
    const c = document.createElement('canvas');
    c.width = 1280;
    c.height = 720;
    const ctx = c.getContext('2d');
    if (ctx) {
      const sky = ctx.createLinearGradient(0, 0, 0, 720);
      sky.addColorStop(0, '#090b18');
      sky.addColorStop(0.55, '#1e1b4b');
      sky.addColorStop(0.62, '#5d4df4');
      sky.addColorStop(1, '#080910');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, 1280, 720);

      // Glowing horizon sun/orb
      const orb = ctx.createRadialGradient(640, 405, 10, 640, 405, 220);
      orb.addColorStop(0, 'rgba(199, 210, 254, 0.9)');
      orb.addColorStop(0.35, 'rgba(99, 102, 241, 0.5)');
      orb.addColorStop(1, 'rgba(15, 23, 42, 0)');
      ctx.fillStyle = orb;
      ctx.fillRect(0, 0, 1280, 720);

      // Minimalist concrete pavilion roof & columns
      ctx.fillStyle = '#0d0f1a';
      ctx.fillRect(190, 250, 900, 34);
      ctx.fillRect(250, 284, 34, 220);
      ctx.fillRect(996, 284, 34, 220);
      ctx.fillRect(160, 504, 960, 26);

      // Reflection water ripples
      ctx.fillStyle = 'rgba(129, 140, 248, 0.14)';
      for (let y = 545; y < 700; y += 16) {
        const w = 520 - (y - 545) * 1.4;
        ctx.fillRect(640 - w / 2, y, w, 3);
      }

      paintNoise(ctx, 1280, 720, 0.03);
      samples.push({
        id: 'obsidian-pavilion',
        title: 'Obsidian Pavilion',
        subtitle: 'Twilight architecture · 16:9',
        dataUrl: c.toDataURL('image/png'),
      });
    }
  }

  // 3. Golden Hour Botanical Prism
  {
    const c = document.createElement('canvas');
    c.width = 1280;
    c.height = 720;
    const ctx = c.getContext('2d');
    if (ctx) {
      const bg = ctx.createLinearGradient(0, 0, 1280, 720);
      bg.addColorStop(0, '#111827');
      bg.addColorStop(0.5, '#1f2937');
      bg.addColorStop(1, '#0b0b10');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 1280, 720);

      const sun = ctx.createRadialGradient(940, 220, 20, 940, 220, 500);
      sun.addColorStop(0, 'rgba(251, 191, 36, 0.55)');
      sun.addColorStop(0.5, 'rgba(217, 119, 6, 0.18)');
      sun.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = sun;
      ctx.fillRect(0, 0, 1280, 720);

      // Glass prism shapes
      ctx.strokeStyle = 'rgba(255,255,255,0.28)';
      ctx.lineWidth = 2;
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.beginPath();
      ctx.moveTo(640, 120);
      ctx.lineTo(860, 520);
      ctx.lineTo(420, 520);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = 'rgba(245, 158, 11, 0.14)';
      ctx.beginPath();
      ctx.arc(540, 380, 130, 0, Math.PI * 2);
      ctx.fill();

      paintNoise(ctx, 1280, 720, 0.03);
      samples.push({
        id: 'golden-prism',
        title: 'Studio Glass Prism',
        subtitle: 'Product lighting composition · 16:9',
        dataUrl: c.toDataURL('image/png'),
      });
    }
  }

  return samples;
}

export async function generateSampleVideoClipUrl(durationSec = 4): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = 960;
  canvas.height = 540;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D unavailable');

  const stream = canvas.captureStream(30);
  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : 'video/webm';
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 2_500_000 });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const done = new Promise<string>((resolve) => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      resolve(URL.createObjectURL(blob));
    };
  });

  recorder.start(100);
  const totalFrames = Math.round(durationSec * 30);

  for (let frame = 0; frame <= totalFrames; frame++) {
    const p = frame / totalFrames;
    const grad = ctx.createLinearGradient(0, 0, 960, 540);
    grad.addColorStop(0, '#0b0b12');
    grad.addColorStop(0.5, '#1e1b4b');
    grad.addColorStop(1, '#120e1c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 960, 540);

    // Sweeping light sphere
    const cx = 180 + p * 600;
    const cy = 270 + Math.sin(p * Math.PI * 2) * 70;
    const orb = ctx.createRadialGradient(cx, cy, 10, cx, cy, 240);
    orb.addColorStop(0, 'rgba(129, 140, 248, 0.85)');
    orb.addColorStop(0.5, 'rgba(93, 77, 244, 0.35)');
    orb.addColorStop(1, 'rgba(11, 11, 18, 0)');
    ctx.fillStyle = orb;
    ctx.fillRect(0, 0, 960, 540);

    // Horizon grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.09)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 6; i++) {
      const y = 340 + i * 34;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(960, y);
      ctx.stroke();
    }

    // Center typography
    ctx.fillStyle = '#f8fafc';
    ctx.font = '700 42px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('AKOOL STUDIO CLIP', 480, 255);
    ctx.fillStyle = 'rgba(203, 213, 225, 0.85)';
    ctx.font = '500 18px "DM Sans", sans-serif';
    ctx.fillText(`Local Motion Frame ${String(frame).padStart(3, '0')} · Zero API`, 480, 295);

    await new Promise((r) => setTimeout(r, 1000 / 30));
  }

  recorder.stop();
  return done;
}
