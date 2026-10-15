import React, { memo, useEffect, useRef, useState } from 'react';
import { useMouseParallax } from './useMouseParallax';
import { useSoundEffects } from './useSoundEffects';

/* ------------------------------------------------------------------ */
/*  Utilidades Matemáticas de Interpolación                           */
/* ------------------------------------------------------------------ */
const easeInOutCubic = (p: number) =>
  p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;

const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

const clamp01 = (p: number) => Math.min(1, Math.max(0, p));

const easeOutBack = (p: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
};

type RGB = [number, number, number];
const mixColor = (a: RGB, b: RGB, p: number) =>
  `rgb(${Math.round(lerp(a[0], b[0], p))},${Math.round(lerp(a[1], b[1], p))},${Math.round(lerp(a[2], b[2], p))})`;

/* ------------------------------------------------------------------ */
/*  01. PILAS (STACK - LIFO)                                           */
/*  Simulación algorítmica real paso a paso:                         */
/*  Push(A) -> Push(B) -> Push(C) -> Pop() -> Pop()                   */
/* ------------------------------------------------------------------ */
const STACK_SLOT_Y = [44, 34, 24]; // Ranuras 0, 1, 2
const STACK_LIFT_Y = -4;           // Por aquí entran y salen los bloques
const STACK_CYCLE = 4.6;           // Duración total del ciclo (s)
const STACK_POP_AT = [1.5, 1.0, 0.5];   // El bloque 2 sale primero (LIFO)
const STACK_PUSH_AT = [2.4, 2.9, 3.4];  // El bloque 0 entra primero
const STACK_POP_DUR = 0.45;
const STACK_PUSH_DUR = 0.45;

const StackIcon = memo(
  ({
    active,
    onPush,
    onPop,
  }: {
    active: boolean;
    onPush: () => void;
    onPop: () => void;
  }) => {
    const blocksRef = useRef<(SVGGElement | null)[]>([]);
    const topArrowRef = useRef<SVGPathElement | null>(null);
    const onPushRef = useRef(onPush);
    const onPopRef = useRef(onPop);
    onPushRef.current = onPush;
    onPopRef.current = onPop;

        useEffect(() => {
      const setBlock = (id: number, y: number, op: number, sy: number) => {
        const el = blocksRef.current[id];
        if (!el) return;
        const sx = 1 + (1 - sy) * 0.6;
        el.setAttribute(
          'transform',
          `translate(18 ${y.toFixed(2)}) translate(14 8.5) scale(${sx.toFixed(3)} ${sy.toFixed(3)}) translate(-14 -8.5)`
        );
        el.setAttribute('opacity', op.toFixed(2));
      };

      const draw = (t: number) => {
        let count = 0; // cuántos bloques hay en la pila (continuo)
        [0, 1, 2].forEach((id) => {
          const slotY = STACK_SLOT_Y[id];
          const popEnd = STACK_POP_AT[id] + STACK_POP_DUR;
          const pushEnd = STACK_PUSH_AT[id] + STACK_PUSH_DUR;
          let y = slotY;
          let op = 1;
          let sy = 1;
          let presence = 1;

          if (t < STACK_POP_AT[id]) {
            // Quieto en su ranura
          } else if (t < popEnd) {
            const p = (t - STACK_POP_AT[id]) / STACK_POP_DUR;
            const e = easeInOutCubic(p);
            y = lerp(slotY, STACK_LIFT_Y, e);
            op = 1 - p;
            presence = 1 - e;
          } else if (t < STACK_PUSH_AT[id]) {
            op = 0;
            presence = 0;
          } else if (t < pushEnd) {
            const p = (t - STACK_PUSH_AT[id]) / STACK_PUSH_DUR;
            y = lerp(STACK_LIFT_Y, slotY, p * p); // cae acelerando
            op = Math.min(1, p * 4);
            presence = p;
          } else {
            // Rebote amortiguado al aterrizar
            const ts = t - pushEnd;
            sy = 1 - 0.18 * Math.exp(-ts * 9) * Math.cos(ts * 26);
          }

          count += presence;
          setBlock(id, y, op, sy);
        });

        if (topArrowRef.current) {
          const topY = STACK_SLOT_Y[0] - (Math.max(count, 1) - 1) * 10;
          topArrowRef.current.setAttribute('transform', `translate(0 ${(topY + 4.5).toFixed(2)})`);
          topArrowRef.current.setAttribute('opacity', Math.min(1, count).toFixed(2));
        }
      };

      // Estado normal = inicio de la animación (pila llena)
      if (!active) {
        draw(0);
        return;
      }

      let raf = 0;
      let lastCyc = -1;
      const fired = new Set<string>();
      const start = performance.now();

      const tick = (now: number) => {
        const elapsed = (now - start) / 1000;
        const cyc = Math.floor(elapsed / STACK_CYCLE);
        const t = elapsed - cyc * STACK_CYCLE;
        if (cyc !== lastCyc) {
          lastCyc = cyc;
          fired.clear();
        }

        draw(t);

        [0, 1, 2].forEach((id) => {
          const popKey = `pop-${id}`;
          const pushKey = `push-${id}`;
          if (t >= STACK_POP_AT[id] + 0.07 && !fired.has(popKey)) {
            fired.add(popKey);
            onPopRef.current();
          }
          if (t >= STACK_PUSH_AT[id] + STACK_PUSH_DUR - 0.05 && !fired.has(pushKey)) {
            fired.add(pushKey);
            onPushRef.current();
          }
        });

        raf = requestAnimationFrame(tick);
      };

      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }, [active]);

    return (
      <svg
        viewBox="0 0 64 64"
        className="w-full h-full overflow-visible drop-shadow-[0_0_8px_rgba(34,211,238,0.85)]"
      >
        <defs>
          <linearGradient id="stk-plate" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="35%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#0891b2" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {/* Cámara de la Pila (U-container con tope abierto) */}
        <path
          d="M 14 12 L 14 55 Q 14 58 18 58 L 46 58 Q 50 58 50 55 L 50 12"
          fill="none"
          stroke="#0e7490"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          d="M 14 12 L 14 55 Q 14 58 18 58 L 46 58 Q 50 58 50 55 L 50 12"
          fill="none"
          stroke="#22d3ee"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeOpacity="0.8"
        />

        {/* Ticks laterales de nivel */}
        {[44, 34, 24].map((y, i) => (
          <line
            key={i}
            x1="8"
            y1={y + 4.5}
            x2="12"
            y2={y + 4.5}
            stroke="#67e8f9"
            strokeWidth="1.2"
            strokeOpacity="0.7"
            strokeLinecap="round"
          />
        ))}

        {/* Flecha indicadora del puntero TOP */}
        <path
          ref={topArrowRef}
          d="M 7 0 L 12 0 M 12 0 L 9.5 -2.5 M 12 0 L 9.5 2.5"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 3 Bloques de datos apilables */}
        {[0, 1, 2].map((id) => (
          <g
            key={id}
            ref={(el) => {
              blocksRef.current[id] = el;
            }}
            transform={`translate(18 ${STACK_SLOT_Y[id]})`}
          >
            <rect
              width="28"
              height="8.5"
              rx="2.2"
              fill="url(#stk-plate)"
              stroke="#ecfeff"
              strokeWidth="0.8"
            />
            <line
              x1="3"
              y1="2"
              x2="25"
              y2="2"
              stroke="#ffffff"
              strokeOpacity="0.8"
              strokeWidth="0.8"
              strokeLinecap="round"
            />
            <circle cx="14" cy="4.25" r="1.3" fill="#ffffff" />
          </g>
        ))}
      </svg>
    );
  }
);

/* ------------------------------------------------------------------ */
/*  02. COLAS CIRCULARES (CIRCULAR QUEUE - BUFFER CIRCULAR)            */
/*  Demostración matemática real: Punteros FRONT y REAR envolviendo    */
/*  en módulo N: rear = (rear + 1) % 6, front = (front + 1) % 6        */
/* ------------------------------------------------------------------ */
const CQ_ANGLES = [0, 60, 120, 180, 240, 300]; // 6 nodos
const CQ_RADIUS = 19;

const CQ_N = 6;               // Nodos del anillo
const CQ_CYCLE = 5.4;         // Duración total del ciclo (s)
const CQ_OP_DUR = 0.55;       // Duración de cada operación
const CQ_ENQ_AT = [0.6, 1.2, 1.8];  // 3 enqueue
const CQ_DEQ_AT = [3.0, 3.6, 4.2];  // 3 dequeue

const CircularQueueIcon = memo(
  ({
    active,
    onStep,
    onPop,
  }: {
    active: boolean;
    onStep: (step: number) => void;
    onPop: () => void;
  }) => {
        const rearPointerRef = useRef<SVGPathElement | null>(null);
    const frontPointerRef = useRef<SVGPathElement | null>(null);
    const slotsRef = useRef<(SVGCircleElement | null)[]>([]);
    const onStepRef = useRef(onStep);
    const onPopRef = useRef(onPop);
    onStepRef.current = onStep;
    onPopRef.current = onPop;

    useEffect(() => {
      const EMPTY_FILL: RGB = [46, 16, 101];
      const FULL_FILL: RGB = [192, 132, 252];
      const EMPTY_STROKE: RGB = [126, 34, 206];
      const FULL_STROKE: RGB = [245, 208, 254];

      const draw = (cyc: number, t: number) => {
        // Cada ciclo avanza 3 posiciones: el anillo sigue girando sin saltos
        const S = 3 + 3 * cyc;
        const prog = (at: number) => clamp01((t - at) / CQ_OP_DUR);
        let rear = S + 2;
        let front = S;
        const pres = [0, 0, 0, 0, 0, 0];

        for (let j = 0; j < 3; j++) {
          const pe = prog(CQ_ENQ_AT[j]);
          const pd = prog(CQ_DEQ_AT[j]);
          rear += easeInOutCubic(pe);   // rear = (rear + 1) % N
          front += easeInOutCubic(pd);  // front = (front + 1) % N
          pres[(S + 3 + j) % CQ_N] = easeInOutCubic(clamp01((pe - 0.35) / 0.65));
          pres[(S + j) % CQ_N] = 1 - easeInOutCubic(clamp01(pd / 0.65));
        }

        slotsRef.current.forEach((el, id) => {
          if (!el) return;
          const v = pres[id];
          el.setAttribute('fill', mixColor(EMPTY_FILL, FULL_FILL, v));
          el.setAttribute('stroke', mixColor(EMPTY_STROKE, FULL_STROKE, v));
          el.setAttribute('stroke-width', (0.8 + 0.6 * v).toFixed(2));
          el.setAttribute('r', (4.2 + 1.3 * Math.sin(Math.PI * v)).toFixed(2));
        });

        if (frontPointerRef.current) {
          frontPointerRef.current.setAttribute('transform', `rotate(${(front * 60).toFixed(2)} 32 32)`);
        }
        if (rearPointerRef.current) {
          rearPointerRef.current.setAttribute('transform', `rotate(${(rear * 60).toFixed(2)} 32 32)`);
        }
      };

      if (!active) {
        draw(0, 0);
        return;
      }

      let raf = 0;
      let lastCyc = -1;
      const fired = new Set<string>();
      const start = performance.now();

      const tick = (now: number) => {
        const elapsed = (now - start) / 1000;
        const cyc = Math.floor(elapsed / CQ_CYCLE);
        const t = elapsed - cyc * CQ_CYCLE;
        if (cyc !== lastCyc) {
          lastCyc = cyc;
          fired.clear();
        }

        draw(cyc, t);

        for (let j = 0; j < 3; j++) {
          const eKey = `enq-${j}`;
          const dKey = `deq-${j}`;
          if (t >= CQ_ENQ_AT[j] + 0.33 && !fired.has(eKey)) {
            fired.add(eKey);
            onStepRef.current(j);
          }
          if (t >= CQ_DEQ_AT[j] + 0.1 && !fired.has(dKey)) {
            fired.add(dKey);
            onPopRef.current();
          }
        }

        raf = requestAnimationFrame(tick);
      };

      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }, [active]);

        return (
      <svg
        viewBox="0 0 64 64"
        className="w-full h-full overflow-visible drop-shadow-[0_0_8px_rgba(168,85,247,0.85)]"
      >
        {/* Pista circular discontinua */}
        <circle cx="32" cy="32" r="19" fill="none" stroke="#581c87" strokeWidth="3.2" strokeOpacity="0.6" />
        <circle
          cx="32"
          cy="32"
          r="19"
          fill="none"
          stroke="#c084fc"
          strokeWidth="1"
          strokeDasharray="2.5 2.5"
          strokeOpacity="0.85"
        />

        {/* Núcleo central */}
        <circle cx="32" cy="32" r="7.5" fill="#130924" stroke="#a855f7" strokeWidth="1" />
        <circle cx="32" cy="32" r="2.5" fill="#f5d0fe" />

        {/* FRONT (verde): afuera del anillo, apunta hacia adentro */}
        <path
          ref={frontPointerRef}
          d="M 32 7 L 28.6 1.2 L 35.4 1.2 Z"
          fill="#34d399"
          stroke="#ecfdf5"
          strokeWidth="0.6"
          strokeLinejoin="round"
        />
        {/* REAR (rojo): adentro del anillo, apunta hacia afuera */}
        <path
          ref={rearPointerRef}
          d="M 32 18 L 28.8 23.2 L 35.2 23.2 Z"
          fill="#f43f5e"
          stroke="#ffe4e6"
          strokeWidth="0.6"
          strokeLinejoin="round"
        />

        {/* 6 Ranuras circulares */}
        {CQ_ANGLES.map((deg, i) => {
          const rad = ((deg - 90) * Math.PI) / 180;
          const cx = 32 + CQ_RADIUS * Math.cos(rad);
          const cy = 32 + CQ_RADIUS * Math.sin(rad);
          return (
            <circle
              key={i}
              ref={(el) => {
                slotsRef.current[i] = el;
              }}
              cx={cx}
              cy={cy}
              r="4.2"
              fill="#2e1065"
              stroke="#7e22ce"
              strokeWidth="1"
            />
          );
        })}
      </svg>
    );
  }
);

/* ------------------------------------------------------------------ */
/*  03. COLAS LINEALES (QUEUE - FIFO)                                  */
/*  Sale el front por la derecha, los demás avanzan y entra uno       */
/*  nuevo por el rear (izquierda).                                     */
/* ------------------------------------------------------------------ */
const Q_SLOT_X = [14, 27, 40]; // 3 posiciones

const QueueIcon = memo(
  ({
    active,
    onEnqueue,
    onDequeue,
  }: {
    active: boolean;
    onEnqueue: () => void;
    onDequeue: () => void;
  }) => {
    const item0Ref = useRef<SVGGElement | null>(null);
    const item1Ref = useRef<SVGGElement | null>(null);
    const item2Ref = useRef<SVGGElement | null>(null);
    const onEnqueueRef = useRef(onEnqueue);
    const onDequeueRef = useRef(onDequeue);
    onEnqueueRef.current = onEnqueue;
    onDequeueRef.current = onDequeue;

    useEffect(() => {
      const Q_CYCLE = 2.7;
      const refs = [item0Ref, item1Ref, item2Ref];
      // s: -1 = entrando por la izquierda, 0..2 = ranuras, 3 = saliendo por la derecha
      const xOf = (s: number) => Q_SLOT_X[0] + (Q_SLOT_X[1] - Q_SLOT_X[0]) * s;

      const draw = (cyc: number, t: number) => {
        const pd = clamp01((t - 0.3) / 0.6); // 1) DEQUEUE: sale el front
        const pa = clamp01((t - 0.9) / 0.5); // 2) Los demás avanzan
        const pe = clamp01((t - 1.4) / 0.6); // 3) ENQUEUE: entra uno nuevo por el rear

        refs.forEach((ref, id) => {
          const el = ref.current;
          if (!el) return;
          // Cada ciclo los bloques rotan de rol (el que sale reentra por atrás)
          const s0 = 2 - ((((id - cyc) % 3) + 3) % 3);
          let s = s0;
          let op = 1;

          if (s0 === 2) {
            if (pe > 0) {
              s = -1 + easeInOutCubic(pe);
              op = Math.min(1, pe * 2.5);
            } else if (pd > 0) {
              s = 2 + easeInOutCubic(pd);
              op = Math.max(0, 1 - pd * 1.1);
            }
          } else {
            s = s0 + easeInOutCubic(pa);
          }

          el.setAttribute('transform', `translate(${xOf(s).toFixed(2)} 23)`);
          el.setAttribute('opacity', op.toFixed(2));
        });
      };

      if (!active) {
        draw(0, 0);
        return;
      }

      let raf = 0;
      let lastCyc = -1;
      const fired = new Set<string>();
      const start = performance.now();

      const tick = (now: number) => {
        const elapsed = (now - start) / 1000;
        const cyc = Math.floor(elapsed / Q_CYCLE);
        const t = elapsed - cyc * Q_CYCLE;
        if (cyc !== lastCyc) {
          lastCyc = cyc;
          fired.clear();
        }

        draw(cyc, t);

        if (t >= 0.42 && !fired.has('deq')) {
          fired.add('deq');
          onDequeueRef.current();
        }
        if (t >= 1.88 && !fired.has('enq')) {
          fired.add('enq');
          onEnqueueRef.current();
        }

        raf = requestAnimationFrame(tick);
      };

      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }, [active]);

    return (
      <svg
        viewBox="0 0 64 64"
        className="w-full h-full overflow-visible drop-shadow-[0_0_8px_rgba(52,211,153,0.85)]"
      >
        <defs>
          <linearGradient id="q-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ecfdf5" />
            <stop offset="35%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#065f46" />
          </linearGradient>
        </defs>

        {/* Carriles horizontales (Ducto FIFO) */}
        <line x1="4" y1="20" x2="60" y2="20" stroke="#065f46" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="6" y1="20" x2="58" y2="20" stroke="#34d399" strokeWidth="1" strokeLinecap="round" />

        <line x1="4" y1="44" x2="60" y2="44" stroke="#065f46" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="6" y1="44" x2="58" y2="44" stroke="#34d399" strokeWidth="1" strokeLinecap="round" />

        {/* Etiquetas IN y OUT */}
        <text x="6" y="15" fill="#34d399" fontSize="4.5" fontFamily="monospace" fontWeight="bold">
          REAR
        </text>
        <text x="44" y="15" fill="#6ee7b7" fontSize="4.5" fontFamily="monospace" fontWeight="bold">
          FRONT
        </text>

        {/* 3 Bloques en tránsito */}
        {[item0Ref, item1Ref, item2Ref].map((ref, idx) => (
          <g key={idx} ref={ref} transform={`translate(${Q_SLOT_X[2 - idx]} 23)`}>
            <rect width="9" height="18" rx="2" fill="url(#q-grad)" stroke="#a7f3d0" strokeWidth="0.8" />
            <circle cx="4.5" cy="9" r="1.3" fill="#ffffff" />
          </g>
        ))}
      </svg>
    );
  }
);

/* ------------------------------------------------------------------ */
/*  04. NOTACIÓN POLACA (EXPRESSION TREE / EVALUACIÓN CON PILA)        */
/*  Demostración matemática real: Token 3 entra, Token 5 entra,         */
/*  Operador '+' desapila ambos y calcula 3 + 5 = 8 con chispa.        */
/* ------------------------------------------------------------------ */
const POLISH_CYCLE = 5.0;
const POLISH_TOKEN_AT = [1.0, 1.9, 2.9]; // Cuándo se lee cada token de [3 5 +]
const POLISH_TOKEN_X = [13, 32, 51];
const POLISH_TOKEN_Y = 12;
const POLISH_SLOT_Y = [53, 41];          // Ranura 0 (abajo) y ranura 1
const POLISH_LABELS = ['3', '5', '+'];

const PolishNotationIcon = memo(
  ({ active, onEval }: { active: boolean; onEval: () => void }) => {
    const tokenGroupRefs = useRef<(SVGGElement | null)[]>([]);
    const tokenRectRefs = useRef<(SVGRectElement | null)[]>([]);
    const blockARef = useRef<SVGGElement | null>(null);
    const blockBRef = useRef<SVGGElement | null>(null);
    const resultRef = useRef<SVGGElement | null>(null);
    const flashRef = useRef<SVGCircleElement | null>(null);
    const onEvalRef = useRef(onEval);
    onEvalRef.current = onEval;

    useEffect(() => {
      const IDLE_FILL: RGB = [69, 26, 3];
      const ACT_FILL: RGB = [245, 158, 11];
      const IDLE_STROKE: RGB = [146, 64, 14];
      const ACT_STROKE: RGB = [255, 255, 255];

      const setBlock = (
        el: SVGGElement | null,
        x: number,
        y: number,
        scale: number,
        op: number
      ) => {
        if (!el) return;
        el.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${scale.toFixed(3)})`);
        el.setAttribute('opacity', op.toFixed(2));
      };

      // 0 = token sin leer, 1 = token activo, 0.55 = token ya procesado
      const tokenLevel = (i: number, t: number) => {
        const s = POLISH_TOKEN_AT[i];
        if (t < s - 0.1) {
          if (t < 0.5) return 0.55;
          if (t < 0.9) return lerp(0.55, 0, (t - 0.5) / 0.4);
          return 0;
        }
        if (t < s + 0.5) return clamp01((t - (s - 0.1)) / 0.2);
        return lerp(1, 0.55, clamp01((t - (s + 0.5)) / 0.3));
      };

      const draw = (t: number) => {
        // Cinta de tokens
        POLISH_TOKEN_AT.forEach((_, i) => {
          const lvl = tokenLevel(i, t);
          const g = tokenGroupRefs.current[i];
          const r = tokenRectRefs.current[i];
          const sc = 1 + 0.12 * Math.max(0, (lvl - 0.55) / 0.45);
          if (g) {
            g.setAttribute(
              'transform',
              `translate(${POLISH_TOKEN_X[i]} ${POLISH_TOKEN_Y}) scale(${sc.toFixed(3)})`
            );
          }
          if (r) {
            r.setAttribute('fill', mixColor(IDLE_FILL, ACT_FILL, lvl));
            r.setAttribute('stroke', mixColor(IDLE_STROKE, ACT_STROKE, lvl));
          }
        });

        // PUSH 3 y PUSH 5
        const pa = easeInOutCubic(clamp01((t - 1.0) / 0.6));
        const pb = easeInOutCubic(clamp01((t - 1.9) / 0.6));
        // Evaluación del '+': se sacan 3 y 5 y se mete 8
        const m = clamp01((t - 3.3) / 0.6);
        const pulse = t >= 2.9 && t < 3.3 ? 1 + 0.08 * Math.sin(((t - 2.9) / 0.4) * Math.PI) : 1;

        const aOp = t < 1.0 ? 0 : Math.min(1, pa * 3) * (1 - m);
        setBlock(
          blockARef.current,
          lerp(POLISH_TOKEN_X[0], 32, pa),
          lerp(POLISH_TOKEN_Y, POLISH_SLOT_Y[0], pa),
          pulse * (1 - 0.3 * m),
          aOp
        );

        const bY = t < 3.3 ? lerp(POLISH_TOKEN_Y, POLISH_SLOT_Y[1], pb) : lerp(POLISH_SLOT_Y[1], POLISH_SLOT_Y[0], easeInOutCubic(m));
        const bOp = t < 1.9 ? 0 : Math.min(1, pb * 3) * (1 - m);
        setBlock(blockBRef.current, 32, bY, pulse * (1 - 0.3 * m), bOp);

        // Resultado 8
        const rp = clamp01((t - 3.55) / 0.45);
        const fo = clamp01((t - 0.5) / 0.4);
        let rOp: number;
        let rSc: number;
        if (t >= 3.55) {
          rOp = Math.min(1, rp * 3);
          rSc = Math.max(0.01, easeOutBack(rp));
        } else {
          rOp = 1 - fo;
          rSc = 1 - 0.3 * fo;
        }
        setBlock(resultRef.current, 32, POLISH_SLOT_Y[0], rSc, rOp);

        // Destello al calcular
        if (flashRef.current) {
          const inFlash = t >= 3.55 && rp < 1;
          flashRef.current.setAttribute('r', (6 + 12 * rp).toFixed(2));
          flashRef.current.setAttribute('opacity', inFlash ? (0.8 * (1 - rp)).toFixed(2) : '0');
        }
      };

      // Estado normal = inicio de la animación (resultado 8 en la pila)
      if (!active) {
        draw(0);
        return;
      }

      let raf = 0;
      let lastCyc = -1;
      let evalFired = false;
      const start = performance.now();

      const tick = (now: number) => {
        const elapsed = (now - start) / 1000;
        const cyc = Math.floor(elapsed / POLISH_CYCLE);
        const t = elapsed - cyc * POLISH_CYCLE;
        if (cyc !== lastCyc) {
          lastCyc = cyc;
          evalFired = false;
        }

        draw(t);

        if (t >= 3.6 && !evalFired) {
          evalFired = true;
          onEvalRef.current();
        }

        raf = requestAnimationFrame(tick);
      };

      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }, [active]);

    return (
      <svg
        viewBox="0 0 64 64"
        className="w-full h-full overflow-visible drop-shadow-[0_0_8px_rgba(251,191,36,0.85)]"
      >
        <defs>
          <linearGradient id="pn-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fffbeb" />
            <stop offset="40%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
        </defs>

        {/* Cinta de tokens: 3 5 + */}
        {[0, 1, 2].map((i) => (
          <g
            key={i}
            ref={(el) => {
              tokenGroupRefs.current[i] = el;
            }}
            transform={`translate(${POLISH_TOKEN_X[i]} ${POLISH_TOKEN_Y})`}
          >
            <rect
              ref={(el) => {
                tokenRectRefs.current[i] = el;
              }}
              x="-7"
              y="-6"
              width="14"
              height="12"
              rx="3"
              fill="#78350f"
              stroke="#fde68a"
              strokeWidth="1"
            />
            <text
              x="0"
              y="3"
              fill="#ffffff"
              fontSize="8.5"
              fontFamily="sans-serif"
              fontWeight="bold"
              textAnchor="middle"
            >
              {POLISH_LABELS[i]}
            </text>
          </g>
        ))}

        {/* Pila donde se evalúa */}
        <path
          d="M 20 26 L 20 57 Q 20 60 23 60 L 41 60 Q 44 60 44 57 L 44 26"
          fill="none"
          stroke="#b45309"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          d="M 20 26 L 20 57 Q 20 60 23 60 L 41 60 Q 44 60 44 57 L 44 26"
          fill="none"
          stroke="#fbbf24"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeOpacity="0.8"
        />

        {/* Destello del cálculo */}
        <circle
          ref={flashRef}
          cx="32"
          cy={POLISH_SLOT_Y[0]}
          r="6"
          fill="none"
          stroke="#fde68a"
          strokeWidth="1.4"
          opacity="0"
        />

        {/* Bloque 3 */}
        <g ref={blockARef} transform={`translate(32 ${POLISH_SLOT_Y[0]})`} opacity="0">
          <rect x="-9" y="-5.5" width="18" height="11" rx="2.5" fill="#78350f" stroke="#fde68a" strokeWidth="1" />
          <text x="0" y="3" fill="#ffffff" fontSize="8" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">
            3
          </text>
        </g>

        {/* Bloque 5 */}
        <g ref={blockBRef} transform={`translate(32 ${POLISH_SLOT_Y[1]})`} opacity="0">
          <rect x="-9" y="-5.5" width="18" height="11" rx="2.5" fill="#78350f" stroke="#fde68a" strokeWidth="1" />
          <text x="0" y="3" fill="#ffffff" fontSize="8" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">
            5
          </text>
        </g>

        {/* Resultado 8 */}
        <g ref={resultRef} transform={`translate(32 ${POLISH_SLOT_Y[0]})`}>
          <rect x="-9" y="-5.5" width="18" height="11" rx="2.5" fill="url(#pn-grad)" stroke="#ffffff" strokeWidth="1.2" />
          <text x="0" y="3.2" fill="#ffffff" fontSize="9" fontFamily="sans-serif" fontWeight="900" textAnchor="middle">
            8
          </text>
        </g>
      </svg>
    );
  }
);

/* ------------------------------------------------------------------ */
/*  PANEL PRINCIPAL                                                    */
/* ------------------------------------------------------------------ */
export interface LinearMenuPanelProps {
  onBack: () => void;
  onSelectPilas: () => void;
  onSelectColasCirculares: () => void;
  onSelectColas: () => void;
  onSelectNotacionPolaca: () => void;
}

export const LinearMenuPanel: React.FC<LinearMenuPanelProps> = ({
  onBack,
  onSelectPilas,
  onSelectColasCirculares,
  onSelectColas,
  onSelectNotacionPolaca,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const parallax = useMouseParallax(12);
  const [hovered, setHovered] = useState<number | null>(null);
  const {
    playHoverSound,
    playClickSound,
    playStackPush,
    playStackPop,
    playCircularStep,
    playQueueSlide,
    playPolishEval,
  } = useSoundEffects();

  const handleAction = (action: () => void) => {
    playClickSound();
    action();
  };

  // Fondo dinámico de red
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

    const particles = Array.from({ length: 40 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
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
        ctx.fillStyle = 'rgba(168, 85, 247, 0.35)';
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(99, 102, 241, ${1 - dist / 120})`;
            ctx.lineWidth = 0.5;
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

  // Cuadrícula 2x2:
  // Fila 1: [01 Pilas] | [02 Colas Circulares]
  // Fila 2: [03 Colas] | [04 Notación Polaca]
  const exercises = [
    {
      title: 'Pilas',
      tag: '01',
      render: (active: boolean) => (
        <StackIcon active={active} onPush={playStackPush} onPop={playStackPop} />
      ),
      onClick: () => handleAction(onSelectPilas),
      badgeBg: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
      accentGlow: 'shadow-[0_0_35px_rgba(34,211,238,0.2)] hover:shadow-[0_0_55px_rgba(34,211,238,0.45)]',
      borderColor: 'border-cyan-500/40 hover:border-cyan-300',
      dotColor: 'bg-cyan-400 shadow-[0_0_12px_#22d3ee]',
      imgBg: 'bg-cyan-500/10 border-cyan-500/30 group-hover:bg-cyan-500/20',
      titleColor: 'text-cyan-200 group-hover:text-cyan-100',
    },
    {
      title: 'Colas Circulares',
      tag: '02',
      render: (active: boolean) => (
        <CircularQueueIcon active={active} onStep={playCircularStep} onPop={playStackPop} />
      ),
      onClick: () => handleAction(onSelectColasCirculares),
      badgeBg: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
      accentGlow: 'shadow-[0_0_35px_rgba(168,85,247,0.2)] hover:shadow-[0_0_55px_rgba(168,85,247,0.45)]',
      borderColor: 'border-purple-500/40 hover:border-purple-300',
      dotColor: 'bg-purple-400 shadow-[0_0_12px_#a855f7]',
      imgBg: 'bg-purple-500/10 border-purple-500/30 group-hover:bg-purple-500/20',
      titleColor: 'text-purple-200 group-hover:text-purple-100',
    },
    {
      title: 'Colas',
      tag: '03',
      render: (active: boolean) => (
        <QueueIcon active={active} onEnqueue={playQueueSlide} onDequeue={playStackPop} />
      ),
      onClick: () => handleAction(onSelectColas),
      badgeBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
      accentGlow: 'shadow-[0_0_35px_rgba(52,211,153,0.2)] hover:shadow-[0_0_55px_rgba(52,211,153,0.45)]',
      borderColor: 'border-emerald-500/40 hover:border-emerald-300',
      dotColor: 'bg-emerald-400 shadow-[0_0_12px_#34d399]',
      imgBg: 'bg-emerald-500/10 border-emerald-500/30 group-hover:bg-emerald-500/20',
      titleColor: 'text-emerald-200 group-hover:text-emerald-100',
    },
    {
      title: 'Notación Polaca',
      tag: '04',
      render: (active: boolean) => (
        <PolishNotationIcon active={active} onEval={playPolishEval} />
      ),
      onClick: () => handleAction(onSelectNotacionPolaca),
      badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
      accentGlow: 'shadow-[0_0_35px_rgba(251,191,36,0.2)] hover:shadow-[0_0_55px_rgba(251,191,36,0.45)]',
      borderColor: 'border-amber-500/40 hover:border-amber-300',
      dotColor: 'bg-amber-400 shadow-[0_0_12px_#fbbf24]',
      imgBg: 'bg-amber-500/10 border-amber-500/30 group-hover:bg-amber-500/20',
      titleColor: 'text-amber-200 group-hover:text-amber-100',
    },
  ];

  return (
    <div className="fixed inset-0 h-dvh w-full bg-[#090b16] text-white flex flex-col gap-2 px-3 sm:px-4 py-2 sm:py-3 overflow-hidden select-none">

      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap');

                    html, body { overflow: hidden; }
          .font-tech-header { font-family: 'Rajdhani', sans-serif; letter-spacing: 0.08em; }
          .font-tech-body { font-family: 'Plus Jakarta Sans', sans-serif; }
        `}
      </style>

      {/* Canvas dinámico */}
      <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none opacity-60" />

      {/* Destellos ambientales neón */}
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

      {/* ENCABEZADO */}
      <header
        className="relative z-10 shrink-0 text-center mt-0 space-y-1 sm:space-y-2 font-tech-body"
        style={{ transform: `translate3d(${parallax.x * 0.3}px, ${parallax.y * 0.3}px, 0)` }}
      >
        <h1
  className="font-tech-header leading-tight whitespace-nowrap font-extrabold uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-purple-300 drop-shadow-[0_0_25px_rgba(168,85,247,0.5)]"
  style={{
    fontSize: 'clamp(1rem, min(7.5vh, 3vw), 2.6rem)',
    letterSpacing: '0.08em',
  }}
>
  Laboratorio #4: Pilas, Colas y Notaciones Polacas
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

      {/* GRID 2x2 DE EJERCICIOS (Mismo tamaño y diseño del panel anterior) */}
      <main
        className="relative z-10 max-w-4xl mx-auto w-full flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 grid-rows-2 gap-3 lg:gap-5 py-1 font-tech-body"
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
            className={`group relative bg-[#0f1426]/85 backdrop-blur-xl border ${item.borderColor} ${item.accentGlow} rounded-2xl p-3 flex flex-col items-center justify-center text-center transition-all duration-300 hover:-translate-y-2 cursor-pointer min-h-0 h-full`}
          >
            <span
              className={`absolute top-3 right-3 w-2.5 h-2.5 rounded-full ${item.dotColor} group-hover:scale-125 transition-transform duration-300`}
            />

            <span
              className={`absolute top-3 left-3 px-2 py-1 rounded-md text-xs sm:text-sm font-bold tracking-wider uppercase border ${item.badgeBg} font-tech-header`}
            >
              {item.tag}
            </span>

            <div
              className={`w-[min(5rem,11dvh)] h-[min(5rem,11dvh)] rounded-xl ${item.imgBg} border flex items-center justify-center mb-1 p-2 transition-all duration-300 mt-2`}
            >
              {item.render(hovered === index)}
            </div>

            <h2
              className={`font-tech-header text-base sm:text-lg lg:text-xl font-extrabold uppercase tracking-wide transition-colors ${item.titleColor} mt-1`}
            >
              {item.title}
            </h2>
          </button>
        ))}
      </main>

      {/* FOOTER: Botón 'Atrás' alineado a la derecha como en el boceto */}
      <footer
        className="relative z-10 shrink-0 flex justify-end px-3 sm:px-6 pb-1 pt-1 font-tech-body"
        style={{ transform: `translate3d(${parallax.x * 0.4}px, 0, 0)` }}
      >
        <button
          onClick={() => handleAction(onBack)}
          onMouseEnter={playHoverSound}
          className="relative inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-[length:200%_auto] hover:bg-right shadow-lg shadow-indigo-600/40 hover:shadow-purple-500/70 hover:-translate-y-1 active:translate-y-0 active:scale-95 transition-all duration-300 group cursor-pointer border border-indigo-300/30"
        >
          <svg
            className="w-4 h-4 transform group-hover:-translate-x-1.5 transition-transform duration-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="font-tech-header text-sm tracking-wider">Atrás</span>
        </button>
      </footer>
    </div>
  );
};

export const StacksQueuesMenuPanel = LinearMenuPanel;
export const PilasColasMenuPanel = LinearMenuPanel;
export default LinearMenuPanel;