import React, { useEffect, useRef } from 'react';
import { Network, ArrowLeft } from 'lucide-react';
import { useMouseParallax } from './useMouseParallax';
import { useSoundEffects } from './useSoundEffects';

/* ------------------------------------------------------------------ */
/*  PROPS DEL PANEL PRINCIPAL                                          */
/* ------------------------------------------------------------------ */
export interface LinearMenuPanelProps {
  onBack: () => void;
  onSelectArboles?: () => void;
  onSelectPilas?: () => void;
  onSelectColasCirculares?: () => void;
  onSelectColas?: () => void;
  onSelectNotacionPolaca?: () => void;
}

export const LinearMenuPanel: React.FC<LinearMenuPanelProps> = ({
  onBack,
  onSelectArboles,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const parallax = useMouseParallax(12);
  const { playHoverSound, playClickSound } = useSoundEffects();

  const handleAction = (action?: () => void) => {
    if (!action) return;
    playClickSound();
    action();
  };

  // Fondo dinámico de red de partículas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const particles = Array.from({ length: 45 }, () => ({
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
        ctx.fillStyle = 'rgba(52, 211, 153, 0.35)';
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
            ctx.strokeStyle = `rgba(16, 185, 129, ${1 - dist / 120})`;
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

  return (
    <div className="fixed inset-0 h-dvh w-full bg-[#090b16] text-white flex flex-col gap-2 px-3 sm:px-6 py-3 sm:py-4 overflow-hidden select-none">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700;800&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap');

          html, body { overflow: hidden; }
          .font-tech-header { font-family: 'Rajdhani', sans-serif; letter-spacing: 0.08em; }
          .font-tech-body { font-family: 'Plus Jakarta Sans', sans-serif; }
        `}
      </style>

      {/* Canvas dinámico */}
      <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none opacity-60" />

      {/* Destellos ambientales neón */}
      <div
        className="fixed -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-emerald-600/15 rounded-full blur-[160px] pointer-events-none"
        style={{ transform: `translate3d(${parallax.x * 0.5}px, ${parallax.y * 0.5}px, 0)` }}
      />
      <div
        className="fixed -bottom-28 -left-28 w-[500px] h-[500px] bg-teal-700/20 rounded-full blur-[150px] pointer-events-none"
        style={{ transform: `translate3d(${parallax.x * 0.8}px, ${parallax.y * 0.8}px, 0)` }}
      />
      <div
        className="fixed -bottom-28 -right-28 w-[500px] h-[500px] bg-cyan-600/20 rounded-full blur-[150px] pointer-events-none"
        style={{ transform: `translate3d(${parallax.x * -0.6}px, ${parallax.y * -0.6}px, 0)` }}
      />

      {/* Patrones decorativos de cuadrícula */}
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
        className="relative z-10 shrink-0 text-center mt-1 space-y-1 sm:space-y-2 font-tech-body"
        style={{ transform: `translate3d(${parallax.x * 0.3}px, ${parallax.y * 0.3}px, 0)` }}
      >
        <h1
          className="font-tech-header leading-tight whitespace-nowrap font-extrabold uppercase text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-white to-cyan-300 drop-shadow-[0_0_25px_rgba(52,211,153,0.5)]"
          style={{
            fontSize: 'clamp(1.2rem, min(7.5vh, 3.2vw), 2.8rem)',
            letterSpacing: '0.08em',
          }}
        >
          Laboratorio #6: Árbol Binario Simple
        </h1>

        <div className="flex items-center justify-center gap-3 text-emerald-200/90 text-sm sm:text-base font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="h-[1px] w-10 sm:w-24 bg-gradient-to-r from-transparent to-emerald-400" />
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
          </div>
          <span className="tracking-wide font-bold text-slate-200 uppercase text-xs sm:text-base">
            Estructuras No Lineales (No de Búsqueda)
          </span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
            <span className="h-[1px] w-10 sm:w-24 bg-gradient-to-l from-transparent to-cyan-400" />
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          </div>
        </div>
      </header>

      {/* ZONA CENTRAL: Opción limpia y centrada para el panel de árboles */}
      <main
        className="relative z-10 max-w-xl mx-auto w-full flex-1 min-h-0 flex items-center justify-center py-4 font-tech-body"
        style={{ transform: `translate3d(${parallax.x * 0.6}px, ${parallax.y * 0.6}px, 0)` }}
      >
        <button
          onClick={() => handleAction(onSelectArboles)}
          onMouseEnter={playHoverSound}
          className="group relative w-full bg-[#0f1426]/85 backdrop-blur-xl border border-emerald-500/40 hover:border-emerald-300 shadow-[0_0_35px_rgba(52,211,153,0.22)] hover:shadow-[0_0_65px_rgba(52,211,153,0.5)] rounded-3xl p-8 sm:p-12 flex flex-col items-center justify-center text-center transition-all duration-300 hover:-translate-y-2 cursor-pointer"
        >
          {/* Indicador de estado */}
          <span className="absolute top-4 right-4 w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399] group-hover:scale-125 transition-transform duration-300" />

          {/* Tag de ejercicio */}
          <span className="absolute top-4 left-4 px-3 py-1 rounded-md text-xs sm:text-sm font-bold tracking-wider uppercase border bg-emerald-500/10 text-emerald-300 border-emerald-500/30 font-tech-header">
            01
          </span>

          {/* Icono central de Árbol */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 group-hover:bg-emerald-500/20 group-hover:border-emerald-400 flex items-center justify-center mb-5 transition-all duration-300 shadow-[0_0_25px_rgba(52,211,153,0.25)]">
            <Network className="w-12 h-12 sm:w-14 sm:h-14 text-emerald-300 group-hover:scale-110 transition-transform duration-300" />
          </div>

          {/* Título limpio de la opción */}
          <h2 className="font-tech-header text-2xl sm:text-3xl font-extrabold uppercase tracking-wider text-emerald-200 group-hover:text-emerald-100 transition-colors">
            Árbol Binario Simple
          </h2>
        </button>
      </main>

      {/* FOOTER: Botón 'Atrás' */}
      <footer
        className="relative z-10 shrink-0 flex justify-end px-3 sm:px-6 pb-2 pt-1 font-tech-body"
        style={{ transform: `translate3d(${parallax.x * 0.4}px, 0, 0)` }}
      >
        <button
          onClick={() => handleAction(onBack)}
          onMouseEnter={playHoverSound}
          className="relative inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-[length:200%_auto] hover:bg-right shadow-lg shadow-indigo-600/40 hover:shadow-purple-500/70 hover:-translate-y-1 active:translate-y-0 active:scale-95 transition-all duration-300 group cursor-pointer border border-indigo-300/30"
        >
          <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1.5 transition-transform duration-300" />
          <span className="font-tech-header text-sm tracking-wider">Atrás</span>
        </button>
      </footer>
    </div>
  );
};

export const StacksQueuesMenuPanel = LinearMenuPanel;
export const PilasColasMenuPanel = LinearMenuPanel;
export default LinearMenuPanel;