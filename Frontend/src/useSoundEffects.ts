import { useCallback, useRef } from 'react';

type Engine = { ctx: AudioContext; out: AudioNode; noise: AudioBuffer };

/* ---------- Helpers de síntesis ---------- */
function env(g: GainNode, t: number, peak: number, attack: number, dur: number) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
}

function tone(
  e: Engine,
  type: OscillatorType,
  f0: number,
  f1: number,
  t: number,
  dur: number,
  peak: number,
  attack = 0.005
) {
  const o = e.ctx.createOscillator();
  const g = e.ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  env(g, t, peak, attack, dur);
  o.connect(g);
  g.connect(e.out);
  o.start(t);
  o.stop(t + dur + 0.03);
}

function noiseBurst(
  e: Engine,
  t: number,
  dur: number,
  peak: number,
  ftype: BiquadFilterType,
  f0: number,
  f1: number,
  q: number,
  attack = 0.003
) {
  const src = e.ctx.createBufferSource();
  src.buffer = e.noise;
  const filt = e.ctx.createBiquadFilter();
  filt.type = ftype;
  filt.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) filt.frequency.exponentialRampToValueAtTime(f1, t + dur);
  filt.Q.value = q;
  const g = e.ctx.createGain();
  env(g, t, peak, attack, dur);
  src.connect(filt);
  filt.connect(g);
  g.connect(e.out);
  src.start(t, Math.random() * 0.5);
  src.stop(t + dur + 0.03);
}

/** Un "croar" de rana: diente de sierra con pulsos rápidos (AM) + formantes */
function croak(e: Engine, t: number, f0: number, f1: number, dur: number, peak: number) {
  const { ctx } = e;
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(f0, t);
  osc.frequency.linearRampToValueAtTime(f1, t + dur);

  // Modulación de amplitud: da la textura "rrrr" de garganta
  const am = ctx.createGain();
  am.gain.value = 0.5;
  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 48;
  const depth = ctx.createGain();
  depth.gain.value = 0.5;
  lfo.connect(depth);
  depth.connect(am.gain);

  // Dos formantes (cuerpo y nasalidad)
  const f1n = ctx.createBiquadFilter();
  f1n.type = 'bandpass';
  f1n.frequency.value = 550;
  f1n.Q.value = 4;
  const f2n = ctx.createBiquadFilter();
  f2n.type = 'bandpass';
  f2n.frequency.value = 1700;
  f2n.Q.value = 6;
  const g1 = ctx.createGain();
  g1.gain.value = 1;
  const g2 = ctx.createGain();
  g2.gain.value = 0.35;

  const master = ctx.createGain();
  env(master, t, peak, 0.02, dur);

  osc.connect(am);
  am.connect(f1n);
  am.connect(f2n);
  f1n.connect(g1);
  f2n.connect(g2);
  g1.connect(master);
  g2.connect(master);
  master.connect(e.out);

  osc.start(t);
  lfo.start(t);
  osc.stop(t + dur + 0.03);
  lfo.stop(t + dur + 0.03);
}

/** Nota tipo marimba: fundamental + armónicos que se apagan rápido */
function pluck(e: Engine, f: number, t: number, dur: number, peak: number) {
  tone(e, 'sine', f, f, t, dur, peak, 0.003);
  tone(e, 'sine', f * 2, f * 2, t, dur * 0.5, peak * 0.35, 0.003);
  tone(e, 'triangle', f * 4, f * 4, t, dur * 0.15, peak * 0.15, 0.002);
}

export function useSoundEffects() {
  const engineRef = useRef<Engine | null>(null);

  const ensure = useCallback((): Engine | null => {
    try {
      if (!engineRef.current) {
        const Ctor = window.AudioContext || (window as any).webkitAudioContext;
        const ctx: AudioContext = new Ctor();
        const comp = ctx.createDynamicsCompressor();
        const master = ctx.createGain();
        master.gain.value = 0.9;
        master.connect(comp);
        comp.connect(ctx.destination);

        const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

        engineRef.current = { ctx, out: master, noise: buf };
      }
      const e = engineRef.current;
      if (e.ctx.state === 'suspended') e.ctx.resume();
      return e;
    } catch {
      return null;
    }
  }, []);

  // Hover: tick suave y limpio
  const playHoverSound = useCallback(() => {
    const e = ensure();
    if (!e) return;
    const t = e.ctx.currentTime + 0.005;
    tone(e, 'sine', 520, 760, t, 0.09, 0.05, 0.01);
  }, [ensure]);

  // Click (Atrás / Siguiente): pop suave + campanita de cristal
  const playClickSound = useCallback(() => {
    const e = ensure();
    if (!e) return;
    const t = e.ctx.currentTime + 0.005;
    tone(e, 'sine', 620, 980, t, 0.08, 0.12, 0.004); // pop ascendente
    tone(e, 'sine', 1318, 1318, t + 0.035, 0.28, 0.07, 0.004); // campana (Mi)
    tone(e, 'sine', 1975, 1975, t + 0.055, 0.24, 0.045, 0.004); // armónico brillante (Si)
    tone(e, 'sine', 2637, 2637, t + 0.075, 0.2, 0.02, 0.004); // brillo final
  }, [ensure]);

  // Hanoi: "tock" de madera al aterrizar un disco (pitch según el tamaño del disco)
  const playDiskSound = useCallback(
    (pitch: number | unknown = 1) => {
      const e = ensure();
      if (!e) return;
      const p = typeof pitch === 'number' ? pitch : 1;
      const t = e.ctx.currentTime + 0.005;
      tone(e, 'sine', 260 * p, 110 * p, t, 0.1, 0.38, 0.003); // cuerpo
      tone(e, 'triangle', 720 * p, 300 * p, t, 0.05, 0.16, 0.002); // ataque
      tone(e, 'sine', 540 * p, 520 * p, t, 0.18, 0.05, 0.004); // resonancia
      noiseBurst(e, t, 0.04, 0.22, 'bandpass', 2200 * p, 1500 * p, 3); // golpe seco
    },
    [ensure]
  );

  // Rana: "rib-bit" natural
  const playFrogSound = useCallback(() => {
    const e = ensure();
    if (!e) return;
    const t = e.ctx.currentTime + 0.005;
    croak(e, t, 95, 130, 0.12, 0.55); // rib
    croak(e, t + 0.15, 120, 175, 0.18, 0.6); // bit
  }, [ensure]);

  // Rana: chapoteo al aterrizar en el nenúfar
  const playSplashSound = useCallback(() => {
    const e = ensure();
    if (!e) return;
    const t = e.ctx.currentTime + 0.005;
    noiseBurst(e, t, 0.2, 0.13, 'bandpass', 1400, 600, 1.2, 0.01);
    tone(e, 'sine', 420, 950, t + 0.02, 0.09, 0.1, 0.01); // burbuja 1
    tone(e, 'sine', 620, 1350, t + 0.07, 0.08, 0.07, 0.01); // burbuja 2
  }, [ensure]);

  // Reina: deslizamiento corto + golpe de mármol/madera
  const playChessSound = useCallback(() => {
    const e = ensure();
    if (!e) return;
    const t = e.ctx.currentTime + 0.005;
    noiseBurst(e, t, 0.12, 0.05, 'bandpass', 500, 250, 1.5, 0.03); // fricción
    const t2 = t + 0.12;
    tone(e, 'sine', 180, 70, t2, 0.14, 0.42, 0.003); // golpe pesado
    noiseBurst(e, t2, 0.03, 0.2, 'bandpass', 3200, 2500, 2); // clac seco
    tone(e, 'sine', 1900, 900, t2, 0.1, 0.12, 0.002); // tink de mármol
  }, [ensure]);

  // QuickSort: pluck doble rápido al intercambiar barras (pitch según altura)
  const playBarsSound = useCallback(
    (pitch: number | unknown = 1) => {
      const e = ensure();
      if (!e) return;
      const p = typeof pitch === 'number' ? pitch : 1;
      const t = e.ctx.currentTime + 0.005;
      const f = 480 * p;
      tone(e, 'triangle', f, f * 0.98, t, 0.13, 0.11, 0.004);
      tone(e, 'sine', f * 1.5, f * 1.5, t + 0.06, 0.14, 0.08, 0.004);
      noiseBurst(e, t, 0.02, 0.03, 'highpass', 5000, 5000, 0.7);
    },
    [ensure]
  );

  // QuickSort & General: Parametric synth beep/tone using the shared AudioContext
  const playTone = useCallback((
    freq: number, 
    type: OscillatorType = 'sine', 
    duration: number = 0.1, 
    vol: number = 0.1
  ) => {
    const e = ensure();
    if (!e) return;
    const ctx = e.ctx;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(Math.max(20, freq), now);

      const safeVol = Math.max(0.0001, vol);
      const safeDuration = Math.max(0.02, duration);

      gain.gain.setValueAtTime(safeVol, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + safeDuration);

      osc.connect(gain);
      gain.connect(e.out);

      osc.start(now);
      osc.stop(now + safeDuration);
    } catch (e) {
      console.warn("Audio playback issue:", e);
    }
  }, [ensure]);

    // Pila: Push (el bloque aterriza: golpe grave + ping metálico suave)
  const playStackPush = useCallback(() => {
    const e = ensure();
    if (!e) return;
    const t = e.ctx.currentTime + 0.005;
    tone(e, 'sine', 190, 80, t, 0.14, 0.34, 0.002); // golpe grave
    tone(e, 'triangle', 520, 260, t, 0.05, 0.1, 0.002); // toc seco
    noiseBurst(e, t, 0.035, 0.14, 'bandpass', 1800, 900, 2); // contacto
    tone(e, 'sine', 1480, 1480, t + 0.01, 0.16, 0.035, 0.003); // ping metálico
  }, [ensure]);

  // Pila: Pop (el bloque se levanta: whoosh ascendente suave)
  const playStackPop = useCallback(() => {
    const e = ensure();
    if (!e) return;
    const t = e.ctx.currentTime + 0.005;
    noiseBurst(e, t, 0.12, 0.07, 'bandpass', 600, 2600, 1.4, 0.02); // succión
    tone(e, 'sine', 330, 660, t, 0.12, 0.12, 0.01);
    tone(e, 'sine', 990, 990, t + 0.07, 0.12, 0.04, 0.004);
  }, [ensure]);

  // Cola Circular: enqueue (escala pentatónica ascendente según la entrada)
  const playCircularStep = useCallback(
    (step: number = 0) => {
      const e = ensure();
      if (!e) return;
      const t = e.ctx.currentTime + 0.005;
      const scale = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];
      pluck(e, scale[step % scale.length], t, 0.3, 0.16);
      noiseBurst(e, t, 0.015, 0.03, 'highpass', 6000, 6000, 1.0);
    },
    [ensure]
  );

  // Cola Circular: dequeue (dos notas que bajan)
  const playCircularDequeue = useCallback(() => {
    const e = ensure();
    if (!e) return;
    const t = e.ctx.currentTime + 0.005;
    pluck(e, 783.99, t, 0.22, 0.11);
    pluck(e, 587.33, t + 0.07, 0.28, 0.1);
  }, [ensure]);

  // Cola Lineal: enqueue (entra deslizando y se asienta)
  const playQueueSlide = useCallback(() => {
    const e = ensure();
    if (!e) return;
    const t = e.ctx.currentTime + 0.005;
    noiseBurst(e, t, 0.1, 0.05, 'bandpass', 900, 1800, 1.4, 0.02);
    tone(e, 'triangle', 300, 450, t, 0.1, 0.1, 0.005);
    pluck(e, 680, t + 0.09, 0.2, 0.09); // se asienta
  }, [ensure]);

  // Cola Lineal: dequeue (sale hacia la derecha: whoosh descendente)
  const playQueueOut = useCallback(() => {
    const e = ensure();
    if (!e) return;
    const t = e.ctx.currentTime + 0.005;
    noiseBurst(e, t, 0.14, 0.06, 'bandpass', 2400, 700, 1.2, 0.015);
    tone(e, 'sine', 620, 300, t, 0.14, 0.1, 0.005);
  }, [ensure]);

  // Notación Polaca: resultado calculado (arpegio brillante + nota grave de fondo)
  const playPolishEval = useCallback(() => {
    const e = ensure();
    if (!e) return;
    const t = e.ctx.currentTime + 0.005;
    tone(e, 'sine', 261.63, 261.63, t, 0.4, 0.08, 0.01); // base grave
    pluck(e, 523.25, t, 0.25, 0.14);
    pluck(e, 783.99, t + 0.07, 0.25, 0.13);
    pluck(e, 1046.5, t + 0.14, 0.4, 0.15);
    noiseBurst(e, t + 0.14, 0.12, 0.03, 'highpass', 7000, 7000, 1.0, 0.01); // brillo
  }, [ensure]);

  return { 
    playHoverSound, 
    playClickSound, 
    playDiskSound, 
    playFrogSound, 
    playSplashSound, 
    playChessSound, 
    playBarsSound, 
    playTone,
    playStackPush,
    playStackPop,
    playCircularStep,
    playCircularDequeue,
    playQueueSlide,
    playQueueOut,
    playPolishEval,
    initAudio: ensure
  };
}