import React, { useEffect, useRef } from 'react';
import { useMouseParallax } from './useMouseParallax';
import { useSoundEffects } from './useSoundEffects';

// --- Iconos SVG Neón ---
const HanoiIcon = () => (
  <svg viewBox="0 0 64 64" className="w-full h-full stroke-cyan-400 fill-transparent stroke-2 overflow-visible drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">
    {/* Base y Postes */}
    <line x1="4" y1="56" x2="60" y2="56" className="stroke-[3px] stroke-cyan-500" />
    <line x1="16" y1="20" x2="16" y2="56" className="stroke-cyan-600" />
    <line x1="32" y1="20" x2="32" y2="56" className="stroke-cyan-600" />
    <line x1="48" y1="20" x2="48" y2="56" className="stroke-cyan-600" />
    {/* Discos */}
    <rect x="6" y="48" width="20" height="6" rx="3" className="fill-cyan-500/80 stroke-cyan-200 group-hover:animate-[hanoi-move-base_1.5s_ease-in-out_infinite]" />
    <rect x="8" y="40" width="16" height="6" rx="3" className="fill-cyan-400/80 stroke-cyan-100 group-hover:animate-[hanoi-move-mid_1.5s_ease-in-out_infinite_0.2s]" />
    <rect x="10" y="32" width="12" height="6" rx="3" className="fill-cyan-300/80 stroke-white group-hover:animate-[hanoi-move-top_1.5s_ease-in-out_infinite_0.4s]" />
  </svg>
);

const FrogIcon = () => (
  <svg viewBox="0 0 64 64" className="w-full h-full stroke-emerald-400 fill-emerald-500/40 stroke-2 overflow-visible drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]">
    {/* Rama / Nenúfar */}
    <ellipse cx="32" cy="56" rx="24" ry="4" className="fill-emerald-900/60 stroke-emerald-600" />
    <path d="M 16 56 Q 8 50 12 44" className="stroke-emerald-600 fill-transparent" />
    <path d="M 48 56 Q 56 50 52 44" className="stroke-emerald-600 fill-transparent" />
    {/* Rana */}
    <g className="group-hover:animate-[frog-jump_1s_ease-in-out_infinite]">
      {/* Patas */}
      <path d="M 20 46 Q 12 40 14 54" className="fill-transparent stroke-emerald-300" />
      <path d="M 44 46 Q 52 40 50 54" className="fill-transparent stroke-emerald-300" />
      {/* Cuerpo */}
      <ellipse cx="32" cy="44" rx="14" ry="10" className="fill-emerald-500/80 stroke-emerald-200" />
      {/* Ojos */}
      <circle cx="26" cy="36" r="4" className="fill-emerald-900 stroke-emerald-300" />
      <circle cx="38" cy="36" r="4" className="fill-emerald-900 stroke-emerald-300" />
      <circle cx="26" cy="36" r="1.5" className="fill-emerald-300 stroke-none" />
      <circle cx="38" cy="36" r="1.5" className="fill-emerald-300 stroke-none" />
    </g>
  </svg>
);

const QueenIcon = () => (
  <svg viewBox="0 0 64 64" className="w-full h-full stroke-purple-400 fill-purple-500/40 stroke-2 overflow-visible drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]">
    <g className="origin-bottom group-hover:animate-[queen-wobble_1s_ease-in-out_infinite]">
      {/* Base */}
      <path d="M 20 56 L 44 56 L 40 50 L 24 50 Z" className="fill-purple-600/80 stroke-purple-300" />
      {/* Cuerpo */}
      <path d="M 26 50 C 26 30 20 20 20 20 C 28 28 32 28 32 16 C 32 28 36 28 44 20 C 44 20 38 30 38 50 Z" className="fill-purple-500/60 stroke-purple-300" />
      {/* Joyas */}
      <circle cx="20" cy="18" r="2.5" className="fill-purple-200 stroke-purple-100" />
      <circle cx="32" cy="14" r="2.5" className="fill-purple-200 stroke-purple-100" />
      <circle cx="44" cy="18" r="2.5" className="fill-purple-200 stroke-purple-100" />
    </g>
  </svg>
);

const QuickSortIcon = () => (
  <svg viewBox="0 0 64 64" className="w-full h-full stroke-amber-400 fill-amber-500/50 stroke-2 overflow-visible drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]">
    {/* Base line */}
    <line x1="8" y1="56" x2="56" y2="56" className="stroke-[3px] stroke-amber-600" />
    {/* Barras animadas */}
    <rect x="12" y="32" width="6" height="24" className="fill-amber-300/80 stroke-amber-100 group-hover:animate-[bar-1_1.2s_ease-in-out_infinite]" />
    <rect x="22" y="16" width="6" height="40" className="fill-amber-400/80 stroke-amber-200 group-hover:animate-[bar-2_1.2s_ease-in-out_infinite]" />
    <rect x="32" y="40" width="6" height="16" className="fill-amber-500/80 stroke-amber-300 group-hover:animate-[bar-3_1.2s_ease-in-out_infinite]" />
    <rect x="42" y="24" width="6" height="32" className="fill-amber-600/80 stroke-amber-400 group-hover:animate-[bar-4_1.2s_ease-in-out_infinite]" />
  </svg>
);


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
  const { playHoverSound, playClickSound, playDiskSound, playFrogSound, playChessSound, playBarsSound } = useSoundEffects();

  const handleAction = (action: () => void) => {
    playClickSound();
    action();
  };

  // Fondo Dinámico de Nodos/Algoritmos
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

    const numParticles = 45;
    const particles = Array.from({ length: numParticles }, () => ({
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
      title: "Torres de Hanoi",
      tag: "01",
      Icon: HanoiIcon,
      onHoverSound: playDiskSound,
      onClick: () => handleAction(onSelectHanoi),
      badgeBg: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
      accentGlow: "shadow-[0_0_35px_rgba(34,211,238,0.2)] hover:shadow-[0_0_55px_rgba(34,211,238,0.45)]",
      borderColor: "border-cyan-500/40 hover:border-cyan-300",
      dotColor: "bg-cyan-400 shadow-[0_0_12px_#22d3ee]",
      imgBg: "bg-cyan-500/10 border-cyan-500/30 group-hover:bg-cyan-500/20",
      titleColor: "text-cyan-200 group-hover:text-cyan-100",
    },
    {
      title: "Salto de la Rana",
      tag: "02",
      Icon: FrogIcon,
      onHoverSound: playFrogSound,
      onClick: () => handleAction(onSelectFrog),
      badgeBg: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
      accentGlow: "shadow-[0_0_35px_rgba(52,211,153,0.2)] hover:shadow-[0_0_55px_rgba(52,211,153,0.45)]",
      borderColor: "border-emerald-500/40 hover:border-emerald-300",
      dotColor: "bg-emerald-400 shadow-[0_0_12px_#34d399]",
      imgBg: "bg-emerald-500/10 border-emerald-500/30 group-hover:bg-emerald-500/20",
      titleColor: "text-emerald-200 group-hover:text-emerald-100",
    },
    {
      title: "8 Reinas",
      tag: "03",
      Icon: QueenIcon,
      onHoverSound: playChessSound,
      onClick: () => handleAction(onSelectQueens),
      badgeBg: "bg-purple-500/10 text-purple-300 border-purple-500/30",
      accentGlow: "shadow-[0_0_35px_rgba(168,85,247,0.2)] hover:shadow-[0_0_55px_rgba(168,85,247,0.45)]",
      borderColor: "border-purple-500/40 hover:border-purple-300",
      dotColor: "bg-purple-400 shadow-[0_0_12px_#a855f7]",
      imgBg: "bg-purple-500/10 border-purple-500/30 group-hover:bg-purple-500/20",
      titleColor: "text-purple-200 group-hover:text-purple-100",
    },
    {
      title: "Ordenamiento Rápido",
      tag: "04",
      Icon: QuickSortIcon,
      onHoverSound: playBarsSound,
      onClick: () => handleAction(onSelectQuickSort),
      badgeBg: "bg-amber-500/10 text-amber-300 border-amber-500/30",
      accentGlow: "shadow-[0_0_35px_rgba(251,191,36,0.2)] hover:shadow-[0_0_55px_rgba(251,191,36,0.45)]",
      borderColor: "border-amber-500/40 hover:border-amber-300",
      dotColor: "bg-amber-400 shadow-[0_0_12px_#fbbf24]",
      imgBg: "bg-amber-500/10 border-amber-500/30 group-hover:bg-amber-500/20",
      titleColor: "text-amber-200 group-hover:text-amber-100",
    },
  ];

  return (
    <div className="relative h-[100dvh] w-screen bg-[#090b16] text-white flex flex-col justify-between p-3 sm:p-4 overflow-hidden select-none">
      
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap');
          
          .font-tech-header {
            font-family: 'Rajdhani', sans-serif;
            letter-spacing: 0.08em;
          }
          .font-tech-body {
            font-family: 'Plus Jakarta Sans', sans-serif;
          }

          /* Animaciones de Hover para SVGs */
          @keyframes hanoi-move-base {
            0%, 100% { transform: translate(0, 0); }
            50% { transform: translate(32px, 0); }
          }
          @keyframes hanoi-move-mid {
            0%, 100% { transform: translate(0, 0); }
            50% { transform: translate(32px, 0); }
          }
          @keyframes hanoi-move-top {
            0%, 100% { transform: translate(0, 0); }
            50% { transform: translate(16px, 16px); }
          }

          @keyframes frog-jump {
            0%, 100% { transform: translateY(0) scale(1); }
            40% { transform: translateY(-16px) scale(1.05) rotate(5deg); }
            60% { transform: translateY(-16px) scale(1.05) rotate(-5deg); }
          }

          @keyframes queen-wobble {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(-8deg); }
            75% { transform: rotate(8deg); }
          }

          @keyframes bar-1 {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); height: 32px; }
          }
          @keyframes bar-2 {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(16px); height: 24px; }
          }
          @keyframes bar-3 {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-24px); height: 40px; }
          }
          @keyframes bar-4 {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(16px); height: 16px; }
          }
        `}
      </style>

      {/* Canvas para Fondo de Red de Algoritmos */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none opacity-60" />

      {/* Destellos Ambientales Neón */}
      <div 
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-indigo-600/15 rounded-full blur-[160px] pointer-events-none" 
        style={{ transform: `translate3d(${parallax.x * 0.5}px, ${parallax.y * 0.5}px, 0)` }}
      />
      <div 
        className="absolute -bottom-28 -left-28 w-[500px] h-[500px] bg-purple-700/20 rounded-full blur-[150px] pointer-events-none" 
        style={{ transform: `translate3d(${parallax.x * 0.8}px, ${parallax.y * 0.8}px, 0)` }}
      />
      <div 
        className="absolute -bottom-28 -right-28 w-[500px] h-[500px] bg-cyan-600/20 rounded-full blur-[150px] pointer-events-none" 
        style={{ transform: `translate3d(${parallax.x * -0.6}px, ${parallax.y * -0.6}px, 0)` }}
      />

      {/* Grid de Puntos Estilizados */}
      <div 
        className="absolute top-12 left-10 w-32 h-32 opacity-15 pointer-events-none hidden lg:block transition-transform duration-75"
        style={{ 
          backgroundImage: `radial-gradient(#ffffff 2px, transparent 2px)`, 
          backgroundSize: '14px 14px',
          transform: `translate3d(${parallax.x * -1}px, ${parallax.y * -1}px, 0)` 
        }}
      />
      <div 
        className="absolute top-12 right-10 w-32 h-32 opacity-15 pointer-events-none hidden lg:block transition-transform duration-75"
        style={{ 
          backgroundImage: `radial-gradient(#ffffff 2px, transparent 2px)`, 
          backgroundSize: '14px 14px',
          transform: `translate3d(${parallax.x}px, ${parallax.y}px, 0)` 
        }}
      />

      {/* Encabezado Principal */}
      <header 
        className="relative z-10 text-center mt-0 space-y-1 sm:space-y-2 font-tech-body transition-transform duration-75"
        style={{ transform: `translate3d(${parallax.x * 0.3}px, ${parallax.y * 0.3}px, 0)` }}
      >
        <h1 className="font-tech-header text-xl sm:text-2xl md:text-3xl font-extrabold uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-purple-300 drop-shadow-[0_0_25px_rgba(168,85,247,0.5)]">
          Laboratorio #3: Algoritmos Recursivos
        </h1>

        {/* Separador Cyberpunk */}
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

      {/* Grid de Ejercicios Recursivos */}
      <main 
        className="relative z-10 max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 my-auto py-2 font-tech-body transition-transform duration-75"
        style={{ transform: `translate3d(${parallax.x * 0.6}px, ${parallax.y * 0.6}px, 0)` }}
      >
        {exercises.map((item, index) => (
          <button
            key={index}
            onClick={item.onClick}
            onMouseEnter={item.onHoverSound}
            className={`group relative bg-[#0f1426]/85 backdrop-blur-xl border ${item.borderColor} ${item.accentGlow} rounded-2xl p-3 flex flex-col items-center justify-center text-center transition-all duration-300 hover:-translate-y-2 cursor-pointer min-h-[120px] lg:min-h-[130px]`}
          >
            {/* Indicador LED Neón de Estado */}
            <span className={`absolute top-3 right-3 w-2.5 h-2.5 rounded-full ${item.dotColor} group-hover:scale-125 transition-transform duration-300`} />

            {/* Badge Superior (Número en la esquina superior izquierda) */}
            <span className={`absolute top-3 left-3 px-2 py-1 rounded-md text-xs sm:text-sm font-bold tracking-wider uppercase border ${item.badgeBg} font-tech-header`}>
              {item.tag}
            </span>

            {/* Contenedor Render 3D / Imagen SVG */}
            <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl ${item.imgBg} border flex items-center justify-center mb-1 p-2 transition-all duration-300 mt-2`}>
              <item.Icon />
            </div>

            {/* Título del Ejercicio */}
            <h2 className={`font-tech-header text-base sm:text-lg lg:text-xl font-extrabold uppercase tracking-wide transition-colors ${item.titleColor} mt-1`}>
              {item.title}
            </h2>
          </button>
        ))}
      </main>

      {/* Botón Atrás con Animación Neón */}
      <footer 
        className="relative z-10 flex justify-start p-1 font-tech-body transition-transform duration-75"
        style={{ transform: `translate3d(${parallax.x * 0.4}px, ${parallax.y * 0.4}px, 0)` }}
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