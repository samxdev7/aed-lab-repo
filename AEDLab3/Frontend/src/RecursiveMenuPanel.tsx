import React, { memo, useEffect, useRef, useState } from 'react';
import { useMouseParallax } from './useMouseParallax';
import { useSoundEffects } from './useSoundEffects';

/* ------------------------------------------------------------------ */
/*  Utilidades                                                         */
/* ------------------------------------------------------------------ */
const easeInOutCubic = (p: number) =>
  p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

/**
 * Programa eventos de sonido en bucle mientras `active` sea true.
 * Sirve para sincronizar sonidos con animaciones CSS.
 */
function useTimedEvents(
  active: boolean,
  period: number,
  events: { at: number; fn: () => void }[]
) {
  const ref = useRef(events);
  ref.current = events;
  useEffect(() => {
    if (!active) return;
    const timers: number[] = [];
    const run = () =>
      ref.current.forEach((e) => timers.push(window.setTimeout(e.fn, e.at)));
    run();
    const iv = window.setInterval(run, period);
    return () => {
      window.clearInterval(iv);
      timers.forEach(window.clearTimeout);
    };
  }, [active, period]);
}

/* ------------------------------------------------------------------ */
/*  TORRES DE HANOI (animación real, 3 discos, 7 movimientos x2)       */
/* ------------------------------------------------------------------ */
const PEG_X = [16, 32, 48];
const DISK_W = [18, 14, 10]; // 0 = grande, 2 = pequeño
const BASE_Y = 49;
const levelY = (level: number) => BASE_Y - level * 7;
const LIFT_Y = 7; // por encima de la punta del poste (y=18)
const HANOI_SLOT = 0.7; // segundos por movimiento

type HanoiSlot = {
  rest: { peg: number; level: number }[];
  move: null | { disk: number; from: number; to: number; fromLevel: number; toLevel: number };
};

const HANOI_TL: HanoiSlot[] = (() => {
  const pegs: number[][] = [[0, 1, 2], [], []];
  const slots: HanoiSlot[] = [];
  const snapshot = () => {
    const r: { peg: number; level: number }[] = [];
    pegs.forEach((stack, p) => stack.forEach((d, l) => (r[d] = { peg: p, level: l })));
    return r;
  };
  const solve = (n: number, from: number, to: number, via: number) => {
    if (n === 0) return;
    solve(n - 1, from, via, to);
    const rest = snapshot();
    const fromLevel = pegs[from].length - 1;
    const disk = pegs[from].pop()!;
    const toLevel = pegs[to].length;
    pegs[to].push(disk);
    slots.push({ rest, move: { disk, from, to, fromLevel, toLevel } });
    solve(n - 1, via, to, from);
  };
  solve(3, 0, 2, 1);
  slots.push({ rest: snapshot(), move: null }); // pausa
  solve(3, 2, 0, 1);
  slots.push({ rest: snapshot(), move: null }); // pausa
  return slots;
})();

const HanoiIcon = memo(
  ({ active, onLand }: { active: boolean; onLand: (pitch: number) => void }) => {
    const disks = useRef<(SVGGElement | null)[]>([]);
    const onLandRef = useRef(onLand);
    onLandRef.current = onLand;

    useEffect(() => {
      const setPose = (i: number, x: number, y: number) =>
        disks.current[i]?.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)})`);

      HANOI_TL[0].rest.forEach((r, i) => setPose(i, PEG_X[r.peg], levelY(r.level)));
      if (!active) return;

      let raf = 0;
      let fired = -1;
      const start = performance.now();

      const tick = (now: number) => {
        const elapsed = (now - start) / 1000;
        const abs = Math.floor(elapsed / HANOI_SLOT);
        const s = abs % HANOI_TL.length;
        const f = (elapsed - abs * HANOI_SLOT) / HANOI_SLOT;
        const { rest, move } = HANOI_TL[s];

        rest.forEach((r, i) => {
          let x = PEG_X[r.peg];
          let y = levelY(r.level);
          if (move && move.disk === i) {
            const fx = PEG_X[move.from];
            const tx = PEG_X[move.to];
            const fy = levelY(move.fromLevel);
            const ty = levelY(move.toLevel);
            if (f < 0.28) {
              // 1) sube por el poste
              x = fx;
              y = lerp(fy, LIFT_Y, easeInOutCubic(f / 0.28));
            } else if (f < 0.72) {
              // 2) cruza por encima
              x = lerp(fx, tx, easeInOutCubic((f - 0.28) / 0.44));
              y = LIFT_Y;
            } else {
              // 3) baja por el poste destino
              x = tx;
              y = lerp(LIFT_Y, ty, easeInOutCubic((f - 0.72) / 0.28));
            }
          }
          setPose(i, x, y);
        });

        if (move && f > 0.92 && fired !== abs) {
          fired = abs;
          onLandRef.current(0.8 + move.disk * 0.18);
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }, [active]);

    return (
      <svg
        viewBox="0 0 64 64"
        className="w-full h-full overflow-visible drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]"
      >
        <defs>
          {['#0891b2', '#22d3ee', '#a5f3fc'].map((c, i) => (
            <linearGradient key={i} id={`hg${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="0.35" stopColor={c} />
              <stop offset="1" stopColor={c} stopOpacity="0.7" />
            </linearGradient>
          ))}
        </defs>
        {/* Base */}
        <rect x="3" y="55" width="58" height="4" rx="2" fill="#0e7490" stroke="#67e8f9" strokeWidth="0.8" />
        {/* Postes */}
        {PEG_X.map((x) => (
          <g key={x}>
            <rect x={x - 1.3} y="18" width="2.6" height="38" rx="1.3" fill="#155e75" stroke="#22d3ee" strokeWidth="0.7" />
            <circle cx={x} cy="18" r="1.8" fill="#a5f3fc" />
          </g>
        ))}
        {/* Discos (grande -> pequeño) */}
        {DISK_W.map((w, i) => (
          <g
            key={i}
            ref={(el) => {
              disks.current[i] = el;
            }}
            transform={`translate(${PEG_X[0]} ${levelY(i)})`}
          >
            <rect x={-w / 2} y="0" width={w} height="6" rx="3" fill={`url(#hg${i})`} stroke="#ecfeff" strokeWidth="0.7" />
            <line x1={-w / 2 + 3} y1="1.6" x2={w / 2 - 3} y2="1.6" stroke="#fff" strokeOpacity="0.7" strokeWidth="0.8" strokeLinecap="round" />
          </g>
        ))}
      </svg>
    );
  }
);

/* ------------------------------------------------------------------ */
/*  SALTO DE LA RANA                                                   */
/* ------------------------------------------------------------------ */
const FrogIcon = memo(
  ({ active, onJump, onSplash }: { active: boolean; onJump: () => void; onSplash: () => void }) => {
    // Ciclo 3.2s: despegue ~11% (0.35s), aterrizajes en 41% (1.31s) y 91% (2.91s)
    useTimedEvents(active, 3200, [
      { at: 280, fn: onJump },
      { at: 1310, fn: onSplash },
      { at: 2910, fn: onSplash },
    ]);

    return (
      <svg
        viewBox="0 0 64 64"
        className={`w-full h-full overflow-visible drop-shadow-[0_0_8px_rgba(52,211,153,0.8)] ${active ? 'anim-on' : ''}`}
      >
        {/* Agua */}
        <path d="M 2 58 Q 8 56 14 58 T 26 58 T 38 58 T 50 58 T 62 58" fill="none" stroke="#34d399" strokeOpacity="0.35" strokeWidth="1" />
        {/* Nenúfares */}
        {[14, 50].map((cx) => (
          <g key={cx}>
            <ellipse cx={cx} cy="54" rx="13" ry="4.2" fill="#064e3b" stroke="#10b981" strokeWidth="1.2" />
            <path d={`M ${cx} 54 L ${cx + 9} 51.5`} stroke="#10b981" strokeOpacity="0.6" strokeWidth="0.8" />
            <ellipse cx={cx} cy="54" rx="9" ry="2.4" fill="none" stroke="#6ee7b7" strokeOpacity="0.25" strokeWidth="0.6" />
          </g>
        ))}
        {/* Ondas al aterrizar */}
        <ellipse className="ripple ripple-r" cx="50" cy="54" rx="12" ry="3.5" fill="none" stroke="#a7f3d0" strokeWidth="0.9" />
        <ellipse className="ripple ripple-l" cx="14" cy="54" rx="12" ry="3.5" fill="none" stroke="#a7f3d0" strokeWidth="0.9" />

        {/* Rana: X -> Y -> escala fija -> squash */}
        <g className="fr-x">
          <g className="fr-y">
            <g transform="translate(14 50) scale(0.62) translate(-32 -50)">
              <g className="fr-squash">
                <path d="M 24 44 C 12 36 10 48 14 52 C 16 54 22 52 26 50" fill="#059669" stroke="#6ee7b7" strokeWidth="1.6" />
                <path d="M 40 44 C 52 36 54 48 50 52 C 48 54 42 52 38 50" fill="#059669" stroke="#6ee7b7" strokeWidth="1.6" />
                <path d="M 14 52 L 10 54 M 14 52 L 14 56 M 50 52 L 54 54 M 50 52 L 50 56" stroke="#34d399" strokeWidth="1.4" strokeLinecap="round" fill="none" />
                <path d="M 32 32 C 20 32 20 48 32 50 C 44 48 44 32 32 32 Z" fill="#10b981" stroke="#a7f3d0" strokeWidth="1.6" />
                <ellipse cx="32" cy="43" rx="6" ry="5" fill="#6ee7b7" fillOpacity="0.35" />
                <circle cx="26" cy="30" r="5" fill="#059669" stroke="#6ee7b7" strokeWidth="1.6" />
                <circle cx="38" cy="30" r="5" fill="#059669" stroke="#6ee7b7" strokeWidth="1.6" />
                <circle cx="26" cy="29" r="2.2" fill="#fff" />
                <circle cx="38" cy="29" r="2.2" fill="#fff" />
                <circle cx="27" cy="28.4" r="1" fill="#022c22" />
                <circle cx="39" cy="28.4" r="1" fill="#022c22" />
                <path d="M 27 38 Q 32 42 37 38" fill="none" stroke="#022c22" strokeOpacity="0.6" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M 28 46 L 24 52 L 22 54 M 24 52 L 26 55 M 36 46 L 40 52 L 42 54 M 40 52 L 38 55" stroke="#6ee7b7" strokeWidth="2" strokeLinecap="round" fill="none" />
              </g>
            </g>
          </g>
        </g>
      </svg>
    );
  }
);

/* ------------------------------------------------------------------ */
/*  8 REINAS (tablero 4x4, reinas cayendo en posiciones válidas)       */
/* ------------------------------------------------------------------ */
const QUEEN_POS = [
  { r: 0, c: 1, d: 0 },
  { r: 1, c: 3, d: 0.7 },
  { r: 2, c: 0, d: 1.4 },
  { r: 3, c: 2, d: 2.1 },
];

const QueenIcon = memo(({ active, onDrop }: { active: boolean; onDrop: () => void }) => {
  // Aterriza al 7% de 4.8s (~0.34s) -> el sonido empieza antes para que el golpe coincida
  useTimedEvents(
    active,
    4800,
    QUEEN_POS.map((q) => ({ at: 220 + q.d * 1000, fn: onDrop }))
  );

  return (
    <svg
      viewBox="0 0 64 64"
      className={`w-full h-full overflow-visible drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] ${active ? 'anim-on' : ''}`}
    >
      {/* Tablero */}
      {Array.from({ length: 16 }).map((_, i) => {
        const r = Math.floor(i / 4);
        const c = i % 4;
        return (
          <rect
            key={i}
            x={8 + c * 12}
            y={8 + r * 12}
            width="12"
            height="12"
            fill={(r + c) % 2 ? 'rgba(168,85,247,0.34)' : 'rgba(216,180,254,0.10)'}
          />
        );
      })}
      <rect x="8" y="8" width="48" height="48" fill="none" stroke="#c084fc" strokeWidth="1.4" rx="1.5" />

      {QUEEN_POS.map((q) => {
        const cx = 8 + q.c * 12 + 6;
        const cy = 8 + q.r * 12 + 6;
        const delay = { ['--d' as string]: `${q.d}s` } as React.CSSProperties;
        return (
          <g key={`${q.r}${q.c}`} transform={`translate(${cx} ${cy})`}>
            <circle className="q-ring" r="4.5" fill="none" stroke="#e9d5ff" strokeWidth="0.9" style={delay} />
            <g className="q-piece" style={delay}>
              <path d="M -3.8 5.4 L 3.8 5.4 L 2.8 0.8 L -2.8 0.8 Z" fill="#a855f7" stroke="#e9d5ff" strokeWidth="0.7" />
              <path d="M -3 1.2 L -5 -3.4 L -2.4 -1 L 0 -4.6 L 2.4 -1 L 5 -3.4 L 3 1.2 Z" fill="#c084fc" stroke="#f3e8ff" strokeWidth="0.7" strokeLinejoin="round" />
              <circle cx="-5" cy="-3.8" r="0.9" fill="#fff" />
              <circle cx="0" cy="-4.9" r="1" fill="#fff" />
              <circle cx="5" cy="-3.8" r="0.9" fill="#fff" />
            </g>
          </g>
        );
      })}
    </svg>
  );
});

/* ------------------------------------------------------------------ */
/*  QUICKSORT (algoritmo real, pivote resaltado, swaps con salto)      */
/* ------------------------------------------------------------------ */
const QS_VALUES = [4, 2, 6, 1, 5, 3];
const QS_BW = 6;
const QS_GAP = 3.4;
const QS_X0 = (64 - (QS_VALUES.length * QS_BW + (QS_VALUES.length - 1) * QS_GAP)) / 2;
const qsX = (slot: number) => QS_X0 + slot * (QS_BW + QS_GAP);
const qsH = (v: number) => 6 * v + 4;
const QS_STEP = 0.6;
const QS_HOLD = 1.5;

const QS = (() => {
  const arr = QS_VALUES.map((_, i) => i); // slot -> id
  const steps: { a: number; b: number; pivot: number; before: number[] }[] = [];
  const swap = (a: number, b: number, pivot: number) => {
    if (a === b) return;
    steps.push({ a, b, pivot, before: [...arr] });
    [arr[a], arr[b]] = [arr[b], arr[a]];
  };
  const qs = (lo: number, hi: number) => {
    if (lo >= hi) return;
    const pivot = arr[hi];
    let i = lo;
    for (let j = lo; j < hi; j++) {
      if (QS_VALUES[arr[j]] < QS_VALUES[pivot]) {
        swap(i, j, pivot);
        i++;
      }
    }
    swap(i, hi, pivot);
    qs(lo, i - 1);
    qs(i + 1, hi);
  };
  qs(0, QS_VALUES.length - 1);
  return { steps, final: [...arr] };
})();

const QuickSortIcon = memo(({ active, onSwap }: { active: boolean; onSwap: (pitch: number) => void }) => {
  const bars = useRef<(SVGGElement | null)[]>([]);
  const rects = useRef<(SVGRectElement | null)[]>([]);
  const wrap = useRef<SVGGElement | null>(null);
  const onSwapRef = useRef(onSwap);
  onSwapRef.current = onSwap;

  useEffect(() => {
    const place = (id: number, x: number, y: number) =>
      bars.current[id]?.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)})`);
    const paint = (pivot: number, done: boolean) =>
      rects.current.forEach((r, id) => {
        if (!r) return;
        r.style.fill = id === pivot ? '#fff7d6' : '';
        r.style.stroke = id === pivot || done ? '#ffffff' : '';
        r.style.filter = id === pivot ? 'drop-shadow(0 0 3px #fff)' : done ? 'drop-shadow(0 0 2px #fde68a)' : '';
      });
    const reset = () => {
      QS_VALUES.forEach((_, id) => place(id, qsX(id), 0));
      paint(-1, false);
      if (wrap.current) wrap.current.style.opacity = '1';
    };
    reset();
    if (!active) return;

    const N = QS.steps.length;
    const cycle = N * QS_STEP + QS_HOLD;
    let raf = 0;
    let fired = -1;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = (now - start) / 1000;
      const cyc = Math.floor(elapsed / cycle);
      const t = elapsed - cyc * cycle;

      if (t < N * QS_STEP) {
        const idx = Math.floor(t / QS_STEP);
        const f = (t - idx * QS_STEP) / QS_STEP;
        const st = QS.steps[idx];
        const p = easeInOutCubic(f);
        const hop = Math.sin(Math.PI * f) * 8;
        st.before.forEach((id, slot) => {
          if (slot === st.a) place(id, lerp(qsX(st.a), qsX(st.b), p), -hop);
          else if (slot === st.b) place(id, lerp(qsX(st.b), qsX(st.a), p), 0);
          else place(id, qsX(slot), 0);
        });
        paint(st.pivot, false);
        const key = cyc * 100 + idx;
        if (f > 0.5 && fired !== key) {
          fired = key;
          onSwapRef.current(0.8 + QS_VALUES[st.before[st.a]] * 0.12);
        }
      } else {
        QS.final.forEach((id, slot) => place(id, qsX(slot), 0));
        paint(-1, true);
      }

      // Fade suave al reiniciar
      if (wrap.current) {
        const h = t - N * QS_STEP;
        let o = 1;
        if (h > QS_HOLD - 0.35) o = 1 - (h - (QS_HOLD - 0.35)) / 0.35;
        else if (t < 0.35) o = t / 0.35;
        wrap.current.style.opacity = String(Math.max(0, Math.min(1, o)));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  return (
    <svg viewBox="0 0 64 64" className="w-full h-full overflow-visible drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]">
      <defs>
        <linearGradient id="qs-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fde68a" />
          <stop offset="0.5" stopColor="#f59e0b" />
          <stop offset="1" stopColor="#b45309" />
        </linearGradient>
      </defs>
      <rect x="3" y="56" width="58" height="3" rx="1.5" fill="#b45309" stroke="#fcd34d" strokeWidth="0.6" />
      <g ref={wrap}>
        {QS_VALUES.map((v, id) => (
          <g
            key={id}
            ref={(el) => {
              bars.current[id] = el;
            }}
            transform={`translate(${qsX(id)} 0)`}
          >
            <rect
              ref={(el) => {
                rects.current[id] = el;
              }}
              x="0"
              y={56 - qsH(v)}
              width={QS_BW}
              height={qsH(v)}
              rx="1.5"
              fill="url(#qs-grad)"
              stroke="#fef3c7"
              strokeWidth="0.8"
            />
          </g>
        ))}
      </g>
    </svg>
  );
});

/* ------------------------------------------------------------------ */
/*  PANEL                                                              */
/* ------------------------------------------------------------------ */
interface RecursiveMenuPanelProps {
  onBack: () => void;
  onSelectHanoi: () => void;
  onSelectFrog: () => void;
  onSelectQueens: () => void;
  onSelectQuickSort: () => void;
}

export const RecursiveMenuPanel: React.FC<RecursiveMenuPanelProps> = ({
  onBack,
  onSelectHanoi,
  onSelectFrog,
  onSelectQueens,
  onSelectQuickSort,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const parallax = useMouseParallax(12);
  const [hovered, setHovered] = useState<number | null>(null);
  const { playHoverSound, playClickSound, playDiskSound, playFrogSound, playSplashSound, playChessSound, playBarsSound } =
    useSoundEffects();

  const handleAction = (action: () => void) => {
    playClickSound();
    action();
  };

  // Fondo dinámico de nodos
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const particles = Array.from({ length: 45 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      size: Math.random() * 2 + 1,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(168, 85, 247, 0.4)';
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(99, 102, 241, ${1 - dist / 130})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const exercises = [
    {
      title: 'Torres de Hanoi',
      tag: '01',
      render: (active: boolean) => <HanoiIcon active={active} onLand={playDiskSound} />,
      onClick: () => handleAction(onSelectHanoi),
      badgeBg: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
      accentGlow: 'shadow-[0_0_35px_rgba(34,211,238,0.2)] hover:shadow-[0_0_55px_rgba(34,211,238,0.45)]',
      borderColor: 'border-cyan-500/40 hover:border-cyan-300',
      dotColor: 'bg-cyan-400 shadow-[0_0_12px_#22d3ee]',
      imgBg: 'bg-cyan-500/10 border-cyan-500/30 group-hover:bg-cyan-500/20',
      titleColor: 'text-cyan-200 group-hover:text-cyan-100',
    },
    {
      title: 'Salto de la Rana',
      tag: '02',
      render: (active: boolean) => <FrogIcon active={active} onJump={playFrogSound} onSplash={playSplashSound} />,
      onClick: () => handleAction(onSelectFrog),
      badgeBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
      accentGlow: 'shadow-[0_0_35px_rgba(52,211,153,0.2)] hover:shadow-[0_0_55px_rgba(52,211,153,0.45)]',
      borderColor: 'border-emerald-500/40 hover:border-emerald-300',
      dotColor: 'bg-emerald-400 shadow-[0_0_12px_#34d399]',
      imgBg: 'bg-emerald-500/10 border-emerald-500/30 group-hover:bg-emerald-500/20',
      titleColor: 'text-emerald-200 group-hover:text-emerald-100',
    },
    {
      title: '8 Reinas',
      tag: '03',
      render: (active: boolean) => <QueenIcon active={active} onDrop={playChessSound} />,
      onClick: () => handleAction(onSelectQueens),
      badgeBg: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
      accentGlow: 'shadow-[0_0_35px_rgba(168,85,247,0.2)] hover:shadow-[0_0_55px_rgba(168,85,247,0.45)]',
      borderColor: 'border-purple-500/40 hover:border-purple-300',
      dotColor: 'bg-purple-400 shadow-[0_0_12px_#a855f7]',
      imgBg: 'bg-purple-500/10 border-purple-500/30 group-hover:bg-purple-500/20',
      titleColor: 'text-purple-200 group-hover:text-purple-100',
    },
    {
      title: 'Ordenamiento Rápido',
      tag: '04',
      render: (active: boolean) => <QuickSortIcon active={active} onSwap={playBarsSound} />,
      onClick: () => handleAction(onSelectQuickSort),
      badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
      accentGlow: 'shadow-[0_0_35px_rgba(251,191,36,0.2)] hover:shadow-[0_0_55px_rgba(251,191,36,0.45)]',
      borderColor: 'border-amber-500/40 hover:border-amber-300',
      dotColor: 'bg-amber-400 shadow-[0_0_12px_#fbbf24]',
      imgBg: 'bg-amber-500/10 border-amber-500/30 group-hover:bg-amber-500/20',
      titleColor: 'text-amber-200 group-hover:text-amber-100',
    },
  ];

  return (
        <div className="relative h-[100dvh] w-screen bg-[#090b16] text-white flex flex-col justify-between gap-2 p-3 sm:p-4 overflow-hidden select-none">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap');

          .font-tech-header { font-family: 'Rajdhani', sans-serif; letter-spacing: 0.08em; }
          .font-tech-body { font-family: 'Plus Jakarta Sans', sans-serif; }

          /* ---------- RANA ---------- */
          .fr-squash { transform-box: fill-box; transform-origin: 50% 100%; }
          .anim-on .fr-x { animation: frog-x 3.2s linear infinite; }
          .anim-on .fr-y { animation: frog-y 3.2s linear infinite; }
          .anim-on .fr-squash { animation: frog-squash 3.2s ease-in-out infinite; }
          .ripple { transform-box: fill-box; transform-origin: 50% 50%; opacity: 0; }
          .anim-on .ripple-r { animation: ripple-r 3.2s ease-out infinite; }
          .anim-on .ripple-l { animation: ripple-l 3.2s ease-out infinite; }

          @keyframes frog-x {
            0%, 11% { transform: translateX(0); }
            41%, 61% { transform: translateX(36px); }
            91%, 100% { transform: translateX(0); }
          }
          @keyframes frog-y {
            0% { transform: translateY(0); }
            11% { transform: translateY(0); animation-timing-function: cubic-bezier(.2,.75,.4,1); }
            26% { transform: translateY(-22px); animation-timing-function: cubic-bezier(.6,0,.8,.25); }
            41% { transform: translateY(0); }
            61% { transform: translateY(0); animation-timing-function: cubic-bezier(.2,.75,.4,1); }
            76% { transform: translateY(-22px); animation-timing-function: cubic-bezier(.6,0,.8,.25); }
            91%, 100% { transform: translateY(0); }
          }
          @keyframes frog-squash {
            0%, 100% { transform: scale(1, 1); }
            5% { transform: scale(1.12, 0.84); }
            11% { transform: scale(0.9, 1.2); }
            20% { transform: scale(0.94, 1.1); }
            26% { transform: scale(1, 1); }
            36% { transform: scale(0.96, 1.06); }
            41% { transform: scale(1.18, 0.78); }
            46% { transform: scale(0.97, 1.05); }
            50% { transform: scale(1, 1); }
            55% { transform: scale(1.12, 0.84); }
            61% { transform: scale(0.9, 1.2); }
            70% { transform: scale(0.94, 1.1); }
            76% { transform: scale(1, 1); }
            86% { transform: scale(0.96, 1.06); }
            91% { transform: scale(1.18, 0.78); }
            96% { transform: scale(0.97, 1.05); }
          }
          @keyframes ripple-r {
            0%, 40% { opacity: 0; transform: scale(0.4); }
            41% { opacity: 0.95; transform: scale(0.5); }
            62% { opacity: 0; transform: scale(1.7); }
            100% { opacity: 0; transform: scale(1.7); }
          }
          @keyframes ripple-l {
            0%, 90% { opacity: 0; transform: scale(0.4); }
            91% { opacity: 0.95; transform: scale(0.5); }
            100% { opacity: 0; transform: scale(1.5); }
          }

          /* ---------- REINAS ---------- */
          .q-piece { transform-box: fill-box; transform-origin: 50% 100%; }
          .q-ring { transform-box: fill-box; transform-origin: 50% 50%; opacity: 0; }
          .anim-on .q-piece { animation: queen-drop 4.8s cubic-bezier(.3,0,.3,1) infinite both; animation-delay: var(--d); }
          .anim-on .q-ring { animation: queen-ring 4.8s ease-out infinite both; animation-delay: var(--d); }

          @keyframes queen-drop {
            0% { opacity: 0; transform: translateY(-18px) scale(1.25); }
            7% { opacity: 1; transform: translateY(0) scale(1.18, 0.82); }
            11% { transform: translateY(-1.5px) scale(0.96, 1.06); }
            15% { transform: translateY(0) scale(1); }
            84% { opacity: 1; transform: translateY(0) scale(1); }
            100% { opacity: 0; transform: translateY(0) scale(0.6); }
          }
          @keyframes queen-ring {
            0%, 6% { opacity: 0; transform: scale(0.4); }
            7% { opacity: 0.95; transform: scale(0.5); }
            24% { opacity: 0; transform: scale(2.2); }
            100% { opacity: 0; transform: scale(2.2); }
          }

          @media (prefers-reduced-motion: reduce) {
            .anim-on * { animation: none !important; }
          }
        `}
      </style>

      <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none opacity-60" />

      <div
        className="fixed -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-indigo-600/15 rounded-full blur-[160px] pointer-events-none"
        style={{ transform: `translate3d(${parallax.x * 0.5}px, ${parallax.y * 0.5}px, 0)` }}
      />
      <div
        className="fixed -bottom-28 -left-28 w-[500px] h-[500px] bg-purple-700/20 rounded-full blur-[150px] pointer-events-none"
        style={{ transform: `translate3d(${parallax.x * 0.8}px, ${parallax.y * 0.8}px, 0)` }}
      />
      <div
        className="fixed -bottom-28 -right-28 w-[500px] h-[500px] bg-cyan-600/20 rounded-full blur-[150px] pointer-events-none"
        style={{ transform: `translate3d(${parallax.x * -0.6}px, ${parallax.y * -0.6}px, 0)` }}
      />

      <div
        className="fixed top-12 left-10 w-32 h-32 opacity-15 pointer-events-none hidden lg:block"
        style={{
          backgroundImage: `radial-gradient(#ffffff 2px, transparent 2px)`,
          backgroundSize: '14px 14px',
          transform: `translate3d(${parallax.x * -1}px, ${parallax.y * -1}px, 0)`,
        }}
      />
      <div
        className="fixed top-12 right-10 w-32 h-32 opacity-15 pointer-events-none hidden lg:block"
        style={{
          backgroundImage: `radial-gradient(#ffffff 2px, transparent 2px)`,
          backgroundSize: '14px 14px',
          transform: `translate3d(${parallax.x}px, ${parallax.y}px, 0)`,
        }}
      />

      <header
        className="relative z-10 shrink-0 text-center mt-0 space-y-1 sm:space-y-2 font-tech-body"
        style={{ transform: `translate3d(${parallax.x * 0.3}px, ${parallax.y * 0.3}px, 0)` }}
      >
        <h1 className="font-tech-header text-xl sm:text-2xl md:text-3xl font-extrabold uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-purple-300 drop-shadow-[0_0_25px_rgba(168,85,247,0.5)]">
          Laboratorio #3: Algoritmos Recursivos
        </h1>

        <div className="flex items-center justify-center gap-3 text-purple-200/90 text-sm sm:text-lg font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span className="h-[1px] w-10 sm:w-24 bg-gradient-to-r from-transparent to-cyan-400" />
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
          </div>
          <span className="tracking-wide font-bold text-slate-200 uppercase text-xs sm:text-base">
            Selecciona un ejercicio
          </span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_10px_#c084fc]" />
            <span className="h-[1px] w-10 sm:w-24 bg-gradient-to-l from-transparent to-purple-400" />
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
          </div>
        </div>
      </header>

      <main
        className="relative z-10 max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 my-auto py-2 font-tech-body"
        style={{ transform: `translate3d(${parallax.x * 0.6}px, ${parallax.y * 0.6}px, 0)` }}
      >
        {exercises.map((item, index) => (
          <button
            key={index}
            onClick={item.onClick}
            onMouseEnter={() => {
              setHovered(index);
              playHoverSound();
            }}
            onMouseLeave={() => setHovered(null)}
            onFocus={() => setHovered(index)}
            onBlur={() => setHovered(null)}
            className={`group relative bg-[#0f1426]/85 backdrop-blur-xl border ${item.borderColor} ${item.accentGlow} rounded-2xl p-3 flex flex-col items-center justify-center text-center transition-all duration-300 hover:-translate-y-2 cursor-pointer min-h-[140px] min-h-0 h-full`}
          >
            <span className={`absolute top-3 right-3 w-2.5 h-2.5 rounded-full ${item.dotColor} group-hover:scale-125 transition-transform duration-300`} />

            <span className={`absolute top-3 left-3 px-2 py-1 rounded-md text-xs sm:text-sm font-bold tracking-wider uppercase border ${item.badgeBg} font-tech-header`}>
              {item.tag}
            </span>

            <div className={`w-[min(5rem,11dvh)] h-[min(5rem,11dvh)] rounded-xl ${item.imgBg} border flex items-center justify-center mb-1 p-2 transition-all duration-300 mt-2`}>
              {item.render(hovered === index)}
            </div>

            <h2 className={`font-tech-header text-base sm:text-lg lg:text-xl font-extrabold uppercase tracking-wide transition-colors ${item.titleColor} mt-1`}>
              {item.title}
            </h2>
          </button>
        ))}
      </main>

      <footer
        className="relative z-10 shrink-0 flex justify-start p-1 font-tech-body"
        style={{ transform: `translate3d(${parallax.x * 0.4}px, ${parallax.y * 0.4}px, 0)` }}
      >
        <button
          onClick={() => handleAction(onBack)}
          onMouseEnter={playHoverSound}
          className="relative inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-[length:200%_auto] hover:bg-right shadow-lg shadow-indigo-600/40 hover:shadow-purple-500/70 hover:-translate-y-1 active:translate-y-0 active:scale-95 transition-all duration-300 group cursor-pointer border border-indigo-300/30"
        >
          <svg className="w-4 h-4 transform group-hover:-translate-x-1.5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="font-tech-header text-sm tracking-wider">Atrás</span>
        </button>
      </footer>
    </div>
  );
};