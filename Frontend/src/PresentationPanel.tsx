import React, { useEffect, useRef, useState } from 'react';
import joksanImg from './assets/Joksan.jpg';
import gabrielaImg from './assets/Gabriela.jpg';
import samuelImg from './assets/Samuel.jpg';
import { useMouseParallax } from './useMouseParallax';
import { useSoundEffects } from './useSoundEffects';

interface PresentationPanelProps {
  onNext: () => void;
}

export const PresentationPanel: React.FC<PresentationPanelProps> = ({ onNext }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const parallax = useMouseParallax(12);
  const { playHoverSound, playClickSound } = useSoundEffects();

  const handleNext = () => {
    playClickSound();
    onNext();
  };

    // Minipanel de mensaje: guarda el índice del integrante seleccionado
  const [selected, setSelected] = useState<number | null>(null);

  const openModal = (index: number) => {
    playClickSound();
    setSelected(index);
  };

  const closeModal = () => {
    playClickSound();
    setSelected(null);
  };

  // Cerrar con la tecla Esc
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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

    // Definición de partículas
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

      // Dibujar partículas y conexiones
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

  const members = [
    {
      name: "Joksan David Escobar Velásquez",
      carnet: "2025-1468U",
      role: "DESARROLLADOR FRONTEND",
      image: joksanImg,
      badgeBg: "bg-purple-500/10 text-purple-300 border-purple-500/30",
      accentGlow: "shadow-[0_0_35px_rgba(168,85,247,0.25)] hover:shadow-[0_0_50px_rgba(168,85,247,0.45)]",
      borderColor: "border-purple-500/30 hover:border-purple-400",
      dotColor: "bg-purple-400 shadow-[0_0_12px_#a855f7]",
      ringColor: "border-purple-500/60 border-t-purple-300",
      carnetColor: "text-purple-400",
      lineGradient: "from-purple-500/80 to-indigo-500/80",
      modalBorder: "border-purple-400/60",
      modalGlow: "shadow-[0_0_80px_rgba(168,85,247,0.35)]",
      message: "Holaaa, a mi me toco la parte del frontend, la verdad lo puede confirmar con mis compañeros me encanta el frontend amo el diseño y deseo seguir mejorando en ello, se que estos laboratorios me han ayudado a implementar y despertar aun mas mi creatividad con respecto al diseño y claro usar la IA a mi favor jajaja, con respecto al diseño de todo el lab puedo decir que lo elegi yo todo este toque de efectos neón me parece muy bonito.",
      contributions: ["Frontend completo del panel de las 8 Reinas.", "Frontend completo del panel de Ordenamiento Rápido.", "Revisión general de los paneles para que siguiera al pie de la letra el diseño general del laboratorio.", "Implementación de mejoras de diseño de igual manera generalmente a todo el laboratorio."],
    },
    {
      name: "Gabriela Abigail Ruiz Rodríguez",
      carnet: "2025-0240U",
      role: "DESAROLLADORA FULLSTACK",
      image: gabrielaImg,
      badgeBg: "bg-amber-500/10 text-amber-300 border-amber-500/30",
      accentGlow: "shadow-[0_0_35px_rgba(251,191,36,0.25)] hover:shadow-[0_0_50px_rgba(251,191,36,0.45)]",
      borderColor: "border-amber-500/30 hover:border-amber-400",
      dotColor: "bg-amber-400 shadow-[0_0_12px_#fbbf24]",
      ringColor: "border-amber-500/60 border-t-amber-300",
      carnetColor: "text-amber-400",
      lineGradient: "from-amber-500/80 to-orange-500/80",
      modalBorder: "border-amber-400/60",
      modalGlow: "shadow-[0_0_80px_rgba(251,191,36,0.3)]",
      message: "Hellouu, me gusta mucho aprender cosas nuevas y descubrir cómo funcionan. Reconozco que no soy la mejor, pero siempre intento dar lo mejor de mí a pesar de las dificultades. Durante estos labs he aprendido bastante gracias a mis compañeros y a las experiencias que hemos tenido trabajando. También he tenido la oportunidad de aprender tanto de backend como de frontend, lo cual me ha permitido conocer herramientas y cosas que antes no manejaba. Me gusta aprender paso a paso, investigar cuando no entiendo algo y buscar la manera de resolver los problemas que van apareciendo. Espero seguir aprendiendo, mejorar mucho más mis habilidades y poder aportar más al equipo.",
      contributions: ["Backend de las torres de Hanoi.", "Backend de el salto de ranita.", "Frontend de las torres de Hanoi.", "Frontend de el salto de ranita.", "Tenerle paciencia a mis compitas y sus quejas de mis animaciones, ajskjsdkjsdjsdja Bromitaaa."],
    },
    {
      name: "Samuel Enrique Rueda Ruiz",
      carnet: "2025-2104U",
      role: "DESARROLLADOR BACKEND",
      image: samuelImg,
      badgeBg: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
      accentGlow: "shadow-[0_0_35px_rgba(34,211,238,0.25)] hover:shadow-[0_0_50px_rgba(34,211,238,0.45)]",
      borderColor: "border-cyan-500/30 hover:border-cyan-400",
      dotColor: "bg-cyan-400 shadow-[0_0_12px_#22d3ee]",
      ringColor: "border-cyan-500/60 border-t-cyan-300",
      carnetColor: "text-cyan-400",
      lineGradient: "from-cyan-500/80 to-blue-500/80",
            modalBorder: "border-cyan-400/60",
      modalGlow: "shadow-[0_0_80px_rgba(34,211,238,0.3)]",
      message: "Buenas, además de ser un autodidacta con la potencia a un overclock enfermo, me la paso aprendiendo y volviéndome más enfermo cada día por pura pasión. Entre lo que me gusta hacer es explotar a mis compañeros de clases, estudiar matemática (no importa que rama, es lo segundo más bello que tiene este universo), poner en práctica desarrollo web, desbaratar mi computadora con Linux, volverme más pro hacker, etc.",
      contributions: [
      "Backend completo de las ocho reinas.",
      "Backend completo de Quicksort.",
      "Mejoras leves de Frontend de Quicksort.",
      "Supervisión y control de calidad de código y versionado de laboratorio.",
      "Documento de lab #3 (tocó ..... CONIOOOOOOOOOOOOOOO).",
      ],
    },
  ];

  const selectedMember = selected !== null ? members[selected] : null;

  return (
    <div className="relative h-[100dvh] w-screen bg-[#090b16] text-white flex flex-col justify-between p-3 sm:p-4 overflow-hidden select-none">
      
      {/* Importación de fuentes legibles y limpias */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Lora:ital,wght@0,400;0,500;0,600;1,400&display=swap');
          
          .font-tech-header {
            font-family: 'Rajdhani', sans-serif;
            letter-spacing: 0.08em;
          }
          .font-tech-body {
            font-family: 'Plus Jakarta Sans', sans-serif;
          }

          .font-elegant {
            font-family: 'Century Schoolbook', 'Century', 'Lora', Georgia, serif;
          }

          @keyframes spin-slow {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .animate-spin-slow {
            animation: spin-slow 12s linear infinite;
          }
            @keyframes modal-in {
            0% { opacity: 0; transform: translateY(24px) scale(0.92); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes backdrop-in {
            0% { opacity: 0; }
            100% { opacity: 1; }
          }
          .animate-modal-in { animation: modal-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) both; }
          .animate-backdrop-in { animation: backdrop-in 0.25s ease-out both; }
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
        {/* Título de la Universidad con Gradiente y Resplandor Cyberpunk */}
        <h1 className="font-tech-header text-xl sm:text-3xl md:text-4xl font-extrabold uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-purple-300 drop-shadow-[0_0_25px_rgba(168,85,247,0.5)]">
          Universidad Nacional de Ingeniería
        </h1>

        {/* Separador Cyberpunk */}
        <div className="flex items-center justify-center gap-3 text-purple-200/90 text-xs sm:text-sm font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span className="h-[1px] w-12 sm:w-28 bg-gradient-to-r from-transparent to-cyan-400" />
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
          </div>
          
          <span className="tracking-wide font-bold text-slate-200 uppercase text-xs sm:text-base">
            Algoritmización y Estructuras de Datos
          </span>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_10px_#c084fc]" />
            <span className="h-[1px] w-12 sm:w-28 bg-gradient-to-l from-transparent to-purple-400" />
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
          </div>
        </div>

        {/* Badge de Carrera con Efecto Glassmorphism */}
        <div className="inline-block pt-1">
          <div className="px-6 py-2 rounded-full bg-[#11162b]/80 backdrop-blur-xl text-slate-300 text-xs sm:text-sm border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
            Carrera: <span className="font-bold text-cyan-300 tracking-wider font-tech-header text-base">INGENIERÍA EN COMPUTACIÓN</span>
          </div>
        </div>
      </header>

      {/* Sección de Integrantes */}
      <main 
        className="relative z-10 max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-3 my-auto py-1 font-tech-body transition-transform duration-75"
        style={{ transform: `translate3d(${parallax.x * 0.6}px, ${parallax.y * 0.6}px, 0)` }}
      >
        {members.map((member, index) => (
          <div
            key={index}
            onMouseEnter={playHoverSound}
            onClick={() => openModal(index)}
            className={`group relative bg-[#0f1426]/85 backdrop-blur-xl border ${member.borderColor} ${member.accentGlow} rounded-3xl p-3 flex flex-col items-center text-center transition-all duration-500 hover:-translate-y-3 cursor-pointer`}
          >
            {/* Indicador LED Neón de Estado */}
            <span className={`absolute top-3 right-3 w-2.5 h-2.5 rounded-full ${member.dotColor} group-hover:scale-125 transition-transform duration-300`} />

            {/* Foto con Anillo Holográfico Giratorio */}
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 mb-2 flex items-center justify-center">
              {/* Anillo de Carga / Holo */}
              <div className={`absolute inset-0 rounded-full border-2 border-dashed ${member.ringColor} animate-spin-slow pointer-events-none`} />
              
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-white/20 shadow-inner bg-slate-900/80 flex items-center justify-center">
                {member.image ? (
                  <img src={member.image} alt={member.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                  <svg className="w-8 h-8 stroke-current text-slate-400" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
              </div>
            </div>

            {/* Badge de Rol / Etiqueta Tech - Ahora súper legible */}
            <span className="mt-1 text-[9px] uppercase tracking-widest text-slate-400/70 group-hover:text-white transition-colors">
              Clic para conocerme
            </span>

            {/* Nombre del Integrante */}
            <h3 className="font-bold text-xs sm:text-sm text-white leading-tight min-h-[2rem] flex items-center justify-center tracking-wide">
              {member.name}
            </h3>
            
            {/* Línea Decorativa con Gradiente */}
            <span className={`w-8 h-1 rounded-full bg-gradient-to-r ${member.lineGradient} my-1 transition-all group-hover:w-12 duration-300`} />

            {/* Carnet Universitario */}
            <span className={`text-sm ${member.carnetColor} tracking-widest font-tech-header font-bold`}>
              {member.carnet}
            </span>
          </div>
        ))}
      </main>

      {/* Botón Siguiente con Animación Neón */}
      <footer 
        className="relative z-10 flex justify-end p-1 font-tech-body transition-transform duration-75"
        style={{ transform: `translate3d(${parallax.x * 0.4}px, ${parallax.y * 0.4}px, 0)` }}
      >
        <button
          onClick={handleNext}
          onMouseEnter={playHoverSound}
          className="relative inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-[length:200%_auto] hover:bg-right shadow-lg shadow-indigo-600/40 hover:shadow-purple-500/70 hover:-translate-y-1 active:translate-y-0 active:scale-95 transition-all duration-300 group cursor-pointer border border-indigo-300/30"
        >
          <span className="font-tech-header text-base tracking-wider">Siguiente</span>
          <svg 
            className="w-5 h-5 transform group-hover:translate-x-1.5 transition-transform duration-300" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </footer>
      {/* ===== INICIO MINIPANEL DE MENSAJE ===== */}
      {selectedMember && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-[#03060d]/80 backdrop-blur-md animate-backdrop-in"
          onClick={closeModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full max-w-4xl max-h-[90dvh] overflow-y-auto rounded-3xl border ${selectedMember.modalBorder} ${selectedMember.modalGlow} bg-[#0f1426]/95 p-5 sm:p-7 font-tech-body animate-modal-in`}
          >
            {/* Botón cerrar */}
            <button
              onClick={closeModal}
              onMouseEnter={playHoverSound}
              aria-label="Cerrar"
              className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-white bg-white/10 hover:bg-white/20 border border-white/20 hover:rotate-90 active:scale-90 transition-all duration-300 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>

            {/* Cabecera: foto + datos (centrada) */}
            <div className="flex items-center justify-center gap-5 px-10">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 flex items-center justify-center">
                <div className={`absolute inset-0 rounded-full border-2 border-dashed ${selectedMember.ringColor} animate-spin-slow`} />
                <img
                  src={selectedMember.image}
                  alt={selectedMember.name}
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-white/20"
                />
              </div>
              <div className="min-w-0 text-center">
                <span className={`inline-block px-2 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase border ${selectedMember.badgeBg} font-tech-header`}>
                  {selectedMember.role}
                </span>
                <h2 className="mt-1 text-lg sm:text-2xl font-extrabold text-white leading-tight">
                  {selectedMember.name}
                </h2>
                <span className={`block text-sm ${selectedMember.carnetColor} tracking-widest font-tech-header font-bold`}>
                  {selectedMember.carnet}
                </span>
              </div>
            </div>

            <span className={`block h-1 w-full rounded-full bg-gradient-to-r ${selectedMember.lineGradient} my-4 opacity-70`} />

            {/* Contenido: mensaje + aportes */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
              <div className="md:col-span-3">
                <h3 className={`font-tech-header text-sm tracking-[0.2em] uppercase mb-2 ${selectedMember.carnetColor}`}>
                  Sobre mí
                </h3>
                <p className="font-elegant text-base sm:text-lg leading-relaxed text-slate-100 text-justify">
                  {selectedMember.message}
                </p>
              </div>

              <div className="md:col-span-2 rounded-2xl bg-white/5 border border-white/10 p-4">
                <h3 className={`font-tech-header text-sm tracking-[0.2em] uppercase mb-2 ${selectedMember.carnetColor}`}>
                  Aportes al Laboratorio #3
                </h3>
                <ul className="space-y-2 text-left">
                  {selectedMember.contributions.map((item, i) => (
                    <li key={i} className="font-elegant flex items-start gap-2 text-sm sm:text-base text-slate-200 leading-snug">
                      <span className={`mt-1.5 w-2 h-2 shrink-0 rounded-full ${selectedMember.dotColor}`} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ===== FIN MINIPANEL DE MENSAJE ===== */}
    </div>
  );
};