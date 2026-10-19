import React, { useRef, useEffect, useState } from 'react';

import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
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

type TipoMensaje = 'info' | 'ok' | 'warn';

const TONOS_MENSAJE: Record<TipoMensaje, { pill: string; dot: string }> = {
  info: { pill: 'bg-purple-500/10 border-purple-400/40 text-purple-200', dot: 'bg-purple-400' },
  ok: { pill: 'bg-emerald-500/10 border-emerald-400/40 text-emerald-200', dot: 'bg-emerald-400' },
  warn: { pill: 'bg-amber-500/10 border-amber-400/40 text-amber-200', dot: 'bg-amber-400' },
};

// Centro horizontal (en %) de cada casilla, para colocar los punteros
const centerPct = (i: number) => ((i + 0.5) * 100) / CAPACITY;

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
    const limpio = trabajoInput.trim().toUpperCase();
    if (!limpio) {
      playTone(200, 'sawtooth', 0.25, 0.2);
      showNotification('warning', 'Campo Vacío', 'Ingrese el identificador de la estación (1 a 4 letras).');
      return;
    }
    if (limpio.length > 4 || !/^[A-Z]+$/.test(limpio)) {
      playTone(200, 'sawtooth', 0.25, 0.2);
      showNotification('error', 'Formato Inválido', 'Las estaciones de trabajo solo pueden componerse de 1 a 4 letras (A-Z).');
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

          @keyframes float-arrow {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-4px); }
          }
          .anim-arrow { animation: float-arrow 1.4s ease-in-out infinite; }

          @keyframes pulse-ring {
            0% { box-shadow: 0 0 0 0 rgba(244, 63, 94, 0.7); }
            70% { box-shadow: 0 0 0 14px rgba(244, 63, 94, 0); }
            100% { box-shadow: 0 0 0 0 rgba(244, 63, 94, 0); }
          }
          .anim-wrap-border { animation: pulse-ring 0.9s ease-out; }

          @keyframes cell-pop {
            0% { transform: scale(0.3); opacity: 0; }
            60% { transform: scale(1.3); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }
          .anim-cell-pop { animation: cell-pop 0.55s cubic-bezier(0.22, 1, 0.36, 1) both; }

          @keyframes cell-leave {
            0% { transform: translateY(0) scale(1); opacity: 1; }
            100% { transform: translateY(-38px) scale(0.6); opacity: 0; }
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

            {/* ZONA CENTRAL */}
      <main className="relative z-10 flex-1 min-h-0 w-full max-w-5xl mx-auto px-10 flex flex-col justify-center gap-4">
        {/* TARJETA: LA COLA */}
        <section
          className={`bg-[#0f1426]/85 backdrop-blur-xl border border-purple-500/40 rounded-2xl px-5 py-3 shadow-[0_0_35px_rgba(168,85,247,0.2)] ${
            isWrapAround ? 'anim-wrap-border' : ''
          }`}
        >
          {/* Frente / Final + capacidad */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-2">
                <span className="font-tech-header font-bold text-sm text-rose-300 tracking-wider">Frente =</span>
                <div className="w-10 h-8 bg-[#03060d] border border-rose-500/40 rounded-lg flex items-center justify-center font-mono-tech text-sm font-black text-white shadow-[0_0_10px_rgba(244,63,94,0.25)]">
                  {frente === -1 ? '—' : frente}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-tech-header font-bold text-sm text-cyan-300 tracking-wider">Final =</span>
                <div className="w-10 h-8 bg-[#03060d] border border-cyan-500/40 rounded-lg flex items-center justify-center font-mono-tech text-sm font-black text-white shadow-[0_0_10px_rgba(34,211,238,0.25)]">
                  {final === -1 ? '—' : final}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-tech-header font-bold uppercase tracking-wider text-slate-300">
                Capacidad
              </span>
              <div className="w-24 h-2 rounded-full bg-white/10 overflow-hidden">
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

          {/* Puntero FRENTE (arriba, apunta hacia abajo) */}
          <div className="relative h-9">
            <div
              className="absolute bottom-0"
              style={{
                left: `${centerPct(Math.max(frente, 0))}%`,
                transform: 'translateX(-50%)',
                opacity: count > 0 && frente !== -1 ? 1 : 0,
                transition: 'left 0.55s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s',
              }}
            >
              <div className="flex flex-col items-center anim-arrow">
                <span className="text-[11px] font-extrabold text-rose-400 font-tech-header uppercase tracking-wider drop-shadow-[0_0_6px_#f43f5e]">
                  Frente
                </span>
                <ArrowDown className="w-4 h-4 text-rose-500 -mt-0.5" />
              </div>
            </div>
          </div>

          {/* Casillas 0..9 */}
          <div className="flex">
            {vector.map((val, idx) => {
              const isFrente = count > 0 && idx === frente;
              const isFinal = count > 0 && idx === final;
              const isBoth = isFrente && isFinal;
              const isAnimating = animatingIdx === idx;
              const letraCorta = (val?.length ?? 0) <= 2;

              return (
                <div key={idx} className="px-0.5 sm:px-1" style={{ width: `${100 / CAPACITY}%` }}>
                  <div
                    className={`relative w-full rounded-xl border flex items-center justify-center transition-all duration-300 ${
                      isBoth
                        ? 'bg-yellow-500/25 border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.4)]'
                        : isFrente
                        ? 'bg-rose-500/20 border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.35)]'
                        : isFinal
                        ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.35)]'
                        : val !== null
                        ? 'bg-[#151b33]/90 border-purple-500/40'
                        : 'bg-white/5 border-dashed border-white/10'
                    } ${isAnimating ? 'scale-110 shadow-[0_0_22px_#a855f7] z-10' : ''}`}
                    style={{ height: 'clamp(2.75rem, 9vh, 4.5rem)' }}
                  >
                    <span
                      className={`font-black font-mono-tech ${
                        idx === 0 && val === 'K'
                          ? 'text-rose-400 drop-shadow-[0_0_10px_#f43f5e]'
                          : isFrente
                          ? 'text-white'
                          : isFinal
                          ? 'text-cyan-200'
                          : val !== null
                          ? 'text-slate-100'
                          : 'text-slate-600'
                      } ${isAnimating ? 'anim-cell-pop' : ''}`}
                      style={{
                        fontSize: letraCorta
                          ? 'clamp(1.1rem, 3.4vh, 1.9rem)'
                          : 'clamp(0.75rem, 2.1vh, 1.05rem)',
                      }}
                    >
                      {val !== null ? val : '—'}
                    </span>

                    {/* Trabajo que acaba de salir */}
                    {leaving?.idx === idx && (
                      <span
                        className="absolute inset-0 flex items-center justify-center font-black font-mono-tech text-rose-300 anim-cell-leave pointer-events-none"
                        style={{ fontSize: 'clamp(1.1rem, 3.4vh, 1.9rem)' }}
                      >
                        {leaving.val}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Índices */}
          <div className="flex mt-1">
            {vector.map((_, idx) => (
              <span
                key={idx}
                className={`text-center font-mono-tech text-[11px] sm:text-xs font-bold ${
                  idx === 0
                    ? 'text-cyan-400 font-extrabold'
                    : idx === CAPACITY - 1
                    ? 'text-purple-300 font-extrabold'
                    : 'text-slate-400'
                }`}
                style={{ width: `${100 / CAPACITY}%` }}
              >
                {idx}
              </span>
            ))}
          </div>

          {/* Puntero FINAL (abajo, apunta hacia arriba) */}
          <div className="relative h-9">
            <div
              className="absolute top-0"
              style={{
                left: `${centerPct(Math.max(final, 0))}%`,
                transform: 'translateX(-50%)',
                opacity: count > 0 && final !== -1 ? 1 : 0,
                transition: 'left 0.55s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s',
              }}
            >
              <div className="flex flex-col items-center anim-arrow">
                <ArrowUp className="w-4 h-4 text-cyan-400 -mb-0.5" />
                <span className="text-[11px] font-extrabold text-cyan-300 font-tech-header uppercase tracking-wider drop-shadow-[0_0_6px_#22d3ee]">
                  Final
                </span>
              </div>
            </div>
          </div>

          {/* Arco circular: de la casilla 9 de vuelta a la 0 */}
          <div className="relative h-7">
            <svg
              className="absolute inset-0 w-full h-full overflow-visible"
              viewBox="0 0 100 28"
              preserveAspectRatio="none"
            >
              <path
                d="M 95 0 C 95 30, 5 30, 5 4"
                fill="none"
                stroke={isWrapAround ? '#fb7185' : 'rgba(192,132,252,0.45)'}
                strokeWidth="1.5"
                strokeDasharray="5 5"
                vectorEffect="non-scaling-stroke"
                style={{ transition: 'stroke 0.3s' }}
              />
            </svg>
            <svg
              className="absolute w-2.5 h-2.5"
              style={{ left: '5%', top: 0, transform: 'translateX(-50%)' }}
              viewBox="0 0 10 10"
            >
              <path d="M5 0 L10 9 L0 9 Z" fill={isWrapAround ? '#fb7185' : 'rgba(192,132,252,0.7)'} />
            </svg>
            <span className="absolute left-1/2 -translate-x-1/2 top-2.5 px-2 bg-[#0f1426] text-[10px] font-mono-tech text-purple-300/90">
              (Final + 1) % {CAPACITY}
            </span>
          </div>
        </section>

        {/* TARJETA: CONTROLES */}
        <section className="bg-[#0f1426]/85 backdrop-blur-xl border border-cyan-500/30 rounded-2xl px-5 py-4 shadow-[0_0_35px_rgba(34,211,238,0.12)] flex items-center gap-4">
          <label
            htmlFor="trabajoInput"
            className="font-tech-header text-base font-bold text-slate-100 tracking-wide shrink-0 whitespace-nowrap"
          >
            Ingrese el trabajo:
          </label>

          <div className="relative flex-1 min-w-[10rem]">
            <input
              id="trabajoInput"
              type="text"
              maxLength={4}
              autoFocus
              placeholder="Ej: A, WS, DOC"
              value={trabajoInput}
              onChange={(e) => {
                const soloLetras = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
                setTrabajoInput(soloLetras);
              }}
              onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleGuardarTrabajo()}
              disabled={isLoading}
              className="w-full bg-[#03060d] border border-slate-500/50 focus:border-cyan-400 rounded-xl pl-4 pr-14 py-2.5 text-lg text-white placeholder:text-slate-500 focus:outline-none transition-all font-mono-tech font-bold tracking-widest uppercase disabled:opacity-50"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-mono-tech text-slate-500">
              {trabajoInput.length}/4
            </span>
          </div>

          <button
            type="button"
            onClick={handleGuardarTrabajo}
            onMouseEnter={playHoverSound}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[#03060d] bg-cyan-400 hover:bg-cyan-300 hover:-translate-y-0.5 active:scale-95 transition-transform duration-200 cursor-pointer shrink-0 font-tech-header text-base tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            Guardar
          </button>

          <span className="w-px h-8 bg-white/10 shrink-0" />

          <button
            type="button"
            onClick={handleDesencolar}
            onMouseEnter={playHoverSound}
            disabled={isLoading || count === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-slate-200 bg-slate-700/50 border border-slate-500/40 hover:bg-slate-700 hover:-translate-y-0.5 active:scale-95 transition-transform duration-200 cursor-pointer shrink-0 font-tech-header text-base tracking-wider disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-5 h-5" />
            Desencolar
          </button>

          <button
            type="button"
            onClick={handleReiniciar}
            onMouseEnter={playHoverSound}
            disabled={isLoading}
            title="Volver al estado inicial"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-slate-300 bg-transparent border border-slate-500/40 hover:bg-white/5 hover:-translate-y-0.5 active:scale-95 transition-transform duration-200 cursor-pointer shrink-0 font-tech-header text-base tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-4 h-4" />
            Reiniciar
          </button>
        </section>
      </main>

            {/* FOOTER: estado a la izquierda, Atrás a la derecha */}
      <footer className="relative z-20 shrink-0 flex items-center justify-between gap-6 px-10 pt-2 pb-3">
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
          className="relative inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-[length:200%_auto] hover:bg-right shadow-lg shadow-indigo-600/40 hover:shadow-purple-500/70 hover:-translate-y-1 active:scale-95 transition-all duration-300 group cursor-pointer border border-indigo-300/30 shrink-0"
        >
          <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1.5 transition-transform duration-300" />
          <span className="font-tech-header text-base tracking-wider">Atrás</span>
        </button>
      </footer>
    </div>
  );
};
export default CircularQueuePanel;