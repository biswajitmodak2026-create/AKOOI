export function pickSupportedVideoMimeType(): string {
  const candidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ];
  for (const type of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return 'video/webm';
}

export function triggerFileDownload(url: string, filename: string): void {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

export interface AmbientAudioHandle {
  stream: MediaStream;
  stop: () => void;
}

/**
 * Generates a warm ambient chord bed purely via Web Audio API (no external audio files or APIs).
 */
export function createLocalAmbientSynthStream(): AmbientAudioHandle | null {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    const ctx = new AudioCtx();
    const dest = ctx.createMediaStreamDestination();
    const master = ctx.createGain();
    master.gain.value = 0.08;
    master.connect(dest);

    const freqs = [220, 277.18, 329.63, 440]; // A major warm pad
    const oscs: OscillatorNode[] = [];
    for (const f of freqs) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      osc.connect(master);
      osc.start();
      oscs.push(osc);
    }

    return {
      stream: dest.stream,
      stop: () => {
        for (const o of oscs) {
          try {
            o.stop();
          } catch {
            // ignore
          }
        }
        ctx.close().catch(() => undefined);
      },
    };
  } catch {
    return null;
  }
}
