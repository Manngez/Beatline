/** Lightweight Web Audio synth sounds – no external assets needed */

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === "suspended") {
    void audioCtx.resume();
  }
  return audioCtx;
}

function tone(
  freq: number,
  start: number,
  duration: number,
  type: OscillatorType = "sine",
  gain = 0.12
) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(gain, start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

/** Bright ascending chime for a correct placement */
export function playSuccessSound() {
  try {
    const ctx = getCtx();
    const t = ctx.currentTime;
    // Sparkle arpeggio
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    notes.forEach((f, i) => {
      tone(f, t + i * 0.08, 0.28, "triangle", 0.14);
      tone(f * 2, t + i * 0.08, 0.18, "sine", 0.04);
    });
    // Soft shimmer pad
    tone(1318.5, t + 0.35, 0.45, "sine", 0.06);
  } catch {
    // ignore autoplay restrictions
  }
}

/** Soft negative thud for wrong answer */
export function playWrongSound() {
  try {
    const ctx = getCtx();
    const t = ctx.currentTime;
    tone(180, t, 0.25, "sawtooth", 0.08);
    tone(120, t + 0.08, 0.35, "triangle", 0.1);
    tone(90, t + 0.18, 0.4, "sine", 0.08);
  } catch {
    // ignore
  }
}

/** Short click for UI */
export function playClickSound() {
  try {
    const ctx = getCtx();
    const t = ctx.currentTime;
    tone(880, t, 0.05, "square", 0.04);
  } catch {
    // ignore
  }
}

/** Fanfare for banking / winning */
export function playBankSound() {
  try {
    const ctx = getCtx();
    const t = ctx.currentTime;
    const notes = [392, 493.88, 587.33, 784];
    notes.forEach((f, i) => {
      tone(f, t + i * 0.1, 0.35, "triangle", 0.12);
    });
  } catch {
    // ignore
  }
}

export function playWinSound() {
  try {
    const ctx = getCtx();
    const t = ctx.currentTime;
    const melody = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.5];
    melody.forEach((f, i) => {
      tone(f, t + i * 0.12, 0.4, "triangle", 0.13);
      tone(f / 2, t + i * 0.12, 0.35, "sine", 0.05);
    });
  } catch {
    // ignore
  }
}
