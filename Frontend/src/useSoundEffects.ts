import { useCallback, useRef } from 'react';

export function useSoundEffects() {
  const audioContextRef = useRef<AudioContext | null>(null);

  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  };

  const playHoverSound = useCallback(() => {
    initAudio();
    const ctx = audioContextRef.current;
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  }, []);

  const playClickSound = useCallback(() => {
    initAudio();
    const ctx = audioContextRef.current;
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.15);

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.02);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  }, []);

  // Hanoi: 3 sharp wooden clacks
  const playDiskSound = useCallback(() => {
    initAudio();
    const ctx = audioContextRef.current;
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    
    const clack = (time: number, freq: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);
      osc.frequency.exponentialRampToValueAtTime(100, time + 0.1);
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.3, time + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + 0.1);
    };

    clack(ctx.currentTime, 900);
    clack(ctx.currentTime + 0.15, 1200);
    clack(ctx.currentTime + 0.3, 700);
  }, []);

  // Frog: Advanced natural pond frog synth (Bandpass sweep + LFO pulse)
  const playFrogSound = useCallback(() => {
    initAudio();
    const ctx = audioContextRef.current;
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(60, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
    osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.2);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(300, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
    filter.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.25);
    filter.Q.value = 8;

    const lfo = ctx.createOscillator();
    lfo.type = 'square';
    lfo.frequency.value = 35;
    
    const lfoGain = ctx.createGain();
    lfo.connect(lfoGain.gain);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    osc.connect(filter);
    filter.connect(lfoGain);
    lfoGain.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    lfo.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
    lfo.stop(ctx.currentTime + 0.25);
  }, []);

  // Chess Queen: Heavy sliding noise + layered marble/wood clack
  const playChessSound = useCallback(() => {
    initAudio();
    const ctx = audioContextRef.current;
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    
    // Friction slide
    const slideOsc = ctx.createOscillator();
    const slideGain = ctx.createGain();
    slideOsc.type = 'sawtooth';
    slideOsc.frequency.setValueAtTime(80, ctx.currentTime);
    slideOsc.frequency.linearRampToValueAtTime(30, ctx.currentTime + 0.2);
    slideGain.gain.setValueAtTime(0, ctx.currentTime);
    slideGain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.05);
    slideGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
    slideOsc.connect(slideGain);
    slideGain.connect(ctx.destination);
    slideOsc.start();
    slideOsc.stop(ctx.currentTime + 0.2);

    // Heavy Thud (Wood)
    const clackOsc = ctx.createOscillator();
    const clackGain = ctx.createGain();
    clackOsc.type = 'square';
    clackOsc.frequency.setValueAtTime(150, ctx.currentTime + 0.15);
    clackOsc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.25);
    clackGain.gain.setValueAtTime(0, ctx.currentTime + 0.15);
    clackGain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.16);
    clackGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    
    // Sharp Clack (Marble/Glass tink)
    const tinkOsc = ctx.createOscillator();
    const tinkGain = ctx.createGain();
    tinkOsc.type = 'sine';
    tinkOsc.frequency.setValueAtTime(2000, ctx.currentTime + 0.15);
    tinkOsc.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.2);
    tinkGain.gain.setValueAtTime(0, ctx.currentTime + 0.15);
    tinkGain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.16);
    tinkGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    clackOsc.connect(clackGain);
    tinkOsc.connect(tinkGain);
    clackGain.connect(ctx.destination);
    tinkGain.connect(ctx.destination);
    
    clackOsc.start(ctx.currentTime + 0.15);
    tinkOsc.start(ctx.currentTime + 0.15);
    clackOsc.stop(ctx.currentTime + 0.35);
    tinkOsc.stop(ctx.currentTime + 0.25);
  }, []);

  // QuickSort: Fast fluid blips (arpeggio style)
  const playBarsSound = useCallback(() => {
    initAudio();
    const ctx = audioContextRef.current;
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    
    const freqs = [400, 600, 800, 1200];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      const startTime = ctx.currentTime + (i * 0.08);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.05, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.15);
    });
  }, []);

  return { playHoverSound, playClickSound, playDiskSound, playFrogSound, playChessSound, playBarsSound };
}