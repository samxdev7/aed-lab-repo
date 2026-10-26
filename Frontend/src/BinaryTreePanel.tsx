import React, { useEffect, useRef } from 'react';
import { ArrowLeft, Network, Sparkles, Code2 } from 'lucide-react';
import { useSoundEffects } from './useSoundEffects';

export interface BinaryTreePanelProps {
  onBack: () => void;
}

type Particula = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  tamano: number;
};

export const BinaryTreePanel: React.FC<BinaryTreePanelProps> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { playClickSound, playHoverSound } = useSoundEffects();

  // Fondo animado de partículas y constelaciones de nodos en conexión
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let idAnimacion: number;
    let ancho = (canvas.width = window.innerWidth);
    let alto = (canvas.height = window.innerHeight);

    const alCambiarTamano = (): void => {
      ancho = canvas.width = window.innerWidth;
      alto = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', alCambiarTamano);

    const particulas: Particula[] = Array.from({ length: 48 }, () => ({
      x: Math.random() * ancho,
      y: Math.random() * alto,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      tamano: Math.random() * 2 + 1,
    }));

    const dibujar = (): void => {
      ctx.clearRect(0, 0, ancho, alto);
      for (let i = 0; i < particulas.length; i++) {
        const p = particulas[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > ancho) p.vx *= -1;
        if (p.y < 0 || p.y > alto) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.tamano, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(52, 211, 153, 0.35)'; // Tono esmeralda para árboles
        ctx.fill();

        for (let j = i + 1; j < particulas.length; j++) {
          const p2 = particulas[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 130) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(16, 185, 129, ${1 - dist / 130})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      idAnimacion = requestAnimationFrame(dibujar);
    };
    dibujar();

    return (): void => {
      window.removeEventListener('resize', alCambiarTamano);
      cancelAnimationFrame(idAnimacion);
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

          .custom-scrollbar::-webkit-scrollbar { width: 6px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: rgba(15, 20, 38, 0.6); border-radius: 4px; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(52, 211, 153, 0.3); border-radius: 4px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(52, 211, 153, 0.6); }
        `}
      </style>

      {/* Fondo: Red de partículas y destellos luminosos */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none opacity-60" />
      <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-emerald-600/15 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-cyan-600/15 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="absolute top-[30%] right-[25%] w-[35%] h-[35%] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none z-0" />

      {/* ENCABEZADO */}
      <header className="relative z-10 shrink-0 text-center px-10 pt-4 pb-2 space-y-1.5">
        <h1
          className="font-tech-header font-extrabold uppercase leading-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-white to-cyan-300 drop-shadow-[0_0_25px_rgba(52,211,153,0.45)]"
          style={{ fontSize: 'clamp(1.5rem, 6vh, 2.6rem)', letterSpacing: '0.08em' }}
        >
          Árbol Binario Simple
        </h1>

        <div className="flex items-center justify-center gap-3 text-emerald-200/90 -translate-y-1">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="h-[1px] w-10 sm:w-24 bg-gradient-to-r from-transparent to-emerald-400" />
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
          </div>
          <span className="tracking-wide font-bold text-slate-200 uppercase text-xs sm:text-base">
            LAB #6 • Estructuras No Lineales (No de Búsqueda)
          </span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
            <span className="h-[1px] w-10 sm:w-24 bg-gradient-to-l from-transparent to-cyan-400" />
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          </div>
        </div>
      </header>

      {/* ZONA CENTRAL: Espacio preparado para el desarrollo del árbol */}
      <main className="relative z-10 flex-1 min-h-0 w-full max-w-6xl mx-auto px-6 sm:px-10 py-3 flex flex-col justify-center items-center">
        <div className="w-full h-full max-h-[78vh] flex flex-col items-center justify-center bg-[#0f1426]/85 backdrop-blur-xl border border-emerald-500/35 rounded-3xl p-6 sm:p-10 shadow-[0_0_45px_rgba(16,185,129,0.18)] text-center relative overflow-hidden">
          
          {/* Luz sutil de fondo */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

          {/* Icono central de Árbol */}
          <div className="relative mb-5">
            <div className="w-24 h-24 rounded-2xl bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center shadow-[0_0_30px_rgba(52,211,153,0.3)]">
              <Network className="w-12 h-12 text-emerald-300" />
            </div>
            <span className="absolute -bottom-2 -right-2 p-1.5 rounded-lg bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.4)]">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>

          {/* Mensaje principal */}
          <h2 className="font-tech-header text-2xl sm:text-3xl font-extrabold uppercase tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 via-white to-cyan-200 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)] mb-2">
            Aquí irá la parte del panel de árboles binarios
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl font-medium mb-6">
            Espacio preparado para la integración de la lógica gráfica interactiva y construcción del árbol binario simple mediante InputDialog y ciclos iterativos.
          </p>

          {/* Tarjeta de Especificaciones Técnicas para la compañera */}
          <div className="w-full max-w-3xl bg-[#03060d]/80 border border-slate-700/60 rounded-2xl p-4 sm:p-5 text-left font-mono-tech text-xs sm:text-sm text-slate-300 shadow-inner custom-scrollbar overflow-y-auto">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800 text-emerald-300 font-bold font-tech-header text-base">
              <Code2 className="w-5 h-5 text-emerald-400" />
              <span>Especificaciones Técnicas para el Desarrollo (Lab #6):</span>
            </div>

            <ul className="space-y-2 list-none">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold shrink-0">▸</span>
                <span><strong className="text-white">Renderizado Gráfico:</strong> 0 animación (dibujo directo de nodos y aristas sin transiciones temporales).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold shrink-0">▸</span>
                <span><strong className="text-white">Tipo de Dato y Validación:</strong> Únicamente caracteres en mayúscula (A-Z, tipo <code className="text-cyan-300">char</code>), repetibles, sin minúsculas ni números.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold shrink-0">▸</span>
                <span><strong className="text-white">Flujo de Entrada (InputDialog + Ciclos):</strong> Nodo raíz → dibuja nodo → ¿Hijo izquierdo? (Sí → ingreso y dibujo) → ¿Hijo derecho? → retorno al padre hasta agotar opciones.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold shrink-0">▸</span>
                <span><strong className="text-white">Recorridos Algorítmicos:</strong> Preorden, Inorden y Posorden (con pseudocódigo y ejemplos visuales).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold shrink-0">▸</span>
                <span><strong className="text-white">Disposición Espacial:</strong> Cálculo geométrico para evitar colisiones entre nodos hijos en el lienzo.</span>
              </li>
            </ul>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="relative z-20 shrink-0 flex items-center justify-between gap-6 px-6 sm:px-10 pt-2 pb-3">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl border backdrop-blur-md text-xs font-mono-tech bg-emerald-500/10 border-emerald-400/40 text-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
          <span>Panel listo • Esperando programación del módulo de árboles</span>
        </div>

        <button
          onClick={(): void => {
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

export default BinaryTreePanel;
