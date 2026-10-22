import React, { useRef, useEffect, useState } from 'react';

import {
  ArrowLeft,
  Save,
  Trash2,
  RotateCcw,
} from 'lucide-react';

import { useSoundEffects } from './useSoundEffects';
import { useNotification } from './NotificationContext';
import {
  obtenerEstadoColaCircular,
  encolarTrabajo,
  desencolarTrabajo,
  reiniciarColaCircular,
  type ColaCircularEstado,
} from './services/colaCircularService';

export interface CircularQueuePanelProps {
  onBack: () => void;
}

const CAPACITY = 10; // Capacidad fija de 10 casillas (0 a 9) según la pizarra
const MAX_CARACTERES_TRABAJO = 15; // Hasta 15 caracteres para nombres de trabajos

type TipoMensaje = 'info' | 'ok' | 'warn';

const TONOS_MENSAJE: Record<TipoMensaje, { pill: string; dot: string }> = {
  info: { pill: 'bg-purple-500/10 border-purple-400/40 text-purple-200', dot: 'bg-purple-400' },
  ok: { pill: 'bg-emerald-500/10 border-emerald-400/40 text-emerald-200', dot: 'bg-emerald-400' },
  warn: { pill: 'bg-amber-500/10 border-amber-400/40 text-amber-200', dot: 'bg-amber-400' },
};

export const CircularQueuePanel: React.FC<CircularQueuePanelProps> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { playClickSound, playHoverSound, playStackPush, playStackPop, playTone } = useSoundEffects();
  const { showNotification } = useNotification();

  // ========================================================
  // ESTADO DINÁMICO DE LA COLA CIRCULAR (CONECTADO AL BACKEND)
  // ========================================================
  const [vector, setVector] = useState<(string | null)[]>(Array(CAPACITY).fill(null));
  const [frente, setFrente] = useState<number>(-1);
  const [final, setFinal] = useState<number>(-1);
  const [count, setCount] = useState<number>(0);

  const [trabajoInput, setTrabajoInput] = useState<string>('');
  const [mensaje, setMensaje] = useState<{ tipo: TipoMensaje; texto: string }>({
    tipo: 'info',
    texto: 'Cargando estado de la cola circular...',
  });
  const [animatingIdx, setAnimatingIdx] = useState<number | null>(null);
  const [leaving, setLeaving] = useState<{ idx: number; val: string } | null>(null);
  const [isWrapAround, setIsWrapAround] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const actualizarEstado = (estado: ColaCircularEstado) => {
    setVector(estado.cola);
    setFrente(estado.frente);
    setFinal(estado.finalCola);
    setCount(estado.cantidad);
    setMensaje({
      tipo: estado.tipoMensaje,
      texto: estado.mensaje,
    });
    if (estado.dioVuelta) {
      setIsWrapAround(true);
      setTimeout(() => setIsWrapAround(false), 1200);
    }
  };

  // Carga inicial del estado desde el Backend
  useEffect(() => {
    const cargarEstadoInicial = async () => {
      try {
        const estado = await obtenerEstadoColaCircular();
        actualizarEstado(estado);
      } catch (err: any) {
        setMensaje({
          tipo: 'warn',
          texto: 'Iniciando en modo local. Conecte el Backend para sincronización en tiempo real.',
        });
      }
    };
    cargarEstadoInicial();
  }, []);

  // ========================================================
  // OPERACIONES DE COLA CIRCULAR CONECTADAS AL BACKEND
  // ========================================================
  const handleGuardarTrabajo = async () => {
    const limpio = trabajoInput.trim().toUpperCase().replace(/\s+/g, ' ');
    if (!limpio) {
      playTone(200, 'sawtooth', 0.25, 0.2);
      showNotification('warning', 'Campo Vacío', 'Ingrese el identificador o nombre del trabajo de impresión.');
      return;
    }
    if (limpio.length > MAX_CARACTERES_TRABAJO) {
      playTone(200, 'sawtooth', 0.25, 0.2);
      showNotification('error', 'Límite Excedido', `El trabajo de impresión no puede superar los ${MAX_CARACTERES_TRABAJO} caracteres.`);
      return;
    }
    if (!/^[A-Z0-9 _.-]+$/.test(limpio)) {
      playTone(200, 'sawtooth', 0.25, 0.2);
      showNotification('error', 'Formato Inválido', 'Solo se permiten letras, números, espacios y guiones (- / _).');
      return;
    }

    try {
      setIsLoading(true);
      playClickSound();
      const estado = await encolarTrabajo(limpio);
      playStackPush();
      setTrabajoInput('');
      actualizarEstado(estado);
      if (estado.indiceAfectado !== null) {
        setAnimatingIdx(estado.indiceAfectado);
        setTimeout(() => setAnimatingIdx(null), 600);
      }
      showNotification('success', 'Trabajo Encolado', estado.mensaje);
    } catch (err: any) {
      playTone(200, 'sawtooth', 0.25, 0.2);
      setMensaje({ tipo: 'warn', texto: err.message });
      showNotification('error', 'Error al Encolar', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDesencolar = async () => {
    try {
      setIsLoading(true);
      playClickSound();
      const elementoAnterior = frente >= 0 ? vector[frente] : null;
      const indiceAnterior = frente;
      const estado = await desencolarTrabajo();
      playStackPop();

      if (indiceAnterior >= 0 && elementoAnterior) {
        setLeaving({ idx: indiceAnterior, val: elementoAnterior });
        setTimeout(() => setLeaving(null), 500);
      }

      actualizarEstado(estado);
      showNotification('info', 'Trabajo Desencolado', estado.mensaje);
    } catch (err: any) {
      playTone(200, 'sawtooth', 0.25, 0.2);
      setMensaje({ tipo: 'warn', texto: err.message });
      showNotification('error', 'Error al Desencolar', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReiniciar = async () => {
    try {
      setIsLoading(true);
      playClickSound();
      setTrabajoInput('');
      const estado = await reiniciarColaCircular();
      actualizarEstado(estado);
      showNotification('info', 'Cola Reiniciada', 'La cola circular ha sido vaciada exitosamente.');
    } catch (err: any) {
      playTone(200, 'sawtooth', 0.25, 0.2);
      showNotification('error', 'Error', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Fondo animado de partículas neón
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const handleResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const particles = Array.from({ length: 45 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      size: Math.random() * 2 + 1,
    }));

    const render = () => {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

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
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
        <div className="fixed inset-0 h-dvh w-full bg-[#03060d] text-white flex flex-col overflow-hidden select-none font-tech-body">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700;800&family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Fira+Code:wght@500;700&display=swap');

          html, body { overflow: hidden; }
          .font-tech-header { font-family: 'Rajdhani', sans-serif; letter-spacing: 0.06em; }
          .font-tech-body { font-family: 'Plus Jakarta Sans', sans-serif; }
          .font-mono-tech { font-family: 'Fira Code', monospace; }

          @keyframes pointer-nudge {
            0%, 100% { transform: translateX(0); }
            50% { transform: translateX(4px); }
          }
          .anim-pointer { animation: pointer-nudge 1.2s ease-in-out infinite; }

          @keyframes pulse-ring {
            0% { box-shadow: 0 0 0 0 rgba(244, 63, 94, 0.7); }
            70% { box-shadow: 0 0 0 14px rgba(244, 63, 94, 0); }
            100% { box-shadow: 0 0 0 0 rgba(244, 63, 94, 0); }
          }
          .anim-wrap-border { animation: pulse-ring 0.9s ease-out; }

          @keyframes cell-pop {
            0% { transform: scale(0.3); opacity: 0; }
            60% { transform: scale(1.15); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }
          .anim-cell-pop { animation: cell-pop 0.55s cubic-bezier(0.22, 1, 0.36, 1) both; }

          @keyframes cell-leave {
            0% { transform: translateX(0) scale(1); opacity: 1; }
            100% { transform: translateX(35px) scale(0.6); opacity: 0; }
          }
          .anim-cell-leave { animation: cell-leave 0.5s ease-in forwards; }
        `}
      </style>

      {/* Fondo: red de nodos + destellos (igual que 8 Reinas) */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none opacity-60" />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/20 rounded-full blur-[120px] pointer-events-none z-0" />

            {/* ENCABEZADO */}
      <header className="relative z-10 shrink-0 text-center px-10 pt-4 pb-2 space-y-1.5">
        <h1
          className="font-tech-header font-extrabold uppercase leading-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-purple-300 drop-shadow-[0_0_25px_rgba(168,85,247,0.5)]"
          style={{ fontSize: 'clamp(1.5rem, 6vh, 2.6rem)', letterSpacing: '0.08em' }}
        >
          Colas Circulares
        </h1>

        <div className="flex items-center justify-center gap-3 text-purple-200/90">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span className="h-[1px] w-10 sm:w-24 bg-gradient-to-r from-transparent to-cyan-400" />
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
          </div>
          <span className="tracking-wide font-bold text-slate-200 uppercase text-xs sm:text-base">
            BUFFER CIRCULAR (FIFO)
          </span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_10px_#c084fc]" />
            <span className="h-[1px] w-10 sm:w-24 bg-gradient-to-l from-transparent to-purple-400" />
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
          </div>
        </div>
      </header>

      {/* ZONA CENTRAL: DISPOSICIÓN VERTICAL (ESTILO PILAS) */}
      <main className="relative z-10 flex-1 min-h-0 w-full max-w-6xl mx-auto px-6 sm:px-10 py-1 grid grid-cols-1 lg:grid-cols-12 lg:grid-rows-[minmax(0,1fr)] gap-5">
        {/* COLUMNA IZQUIERDA: LA COLA CIRCULAR EN DISPOSICIÓN VERTICAL */}
        <section
          className={`lg:col-span-7 min-h-0 flex flex-col bg-[#0f1426]/85 backdrop-blur-xl border border-purple-500/40 rounded-2xl px-5 py-3 shadow-[0_0_35px_rgba(168,85,247,0.2)] transition-all ${
            isWrapAround ? 'anim-wrap-border' : ''
          }`}
        >
          {/* Frente / Final + barra de capacidad */}
          <div className="flex flex-wrap items-center justify-between gap-3 shrink-0 pb-2 border-b border-purple-500/20">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-2">
                <span className="font-tech-header font-bold text-sm text-rose-300 tracking-wider">Frente =</span>
                <div className="min-w-10 h-8 px-2 bg-[#03060d] border border-rose-500/40 rounded-lg flex items-center justify-center font-mono-tech text-sm font-black text-rose-200 shadow-[0_0_10px_rgba(244,63,94,0.25)]">
                  {frente === -1 ? '—' : frente}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-tech-header font-bold text-sm text-cyan-300 tracking-wider">Final =</span>
                <div className="min-w-10 h-8 px-2 bg-[#03060d] border border-cyan-500/40 rounded-lg flex items-center justify-center font-mono-tech text-sm font-black text-cyan-200 shadow-[0_0_10px_rgba(34,211,238,0.25)]">
                  {final === -1 ? '—' : final}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-tech-header font-bold uppercase tracking-wider text-slate-300">Capacidad</span>
              <div className="w-24 sm:w-28 h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-500"
                  style={{ width: `${(count / CAPACITY) * 100}%` }}
                />
              </div>
              <span className="font-mono-tech text-xs font-bold text-cyan-300">
                {count}/{CAPACITY}
              </span>
            </div>
          </div>

          {/* LISTA VERTICAL DE CASILLAS 0 A 9 */}
          <div className="relative flex-1 min-h-0 flex flex-col justify-between py-2 gap-1 overflow-hidden">
            {/* Indicador de Arco Circular vertical conectando la casilla 9 de vuelta a la 0 */}
            <div className="absolute left-0 top-3 bottom-3 w-4 pointer-events-none z-10 flex flex-col items-center justify-between">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 20 200" preserveAspectRatio="none">
                <path
                  d="M 18 190 C -10 190, -10 10, 18 10"
                  fill="none"
                  stroke={isWrapAround ? '#fb7185' : 'rgba(168,85,247,0.35)'}
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  vectorEffect="non-scaling-stroke"
                />
                <polygon
                  points="18,10 10,6 10,14"
                  fill={isWrapAround ? '#fb7185' : 'rgba(168,85,247,0.7)'}
                />
              </svg>
            </div>

            {vector.map((val, idx) => {
              const isFrente = count > 0 && idx === frente;
              const isFinal = count > 0 && idx === final;
              const isBoth = isFrente && isFinal;
              const isAnimating = animatingIdx === idx;

              return (
                <div key={idx} className="flex items-center gap-2 flex-1 min-h-0 max-h-12 pl-3">
                  {/* Índice de la casilla */}
                  <span
                    className={`w-6 shrink-0 text-right font-mono-tech text-[11px] font-bold ${
                      idx === 0
                        ? 'text-cyan-400 font-extrabold'
                        : idx === CAPACITY - 1
                        ? 'text-purple-300 font-extrabold'
                        : 'text-slate-400'
                    }`}
                  >
                    {idx}
                  </span>

                  {/* Cuerpo de la casilla */}
                  <div
                    className={`relative flex-1 h-full rounded-xl border flex items-center justify-center transition-all duration-300 ${
                      isBoth
                        ? 'bg-yellow-500/25 border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.4)]'
                        : isFrente
                        ? 'bg-rose-500/20 border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.35)]'
                        : isFinal
                        ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.35)]'
                        : val !== null
                        ? 'bg-[#151b33]/90 border-purple-500/40'
                        : 'bg-white/5 border-dashed border-white/10'
                    } ${isAnimating ? 'scale-105 shadow-[0_0_22px_#a855f7] z-10' : ''}`}
                  >
                    <span
                      className={`font-mono-tech font-bold truncate px-3 ${
                        isBoth
                          ? 'text-yellow-200'
                          : isFrente
                          ? 'text-white'
                          : isFinal
                          ? 'text-cyan-200'
                          : val !== null
                          ? 'text-slate-100'
                          : 'text-slate-600'
                      } ${isAnimating ? 'anim-cell-pop' : ''}`}
                      style={{ fontSize: 'clamp(0.8rem, 2vh, 1rem)' }}
                    >
                      {val !== null ? val : '—'}
                    </span>

                    {/* Trabajo que acaba de salir (animación) */}
                    {leaving?.idx === idx && (
                      <span
                        className="absolute inset-0 flex items-center justify-center px-3 truncate font-mono-tech font-bold text-rose-300 anim-cell-leave pointer-events-none"
                        style={{ fontSize: 'clamp(0.8rem, 2vh, 1rem)' }}
                      >
                        {leaving.val}
                      </span>
                    )}
                  </div>

                  {/* Punteros laterales dinámicos: Frente / Final */}
                  <div className="w-28 shrink-0 flex items-center">
                    {isBoth ? (
                      <div className="flex items-center gap-1.5 text-yellow-300 anim-pointer">
                        <ArrowLeft className="w-4 h-4 text-yellow-400" />
                        <span className="text-[11px] font-extrabold font-tech-header uppercase tracking-wider drop-shadow-[0_0_6px_#facc15] whitespace-nowrap">
                          Frente & Final
                        </span>
                      </div>
                    ) : isFrente ? (
                      <div className="flex items-center gap-1.5 text-rose-400 anim-pointer">
                        <ArrowLeft className="w-4 h-4 text-rose-400" />
                        <span className="text-[11px] font-extrabold font-tech-header uppercase tracking-wider drop-shadow-[0_0_6px_#f43f5e] whitespace-nowrap">
                          Frente
                        </span>
                      </div>
                    ) : isFinal ? (
                      <div className="flex items-center gap-1.5 text-cyan-300 anim-pointer">
                        <ArrowLeft className="w-4 h-4 text-cyan-400" />
                        <span className="text-[11px] font-extrabold font-tech-header uppercase tracking-wider drop-shadow-[0_0_6px_#22d3ee] whitespace-nowrap">
                          Final
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Fórmula circular inferior */}
          <div className="pt-2 border-t border-purple-500/20 flex items-center justify-between text-[11px] font-mono-tech text-purple-300/90 shrink-0">
            <span>Vuelta al inicio: casilla 9 → 0</span>
            <span className="px-2 py-0.5 rounded bg-purple-950/80 border border-purple-500/40 text-purple-200">
              (Final + 1) % {CAPACITY}
            </span>
          </div>
        </section>

        {/* COLUMNA DERECHA: CONTROLES E INFORMACIÓN */}
        <div className="lg:col-span-5 min-h-0 flex flex-col justify-center gap-4">
          {/* TARJETA 1: CONTROLES DE LA COLA */}
          <section className="bg-[#0f1426]/85 backdrop-blur-xl border border-cyan-500/30 rounded-2xl px-5 py-4 shadow-[0_0_35px_rgba(34,211,238,0.12)] flex flex-col gap-3">
            <label
              htmlFor="trabajoInput"
              className="font-tech-header text-base font-bold text-slate-100 tracking-wide"
            >
              Trabajo de impresión:
            </label>

            <div className="relative">
              <input
                id="trabajoInput"
                type="text"
                maxLength={MAX_CARACTERES_TRABAJO}
                autoFocus
                placeholder="Ej: DOC_1, INFORME"
                value={trabajoInput}
                onChange={(e) => {
                  const limpio = e.target.value.toUpperCase().replace(/[^A-Z0-9 _.-]/g, '');
                  setTrabajoInput(limpio);
                }}
                onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleGuardarTrabajo()}
                disabled={isLoading}
                className="w-full bg-[#03060d] border border-slate-500/50 focus:border-cyan-400 rounded-xl pl-4 pr-16 py-2.5 text-base text-white placeholder:text-slate-500 focus:outline-none transition-all font-mono-tech font-bold tracking-wider uppercase disabled:opacity-50"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-mono-tech text-slate-500">
                {trabajoInput.length}/{MAX_CARACTERES_TRABAJO}
              </span>
            </div>

            {/* Botones de acción */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={handleGuardarTrabajo}
                onMouseEnter={playHoverSound}
                disabled={isLoading}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-[#03060d] bg-cyan-400 hover:bg-cyan-300 hover:-translate-y-0.5 active:scale-95 transition-transform duration-200 cursor-pointer font-tech-header text-base tracking-wider whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(34,211,238,0.3)]"
              >
                <Save className="w-5 h-5" />
                Guardar
              </button>

              <button
                type="button"
                onClick={handleDesencolar}
                onMouseEnter={playHoverSound}
                disabled={isLoading || count === 0}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-rose-200 bg-rose-950/80 border border-rose-500/50 hover:bg-rose-900 hover:text-white hover:-translate-y-0.5 active:scale-95 transition-transform duration-200 cursor-pointer font-tech-header text-base tracking-wider disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(244,63,94,0.2)]"
              >
                <Trash2 className="w-5 h-5" />
                Desencolar
              </button>
            </div>

            <button
              type="button"
              onClick={handleReiniciar}
              onMouseEnter={playHoverSound}
              disabled={isLoading}
              title="Volver al estado inicial"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-bold text-amber-200 bg-amber-950/80 border border-amber-400 hover:bg-amber-900 hover:text-white hover:-translate-y-0.5 active:scale-95 transition-transform duration-200 cursor-pointer font-tech-header text-sm tracking-wider disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(251,191,36,0.2)] mt-1"
            >
              <RotateCcw className="w-4 h-4" />
              Reiniciar Cola
            </button>
          </section>

          {/* TARJETA 2: ESTADO Y TELEMETRÍA DEL ALGORITMO CIRCULAR */}
          <section className="bg-[#0f1426]/85 backdrop-blur-xl border border-purple-500/30 rounded-2xl px-5 py-3.5 shadow-[0_0_35px_rgba(168,85,247,0.12)] flex flex-col gap-2.5">
            <h3 className="font-tech-header text-xs font-bold uppercase tracking-wider text-purple-300 pb-1 border-b border-purple-500/20">
              Telemetría del Buffer Circular
            </h3>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono-tech">
              <div className="p-2 rounded-lg bg-[#03060d]/70 border border-slate-800 flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase font-tech-header">Elemento Frente</span>
                <span className="font-bold text-rose-300 truncate">
                  {frente >= 0 ? `${frente}: ${vector[frente]}` : 'Vacío (-1)'}
                </span>
              </div>

              <div className="p-2 rounded-lg bg-[#03060d]/70 border border-slate-800 flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase font-tech-header">Elemento Final</span>
                <span className="font-bold text-cyan-300 truncate">
                  {final >= 0 ? `${final}: ${vector[final]}` : 'Vacío (-1)'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-mono-tech pt-1">
              <span className="text-slate-400 font-tech-header uppercase text-[11px]">Siguiente posición:</span>
              <span className="font-bold text-purple-200 px-2 py-0.5 rounded bg-purple-950/70 border border-purple-500/30">
                {count === CAPACITY
                  ? 'Cola Llena'
                  : final === -1
                  ? 'Casilla 0'
                  : `Casilla ${(final + 1) % CAPACITY}`}
              </span>
            </div>
          </section>
        </div>
      </main>

      {/* FOOTER: estado a la izquierda, Atrás a la derecha */}
      <footer className="relative z-20 shrink-0 flex items-center justify-between gap-6 px-6 sm:px-10 pt-2 pb-3">
        <div
          className={`inline-flex items-center gap-2 min-w-0 max-w-[70%] px-4 py-2 rounded-full border backdrop-blur-md text-xs font-mono-tech transition-colors duration-300 ${TONOS_MENSAJE[mensaje.tipo].pill}`}
        >
          <span className={`w-2 h-2 shrink-0 rounded-full ${TONOS_MENSAJE[mensaje.tipo].dot}`} />
          <span className="truncate">{mensaje.texto}</span>
        </div>

        <button
          onClick={() => {
            playClickSound();
            onBack();
          }}
          onMouseEnter={playHoverSound}
          className="relative inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 bg-[length:200%_auto] hover:bg-right shadow-lg shadow-indigo-700/40 hover:shadow-purple-600/70 hover:-translate-y-1 active:scale-95 transition-all duration-300 group cursor-pointer border border-indigo-400/40 shrink-0"
        >
          <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1.5 transition-transform duration-300" />
          <span className="font-tech-header text-base tracking-wider">Atrás</span>
        </button>
      </footer>
    </div>
  );
};
export default CircularQueuePanel;