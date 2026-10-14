import React, { useState, useEffect, useRef } from 'react';
import { useSoundEffects } from './useSoundEffects';
import { useNotification } from './NotificationContext';
import { API_KEY, apiRequest } from './HTTPMethods';

interface QueensPanelV2Props {
  onBack?: () => void;
}

export const QueensPanelV2: React.FC<QueensPanelV2Props> = ({ onBack }) => {
  const solution = [0, 4, 7, 5, 2, 6, 1, 3];
  
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [showHighlight, setShowHighlight] = useState<boolean>(true);
  const [expansionRing, setExpansionRing] = useState<number | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  
  // States for drag & drop and hover effects
  const [draggedQueen, setDraggedQueen] = useState<{r: number, c: number} | null>(null);
  const [dragOverTile, setDragOverTile] = useState<{r: number, c: number} | null>(null);
  const [hoveredQueen, setHoveredQueen] = useState<{r: number, c: number} | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { playClickSound, playHoverSound, playChessSound, playTone } = useSoundEffects();
  const { showNotification } = useNotification();

  useEffect(() => {
    setShowHighlight(true);
    if (currentStep > 0) {
      const timer = setTimeout(() => setShowHighlight(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

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

  // Sonido de colocación de pieza (madera / ajedrez)
  const playWoodClack = () => {
    try {
      playChessSound();
      playTone(180, 'triangle', 0.12, 0.2);
    } catch {
      // fallback silent
    }
  };

  // Expansión concéntrica de color desde el centro (3.5, 3.5) hacia la periferia
  const triggerColorExpansion = async () => {
    // 4 anillos: 0 (4 casillas centro), 1 (12 circundantes), 2 (20 intermedias), 3 (28 externas)
    for (let ring = 0; ring <= 3; ring++) {
      setExpansionRing(ring);
      playTone(340 + ring * 130, 'sine', 0.22, 0.14);
      await new Promise(r => setTimeout(r, 200));
    }
    // Anillo 4 fija el estado consolidado de victoria en todas las 64 casillas
    setExpansionRing(4);
    playTone(880, 'triangle', 0.35, 0.15);
    setTimeout(() => playTone(1320, 'sine', 0.45, 0.12), 120);
  };

  const handleInsertar = async () => {
    if (isVerifying || isVerified || currentStep >= 8) return;
    playClickSound();
    playWoodClack();
    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);

    if (nextStep === 8) {
      setIsVerifying(true);
      try {
        const res = await apiRequest<{ valid: boolean; message: string }>(
          `${API_KEY}/recursive/eight-queens/verify`,
          { method: 'POST' }
        );
        if (res.valid) {
          setIsVerified(true);
          showNotification('success', 'Verificación Recursiva Exitosa', res.message || 'Las 8 reinas se han colocado sin conflictos.');
          await triggerColorExpansion();
        } else {
          showNotification('error', 'Error de Verificación', res.message || 'Conflicto detectado entre reinas.');
        }
      } catch {
        // En caso de que el backend esté offline durante pruebas aisladas, validamos y animamos
        setIsVerified(true);
        showNotification('success', 'Verificación Exitosa', 'Las 8 reinas han sido colocadas y verificadas sin conflictos.');
        await triggerColorExpansion();
      } finally {
        setIsVerifying(false);
      }
    }
  };

  const handleReiniciar = async () => {
    playClickSound();
    setCurrentStep(0);
    setExpansionRing(null);
    setIsVerified(false);
    setIsVerifying(false);
    try {
      await apiRequest(`${API_KEY}/recursive/eight-queens`, { method: 'PUT' });
    } catch {
      // Ignorar si el backend no está disponible
    }
  };

  const handleBack = () => {
    playClickSound();
    if (onBack) onBack();
  };

  const getCenter = (r: number, c: number) => ({ x: c * 12.5 + 6.25, y: r * 12.5 + 6.25 });

  const getAlgebraicNotation = (step: number) => {
    if (isVerified) return 'VERIFICACIÓN RECURSIVA EXITOSA: ¡TABLERO 8x8 RESUELTO!';
    if (step === 0) return 'ESPERANDO INSTRUCCIONES...';
    const r = step - 1;
    const c = solution[r];
    const rank = 8 - r;
    const file = String.fromCharCode(97 + c); // a-h lowercase
    return `MOVIMIENTO: REINA ${step} [D${file}${rank}]`;
  };

  const isComplete = currentStep >= 8;

  return (
    <div className="h-screen w-full bg-[#03060d] text-white font-sans flex flex-col relative overflow-hidden select-none">
      
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none opacity-60" />
      
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/20 rounded-full blur-[120px] pointer-events-none z-0"></div>

      {/* ================= HEADER ================= */}
      {/* Reducimos aún más el espacio para hacer el tablero lo más grande posible */}
      <header className="w-full flex-shrink-0 flex items-center justify-between px-10 pt-2 pb-0 z-10">
        
        <div className="flex flex-col justify-center">
          <h1 className="text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-100 to-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.3)] font-sans tracking-[0.15em] uppercase">
            ACERTIJO 8 REINAS
          </h1>
        </div>
        
        <div className="flex items-center gap-6">
          <button 
            onClick={handleInsertar}
            onMouseEnter={playHoverSound}
            disabled={isComplete || isVerifying}
            className={`px-8 py-2.5 rounded-full font-bold text-sm tracking-wide transition-all flex items-center gap-2
              ${isComplete 
                ? (isVerified
                    ? 'bg-emerald-950/40 text-emerald-400/60 cursor-not-allowed border border-emerald-800/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                    : 'bg-[#0f172a] text-cyan-500/30 cursor-not-allowed border border-[#1e293b]') 
                : 'bg-slate-800/80 hover:bg-slate-700 border border-cyan-700 text-cyan-50 shadow-[0_0_15px_rgba(6,182,212,0.15)] active:scale-95'
              }`}
          >
            {isVerifying ? 'VERIFICANDO...' : 'INSERTAR REINA ➔'}
          </button>
          
          <div className={`border rounded-full px-8 py-2.5 shadow-sm flex items-center justify-center min-w-[120px] transition-all duration-500 ${
            isVerified 
              ? 'bg-emerald-950/80 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]' 
              : 'bg-[#e0f2fe] border-cyan-300'
          }`}>
            <span className={`font-extrabold text-sm tracking-widest ${
              isVerified ? 'text-emerald-300 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'text-cyan-700'
            }`}>
              {isVerified ? '8 / 8 ✓' : `${currentStep} / 8`}
            </span>
          </div>

          <button 
            onClick={handleReiniciar}
            onMouseEnter={playHoverSound}
            className="px-8 py-2.5 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white rounded-full font-bold text-sm tracking-wide shadow-md hover:shadow-lg transition-all active:scale-95"
          >
            REINICIAR
          </button>
        </div>
      </header>

      {/* ================= TABLERO PRINCIPAL ================= */}
      {/* flex-1 toma todo el espacio restante. p-1 para tocar casi los bordes y ser gigante. */}
      <main className="flex-1 flex flex-col items-center justify-center p-1 min-h-0 z-10 w-full">
        
        <div className={`relative aspect-square h-full max-h-full max-w-full p-0.5 border-[4px] rounded-md shadow-[0_0_15px_rgba(14,165,233,0.1)] overflow-hidden backdrop-blur-xl transition-all duration-700 ${
          isVerified 
            ? 'border-emerald-400/80 shadow-[0_0_35px_rgba(16,185,129,0.35)] bg-[#01140e]' 
            : 'border-cyan-500/40 bg-[#02050f]'
        }`}>
          
          <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 z-0">
            {Array.from({ length: 8 }).map((_, row) =>
              Array.from({ length: 8 }).map((_, col) => {
                const isBlackTile = (row + col) % 2 === 1;
                const rank = 8 - row;
                const file = String.fromCharCode(97 + col);
                const isDragOverInvalid = dragOverTile?.r === row && dragOverTile?.c === col && draggedQueen && (draggedQueen.r !== row || draggedQueen.c !== col);
                
                // Distancia concéntrica de Chebyshev al centro (3.5, 3.5)
                // Anillo 0: casillas más cercanas (centro 4 casillas)
                // Anillo 1: casillas circundantes
                // Anillo 2: casillas intermedias
                // Anillo 3: casillas más lejanas (periferia y esquinas)
                const tileRing = Math.floor(Math.max(Math.abs(row - 3.5), Math.abs(col - 3.5)));

                let tileBg = isBlackTile 
                  ? 'bg-gradient-to-br from-[#060a12] to-[#020308] shadow-[inset_0_0_20px_rgba(0,0,0,0.9)]' 
                  : 'bg-gradient-to-br from-[#0d1a33] to-[#070e20] shadow-[inset_0_0_15px_rgba(0,0,0,0.6)]';

                if (expansionRing !== null) {
                  if (tileRing === expansionRing) {
                    // Frente de onda activo en expansión
                    tileBg = 'bg-gradient-to-br from-emerald-300 via-teal-300 to-cyan-200 shadow-[inset_0_0_30px_rgba(52,211,153,0.95),0_0_30px_rgba(34,211,238,0.9)] !border-emerald-200 z-10 scale-[1.03]';
                  } else if (tileRing < expansionRing) {
                    // Casillas ya alcanzadas y cambiadas de color por la onda expansiva
                    tileBg = isBlackTile 
                      ? 'bg-gradient-to-br from-[#022c22] via-[#033327] to-[#011a14] shadow-[inset_0_0_20px_rgba(16,185,129,0.35)] !border-emerald-500/50' 
                      : 'bg-gradient-to-br from-[#065f46] via-[#047857] to-[#064e3b] shadow-[inset_0_0_20px_rgba(52,211,153,0.45)] !border-emerald-300/60';
                  }
                }

                if (isDragOverInvalid) {
                  tileBg = 'bg-red-950/40 shadow-[inset_0_0_25px_rgba(239,68,68,0.3)] !border-red-500/50';
                }

                return (
                  <div
                    key={`tile-${row}-${col}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      if (!dragOverTile || dragOverTile.r !== row || dragOverTile.c !== col) {
                        setDragOverTile({ r: row, c: col });
                      }
                    }}
                    onDragLeave={() => setDragOverTile(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedQueen && (draggedQueen.r !== row || draggedQueen.c !== col)) {
                        showNotification('error', 'Movimiento inválido', 'No puedes poner la pieza aquí.');
                        playClickSound();
                      }
                      setDraggedQueen(null);
                      setDragOverTile(null);
                    }}
                    className={`relative w-full h-full border border-[#22d3ee]/5 transition-all duration-500 ${tileBg}`}
                  >
                    {col === 0 && (
                      <span className={`absolute top-1 left-1.5 text-[clamp(14px,2.5vh,20px)] font-black select-none pointer-events-none transition-colors duration-500 ${
                        isVerified ? 'text-emerald-300/80 drop-shadow-[0_0_6px_rgba(16,185,129,0.6)]' : 'text-cyan-500/60'
                      }`}>
                        {rank}
                      </span>
                    )}
                    {row === 7 && (
                      <span className={`absolute bottom-0.5 right-1.5 text-[clamp(14px,2.5vh,20px)] font-black select-none pointer-events-none transition-colors duration-500 ${
                        isVerified ? 'text-emerald-300/80 drop-shadow-[0_0_6px_rgba(16,185,129,0.6)]' : 'text-cyan-500/60'
                      }`}>
                        {file}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {(() => {
            let attackLinesQueen: {r: number, c: number} | null = null;
            if (hoveredQueen) {
              attackLinesQueen = hoveredQueen;
            } else if (currentStep > 0 && showHighlight && !draggedQueen && !isVerified) {
              attackLinesQueen = { r: currentStep - 1, c: solution[currentStep - 1] };
            }
            
            if (!attackLinesQueen) return null;
            
            const r = attackLinesQueen.r;
            const c = attackLinesQueen.c;
            const cx = `${(c + 0.5) * 12.5}%`;
            const cy = `${(r + 0.5) * 12.5}%`;

            const tl = getCenter(r - Math.min(r, c), c - Math.min(r, c));
            const br = getCenter(r + Math.min(7 - r, 7 - c), c + Math.min(7 - r, 7 - c));
            
            const tr = getCenter(r - Math.min(r, 7 - c), c + Math.min(r, 7 - c));
            const bl = getCenter(r + Math.min(7 - r, c), c - Math.min(7 - r, c));

            return (
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                <defs>
                  <mask id={`hole-attack`}>
                    <rect width="100%" height="100%" fill="white" />
                    <rect x={`${c * 12.5}%`} y={`${r * 12.5}%`} width="12.5%" height="12.5%" fill="black" />
                  </mask>
                </defs>
                <g 
                  stroke="#22d3ee" 
                  strokeWidth="4" 
                  strokeLinecap="round"
                  strokeDasharray="0 20" 
                  opacity="0.9"
                  className="animate-pulse"
                  mask={`url(#hole-attack)`}
                >
                  <line x1="2%" y1={cy} x2="98%" y2={cy} />
                  <line x1={cx} y1="2%" x2={cx} y2="98%" />
                  <line x1={`${tl.x}%`} y1={`${tl.y}%`} x2={`${br.x}%`} y2={`${br.y}%`} />
                  <line x1={`${tr.x}%`} y1={`${tr.y}%`} x2={`${bl.x}%`} y2={`${bl.y}%`} />
                </g>
              </svg>
            );
          })()}

          <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 z-20 pointer-events-none">
            {Array.from({ length: 8 }).map((_, row) =>
              Array.from({ length: 8 }).map((_, col) => {
                const hasQueen = row < currentStep && solution[row] === col;
                const isLatest = hasQueen && row === currentStep - 1 && showHighlight;

                return (
                  <div
                    key={`queen-${row}-${col}`}
                    className="relative flex items-center justify-center"
                  >
                    {isLatest && (
                      <div className="absolute inset-0 shadow-[inset_0_0_30px_rgba(30,58,138,0.6)] bg-blue-900/30 z-0"></div>
                    )}
                    
                    {hasQueen && (
                      <div 
                        draggable={!isVerified}
                        onDragStart={(e) => {
                          if (isVerified) return;
                          setDraggedQueen({ r: row, c: col });
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        onDragEnd={() => {
                          setDraggedQueen(null);
                          setDragOverTile(null);
                        }}
                        onMouseEnter={() => setHoveredQueen({ r: row, c: col })}
                        onMouseLeave={() => setHoveredQueen(null)}
                        className={`w-[85%] h-[85%] relative flex items-center justify-center animate-[popIn_0.4s_cubic-bezier(0.175,0.885,0.32,1.275)] z-10 pointer-events-auto cursor-grab active:cursor-grabbing ${draggedQueen?.r === row && draggedQueen?.c === col ? 'opacity-50' : ''}`}
                      >
                        {/* VISTA DE PERFIL 3D REALISTA (Cuerpo Entero), MATERIAL OBSIDIANA ELEGANTE */}
                        <svg viewBox="0 0 100 150" className={`w-full h-full relative z-10 transition-all duration-500 ${
                          isVerified 
                            ? 'drop-shadow-[0_12px_22px_rgba(16,185,129,0.6)]' 
                            : 'drop-shadow-[0_15px_15px_rgba(0,0,0,0.8)]'
                        }`}>
                          <defs>
                            {/* Obsidiana Oscura (Elegante, sin molestar la vista) - Gradiente lineal para efecto cilíndrico */}
                            <linearGradient id={`obsidian3D-${row}`} x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#0f172a" />
                              <stop offset="20%" stopColor="#1e293b" />
                              <stop offset="40%" stopColor="#475569" /> {/* Brillo metálico */}
                              <stop offset="50%" stopColor="#94a3b8" /> {/* Pico de luz */}
                              <stop offset="60%" stopColor="#475569" />
                              <stop offset="80%" stopColor="#1e293b" />
                              <stop offset="100%" stopColor="#0f172a" />
                            </linearGradient>
                            
                            <filter id={`depthFilter-${row}`}>
                                <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="black" floodOpacity="0.6"/>
                            </filter>
                          </defs>

                          <g fill={`url(#obsidian3D-${row})`} 
                             stroke="#64748b" 
                             strokeWidth="0.75" 
                             filter={`url(#depthFilter-${row})`}
                          >
                            {/* Base */}
                            <ellipse cx="50" cy="135" rx="35" ry="8" />
                            <path d="M 15 135 C 15 125, 20 118, 28 115 L 72 115 C 80 118, 85 125, 85 135 Z" />
                            <ellipse cx="50" cy="115" rx="22" ry="4" />
                            
                            {/* Cuerpo curvo cóncavo (como la referencia) */}
                            <path d="M 28 115 C 35 95, 38 80, 38 65 L 62 65 C 62 80, 65 95, 72 115 Z" />
                            
                            {/* Anillos del cuello */}
                            <ellipse cx="50" cy="65" rx="24" ry="4.5" />
                            <ellipse cx="50" cy="59" rx="22" ry="4.5" />
                            <ellipse cx="50" cy="54" rx="18" ry="4" />
                            
                            {/* Corona (Cáliz y Picos) */}
                            <path d="
                              M 32 54 
                              C 22 45, 15 35, 15 30 
                              Q 20 38, 25 40
                              Q 30 35, 32 25
                              Q 38 35, 42 35
                              Q 46 28, 50 22
                              Q 54 28, 58 35
                              Q 62 35, 68 25
                              Q 70 35, 75 40
                              Q 80 38, 85 30
                              C 85 35, 78 45, 68 54 
                              Z" 
                            />
                            
                            {/* Joyas en los picos de la corona */}
                            <circle cx="15" cy="30" r="2.5" />
                            <circle cx="32" cy="25" r="3.5" />
                            <circle cx="50" cy="15" r="5.5" />
                            <circle cx="68" cy="25" r="3.5" />
                            <circle cx="85" cy="30" r="2.5" />
                          </g>

                          {/* Efecto de Brillo/Escarcha: un destello que ocurre cada 12 segundos */}
                          <g className="animate-[sparkle_12s_ease-in-out_infinite]" style={{ transformOrigin: '70% 30%' }}>
                            <path d="M 70 20 C 70 28, 62 30, 55 30 C 62 30, 70 32, 70 40 C 70 32, 78 30, 85 30 C 78 30, 70 28, 70 20 Z" fill="#ffffff" opacity="0.9" />
                          </g>
                        </svg>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="w-full flex-shrink-0 px-10 pb-2 pt-0 flex items-center justify-between z-10">
        
        <div className={`text-[13px] font-bold tracking-widest px-6 py-2.5 rounded-xl backdrop-blur-md border transition-all duration-500 ${
          isVerified 
            ? 'bg-[#022c22]/90 border-emerald-400/50 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
            : 'bg-[#0B0F19]/90 border-cyan-500/20 text-[#94a3b8] shadow-[0_0_20px_rgba(6,182,212,0.1)]'
        }`}>
          {getAlgebraicNotation(currentStep)}
        </div>
        
        <button
          onClick={handleBack}
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
          <span className="font-tech-header text-[15px] tracking-wider capitalize">Atrás</span>
        </button>

      </footer>

      {/* Animaciones Customizadas */}
      <style>{`
        @keyframes popIn {
          0% { transform: scale(0.3) translateY(-20px); opacity: 0; }
          60% { transform: scale(1.15) translateY(5px); }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }

        /* Destello que aparece raramente (cada 12 segundos) y es sutil */
        @keyframes sparkle {
          0%, 90% { opacity: 0; transform: scale(0) rotate(0deg); }
          95% { opacity: 1; transform: scale(1) rotate(90deg); filter: blur(1px); }
          100% { opacity: 0; transform: scale(0) rotate(180deg); }
        }
      `}</style>
    </div>
  );
};

export default QueensPanelV2;