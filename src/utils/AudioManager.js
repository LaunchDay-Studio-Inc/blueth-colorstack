/**
 * Procedural audio using Web Audio API.
 * No external audio files needed — all sounds synthesized at runtime.
 * Designed for dopamine-boosting feedback on every interaction.
 */

let audioCtx = null;
let masterGain = null;
let muted = false;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.3;
    masterGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function getOutput() {
  getCtx();
  return masterGain;
}

export function initAudio() {
  getCtx();
}

export function setMuted(val) {
  muted = val;
  if (masterGain) {
    masterGain.gain.value = val ? 0 : 0.3;
  }
}

export function isMuted() {
  return muted;
}

export function toggleMute() {
  setMuted(!muted);
  return muted;
}

// --- Sound Effects ---

export function playJump() {
  if (muted) return;
  const ctx = getCtx();
  const t = ctx.currentTime;

  // Quick ascending sweep — satisfying "boop"
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(280, t);
  osc.frequency.exponentialRampToValueAtTime(680, t + 0.1);
  gain.gain.setValueAtTime(0.25, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
  osc.connect(gain);
  gain.connect(getOutput());
  osc.start(t);
  osc.stop(t + 0.15);
}

export function playDoubleJump() {
  if (muted) return;
  const ctx = getCtx();
  const t = ctx.currentTime;

  // Higher pitched double-boop
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(400, t);
  osc.frequency.exponentialRampToValueAtTime(900, t + 0.08);
  gain.gain.setValueAtTime(0.2, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  osc.connect(gain);
  gain.connect(getOutput());
  osc.start(t);
  osc.stop(t + 0.12);

  // Second tone slightly delayed
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(600, t + 0.05);
  osc2.frequency.exponentialRampToValueAtTime(1100, t + 0.13);
  gain2.gain.setValueAtTime(0.15, t + 0.05);
  gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
  osc2.connect(gain2);
  gain2.connect(getOutput());
  osc2.start(t + 0.05);
  osc2.stop(t + 0.18);
}

export function playCoin() {
  if (muted) return;
  const ctx = getCtx();
  const t = ctx.currentTime;

  // Bright chime — two quick rising tones
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, t);
  osc.frequency.setValueAtTime(1200, t + 0.06);
  gain.gain.setValueAtTime(0.2, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
  osc.connect(gain);
  gain.connect(getOutput());
  osc.start(t);
  osc.stop(t + 0.2);
}

export function playCoinCombo(multiplier) {
  if (muted) return;
  const ctx = getCtx();
  const t = ctx.currentTime;

  // Higher pitch with more multiplier — escalating reward
  const basePitch = 800 + multiplier * 150;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(basePitch, t);
  osc.frequency.setValueAtTime(basePitch + 400, t + 0.05);
  osc.frequency.setValueAtTime(basePitch + 600, t + 0.1);
  gain.gain.setValueAtTime(0.2, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
  osc.connect(gain);
  gain.connect(getOutput());
  osc.start(t);
  osc.stop(t + 0.25);
}

export function playShieldPickup() {
  if (muted) return;
  const ctx = getCtx();
  const t = ctx.currentTime;

  // Ascending arpeggio — feels "powered up"
  [0, 0.06, 0.12].forEach((offset, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400 + i * 200, t + offset);
    gain.gain.setValueAtTime(0.15, t + offset);
    gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.15);
    osc.connect(gain);
    gain.connect(getOutput());
    osc.start(t + offset);
    osc.stop(t + offset + 0.15);
  });
}

export function playShieldBreak() {
  if (muted) return;
  const ctx = getCtx();
  const t = ctx.currentTime;

  // Electric crackle
  const bufferSize = ctx.sampleRate * 0.2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 3000;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.25, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(getOutput());
  noise.start(t);
  noise.stop(t + 0.2);
}

export function playDeath() {
  if (muted) return;
  const ctx = getCtx();
  const t = ctx.currentTime;

  // Descending buzz + noise burst — impactful crash
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(400, t);
  osc.frequency.exponentialRampToValueAtTime(60, t + 0.5);
  gain.gain.setValueAtTime(0.2, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
  osc.connect(gain);
  gain.connect(getOutput());
  osc.start(t);
  osc.stop(t + 0.5);

  // Noise burst
  const bufferSize = ctx.sampleRate * 0.3;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.3, t);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  noise.connect(noiseGain);
  noiseGain.connect(getOutput());
  noise.start(t);
  noise.stop(t + 0.3);
}

export function playMilestone() {
  if (muted) return;
  const ctx = getCtx();
  const t = ctx.currentTime;

  // Power chord — triumphant quick stab
  [440, 554, 659].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc.connect(gain);
    gain.connect(getOutput());
    osc.start(t);
    osc.stop(t + 0.4);
  });
}

export function playLand() {
  if (muted) return;
  const ctx = getCtx();
  const t = ctx.currentTime;

  // Soft thud
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(120, t);
  osc.frequency.exponentialRampToValueAtTime(50, t + 0.08);
  gain.gain.setValueAtTime(0.12, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
  osc.connect(gain);
  gain.connect(getOutput());
  osc.start(t);
  osc.stop(t + 0.08);
}

export function playNewRecord() {
  if (muted) return;
  const ctx = getCtx();
  const t = ctx.currentTime;

  // Celebratory ascending fanfare
  const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t + i * 0.12);
    gain.gain.setValueAtTime(0.15, t + i * 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.3);
    osc.connect(gain);
    gain.connect(getOutput());
    osc.start(t + i * 0.12);
    osc.stop(t + i * 0.12 + 0.3);
  });
}

export function playUIClick() {
  if (muted) return;
  const ctx = getCtx();
  const t = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, t);
  gain.gain.setValueAtTime(0.1, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
  osc.connect(gain);
  gain.connect(getOutput());
  osc.start(t);
  osc.stop(t + 0.05);
}
