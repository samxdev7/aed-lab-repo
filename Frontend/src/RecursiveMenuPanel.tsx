import React, { useEffect, useRef } from 'react';
import hanoiImg from './assets/Torre de Hanoi.png';
import frogImg from './assets/Salto de la Rana.png';
import queensImg from './assets/Reinas.png';
import quickSortImg from './assets/Quick Sort.png';

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
      tag: "EJERCICIO 01",
      image: hanoiImg,
      onClick: onSelectHanoi,
      badgeBg: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
      accentGlow: "shadow-[0_0_35px_rgba(34,211,238,0.2)] hover:shadow-[0_0_55px_rgba(34,211,238,0.45)]",
      borderColor: "border-cyan-500/40 hover:border-cyan-300",
      dotColor: "bg-cyan-400 shadow-[0_0_12px_#22d3ee]",
      imgBg: "bg-cyan-500/10 border-cyan-500/30 group-hover:bg-cyan-500/20",
      imgGlow: "drop-shadow-[0_0_12px_rgba(34,211,238,0.6)]",
      titleColor: "text-cyan-200 group-hover:text-cyan-100",
    },
    {
      title: "Salto de la Rana",
      tag: "EJERCICIO 02",
      image: frogImg,
      onClick: onSelectFrog,
      badgeBg: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
      accentGlow: "shadow-[0_0_35px_rgba(52,211,153,0.2)] hover:shadow-[0_0_55px_rgba(52,211,153,0.45)]",
      borderColor: "border-emerald-500/40 hover:border-emerald-300",
      dotColor: "bg-emerald-400 shadow-[0_0_12px_#34d399]",
      imgBg: "bg-emerald-500/10 border-emerald-500/30 group-hover:bg-emerald-500/20",
      imgGlow: "drop-shadow-[0_0_12px_rgba(52,211,153,0.6)]",
      titleColor: "text-emerald-200 group-hover:text-emerald-100",
    },
    {
      title: "8 Reinas",
      tag: "EJERCICIO 03",
      image: queensImg,
      onClick: onSelectQueens,
      badgeBg: "bg-purple-500/10 text-purple-300 border-purple-500/30",
      accentGlow: "shadow-[0_0_35px_rgba(168,85,247,0.2)] hover:shadow-[0_0_55px_rgba(168,85,247,0.45)]",
      borderColor: "border-purple-500/40 hover:border-purple-300",
      dotColor: "bg-purple-400 shadow-[0_0_12px_#a855f7]",
      imgBg: "bg-purple-500/10 border-purple-500/30 group-hover:bg-purple-500/20",
      imgGlow: "drop-shadow-[0_0_12px_rgba(168,85,247,0.6)]",
      titleColor: "text-purple-200 group-hover:text-purple-100",
    },
    {
      title: "Ordenamiento Rápido",
      tag: "EJERCICIO 04",
      image: quickSortImg,
      onClick: onSelectQuickSort,
      badgeBg: "bg-amber-500/10 text-amber-300 border-amber-500/30",
      accentGlow: "shadow-[0_0_35px_rgba(251,191,36,0.2)] hover:shadow-[0_0_55px_rgba(251,191,36,0.45)]",
      borderColor: "border-amber-500/40 hover:border-amber-300",
      dotColor: "bg-amber-400 shadow-[0_0_12px_#fbbf24]",
      imgBg: "bg-amber-500/10 border-amber-500/30 group-hover:bg-amber-500/20",
      imgGlow: "drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]",
      titleColor: "text-amber-200 group-hover:text-amber-100",
    },
  ];

  return (
    <div className="relative h-[100dvh] w-screen bg-[#090b16] text-white flex flex-col justify-between p-3 sm:p-4 overflow-hidden select-none">
      
      {/* Importación de fuentes legibles y limpias */}
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
        `}
      </style>

      {/* Canvas para Fondo de Red de Algoritmos */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none opacity-60" />

      {/* Destellos Ambientales Neón */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-indigo-600/15 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute -bottom-28 -left-28 w-[500px] h-[500px] bg-purple-700/20 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute -bottom-28 -right-28 w-[500px] h-[500px] bg-cyan-600/20 rounded-full blur-[150px] pointer-events-none" />

      {/* Grid de Puntos Estilizados */}
      <div 
        className="absolute top-12 left-10 w-32 h-32 opacity-15 pointer-events-none hidden lg:block"
        style={{ backgroundImage: `radial-gradient(#ffffff 2px, transparent 2px)`, backgroundSize: '14px 14px' }}
      />
      <div 
        className="absolute top-12 right-10 w-32 h-32 opacity-15 pointer-events-none hidden lg:block"
        style={{ backgroundImage: `radial-gradient(#ffffff 2px, transparent 2px)`, backgroundSize: '14px 14px' }}
      />

      {/* Encabezado Principal */}
      <header className="relative z-10 text-center mt-0 space-y-1 sm:space-y-2 font-tech-body">
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
            Selecciona el ejercicio que deseas trabajar
          </span>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_10px_#c084fc]" />
            <span className="h-[1px] w-10 sm:w-24 bg-gradient-to-l from-transparent to-purple-400" />
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
          </div>
        </div>
      </header>

      {/* Grid de Ejercicios Recursivos */}
      <main className="relative z-10 max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-3 my-auto py-1 font-tech-body">
        {exercises.map((item, index) => (
          <button
            key={index}
            onClick={item.onClick}
            className={`group relative bg-[#0f1426]/85 backdrop-blur-xl border ${item.borderColor} ${item.accentGlow} rounded-2xl p-3 flex flex-col items-center justify-center text-center transition-all duration-300 hover:-translate-y-2 cursor-pointer`}
          >
            {/* Indicador LED Neón de Estado */}
            <span className={`absolute top-3 right-3 w-2.5 h-2.5 rounded-full ${item.dotColor} group-hover:scale-125 transition-transform duration-300`} />

            {/* Badge Superior */}
            <span className={`px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold tracking-wider uppercase border ${item.badgeBg} font-tech-header mb-1`}>
              {item.tag}
            </span>

            {/* Contenedor Render 3D / Imagen */}
            <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl ${item.imgBg} border flex items-center justify-center mb-1 p-1 group-hover:scale-110 transition-all duration-300 overflow-hidden`}>
              <img
                src={item.image}
                alt={item.title}
                className={`w-full h-full object-contain ${item.imgGlow}`}
              />
            </div>

            {/* Título del Ejercicio */}
            <h2 className={`font-tech-header text-lg sm:text-xl font-extrabold uppercase tracking-wide transition-colors ${item.titleColor}`}>
              {item.title}
            </h2>
          </button>
        ))}
      </main>

      {/* Botón Atrás con Animación Neón */}
      <footer className="relative z-10 flex justify-start p-1 font-tech-body">
        <button
          onClick={onBack}
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