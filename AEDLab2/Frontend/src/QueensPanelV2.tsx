import React, { useState, useEffect, useRef } from 'react';

interface QueensPanelV2Props {
  onBack?: () => void;
}

type Step = {
  type: 'try' | 'place' | 'backtrack' | 'solution';
  row: number;
  col: number;
  queens: number[];
};

export const QueensPanelV2: React.FC<QueensPanelV2Props> = ({ onBack }) => {
  const BOARD_SIZE = 8;

  const [queens, setQueens] = useState<number[]>(Array(BOARD_SIZE).fill(-1));
  const [activeCell, setActiveCell] = useState<{ row: number; col: number } | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('Presiona Ejecutar para iniciar la animación');
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const stepsRef = useRef<Step[]>([]);
  const currentStepIndex = useRef<number>(0);
  const animationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Sintetizador Web Audio API para efectos de sonido
  const playSound = (type: 'place' | 'backtrack' | 'solution') => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      if (type === 'place') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(780, now + 0.08);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'backtrack') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.1);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'solution') {
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'triangle';
          o.connect(g);
          g.connect(ctx.destination);
          o.frequency.setValueAtTime(freq, now + idx * 0.07);
          g.gain.setValueAtTime(0.18, now + idx * 0.07);
          g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.35);
          o.start(now + idx * 0.07);
          o.stop(now + idx * 0.07 + 0.35);
        });
      }
    } catch {
      // Ignorar restricciones de audio
    }
  };

  // Generador de pasos para encontrar exactamente 1 SOLUCIÓN
  const generateSingleSolutionSteps = () => {
    const steps: Step[] = [];
    const currentBoard = Array(BOARD_SIZE).fill(-1);
    let found = false;

    const isSafe = (board: number[], row: number, col: number) => {
      for (let i = 0; i < row; i++) {
        const otherCol = board[i];
        if (otherCol === col || Math.abs(otherCol - col) === Math.abs(i - row)) {
          return false;
        }
      }
      return true;
    };

    const solve = (row: number) => {
      if (found) return;

      if (row === BOARD_SIZE) {
        steps.push({
          type: 'solution',
          row: -1,
          col: -1,
          queens: [...currentBoard],
        });
        found = true;
        return;
      }

      for (let col = 0; col < BOARD_SIZE; col++) {
        if (found) break;

        steps.push({
          type: 'try',
          row,
          col,
          queens: [...currentBoard],
        });

        if (isSafe(currentBoard, row, col)) {
          currentBoard[row] = col;
          steps.push({
            type: 'place',
            row,
            col,
            queens: [...currentBoard],
          });

          solve(row + 1);

          if (!found && row < BOARD_SIZE) {
            currentBoard[row] = -1;
            steps.push({
              type: 'backtrack',
              row,
              col,
              queens: [...currentBoard],
            });
          }
        }
      }
    };

    solve(0);
    return steps;
  };

  const toggleSimulation = () => {
    if (isCompleted) {
      resetSimulation();
      return;
    }

    if (!isSimulating) {
      if (stepsRef.current.length === 0) {
        stepsRef.current = generateSingleSolutionSteps();
        currentStepIndex.current = 0;
      }
      setIsSimulating(true);
    } else {
      setIsSimulating(false);
      if (animationTimer.current) clearTimeout(animationTimer.current);
    }
  };

  const resetSimulation = () => {
    setIsSimulating(false);
    setIsCompleted(false);
    if (animationTimer.current) clearTimeout(animationTimer.current);
    currentStepIndex.current = 0;
    stepsRef.current = [];
    setQueens(Array(BOARD_SIZE).fill(-1));
    setActiveCell(null);
    setStatusMessage('Presiona Ejecutar para iniciar la animación');
  };

  useEffect(() => {
    if (!isSimulating) return;

    const executeStep = () => {
      if (currentStepIndex.current >= stepsRef.current.length) {
        setIsSimulating(false);
        setIsCompleted(true);
        setStatusMessage('¡SOLUCIÓN COMPLETA! Las 8 reinas han sido colocadas sin conflictos.');
        return;
      }

      const step = stepsRef.current[currentStepIndex.current];
      setQueens(step.queens);

      if (step.type === 'try') {
        setActiveCell({ row: step.row, col: step.col });
        setStatusMessage(`Evaluando posición: Fila ${step.row + 1}, Columna ${step.col + 1}`);
      } else if (step.type === 'place') {
        setActiveCell({ row: step.row, col: step.col });
        playSound('place');
        setStatusMessage(`✓ Reina fijada en (${step.row + 1}, ${step.col + 1})`);
      } else if (step.type === 'backtrack') {
        setActiveCell({ row: step.row, col: step.col });
        playSound('backtrack');
        setStatusMessage(`✕ Conflicto detectado. Retrocediendo de (${step.row + 1}, ${step.col + 1})`);
      } else if (step.type === 'solution') {
        setActiveCell(null);
        playSound('solution');
        setIsCompleted(true);
        setIsSimulating(false);
        setStatusMessage('★ ¡SOLUCIÓN COMPLETA ALCANZADA!');
      }

      currentStepIndex.current += 1;
      animationTimer.current = setTimeout(executeStep, 180);
    };

    animationTimer.current = setTimeout(executeStep, 180);

    return () => {
      if (animationTimer.current) clearTimeout(animationTimer.current);
    };
  }, [isSimulating]);

  return (
    <div className="relative flex flex-col justify-between h-screen max-h-screen w-full bg-[#0B0D1B] text-white p-6 md:p-8 overflow-hidden select-none">
      
      {/* Ocultar barras de scroll */}
      <style>{`
        * {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
        *::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
      `}</style>

      {/* Patrones de puntos decorativos idénticos al diseño del lab */}
      <div className="absolute top-6 left-6 grid grid-cols-6 gap-1 opacity-20 pointer-events-none">
        {Array.from({ length: 24 }).map((_, i) => (
          <div key={i} className="w-1.5 h-1.5 bg-white rounded-full"></div>
        ))}
      </div>
      <div className="absolute top-6 right-6 grid grid-cols-6 gap-1 opacity-20 pointer-events-none">
        {Array.from({ length: 24 }).map((_, i) => (
          <div key={i} className="w-1.5 h-1.5 bg-white rounded-full"></div>
        ))}
      </div>

      {/* ENCABEZADO ESTILO LABORATORIO */}
      <header className="relative z-10 flex flex-col items-center justify-center mt-1 mb-2 text-center shrink-0">
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2">
          Problema de las 8 Reinas
        </h1>

        <div className="flex items-center justify-center gap-2 font-medium text-xs md:text-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 opacity-50"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
          <div className="h-[1px] w-10 md:w-16 bg-gradient-to-r from-transparent via-purple-400/60 to-purple-400"></div>
          
          <span className="px-2 font-semibold text-purple-300 tracking-wide">
            Simulación de Algoritmo de Backtracking
          </span>

          <div className="h-[1px] w-10 md:w-16 bg-gradient-to-l from-transparent via-purple-400/60 to-purple-400"></div>
          <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 opacity-50"></span>
        </div>
      </header>

      {/* BARRA DE CONTROLES (ESTILO PÍLDORA) Y MENSAJE */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-4xl mx-auto w-full bg-[#121829] border border-indigo-500/30 rounded-2xl px-6 py-2.5 backdrop-blur-xl shadow-[0_0_25px_rgba(18,24,41,0.8)] shrink-0">
        
        {/* Mensaje de estado */}
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse"></span>
          <span className="text-xs md:text-sm font-semibold text-cyan-200 tracking-wide">
            {statusMessage}
          </span>
        </div>

        {/* Botones estilo píldora neón */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSimulation}
            className={`px-6 py-2 rounded-full font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-lg cursor-pointer transform hover:scale-105 active:scale-95 ${
              isSimulating
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.5)]'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.5)]'
            }`}
          >
            {isSimulating ? 'PAUSAR ⏸' : isCompleted ? 'REPETIR ↺' : 'EJECUTAR ▶'}
          </button>

          <button
            onClick={resetSimulation}
            className="px-5 py-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-full font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(244,63,94,0.4)] hover:shadow-[0_0_25px_rgba(244,63,94,0.7)] transition-all duration-300 cursor-pointer transform hover:scale-105 active:scale-95"
          >
            REINICIAR ↺
          </button>
        </div>
      </div>

      {/* TABLERO DE AJEDREZ PREDOMINANTE Y GIGANTE */}
      <main className="relative z-10 flex-1 flex items-center justify-center my-auto py-2 overflow-hidden">
        
        <div className="relative aspect-square h-[62vh] max-h-[500px] min-h-[300px] bg-[#090d1f] border-4 border-rose-500/40 rounded-3xl p-3 shadow-[0_0_50px_rgba(244,63,94,0.25)] flex items-center justify-center">
          
          <div className="grid grid-cols-8 grid-rows-8 w-full h-full border-2 border-cyan-500/40 rounded-2xl overflow-hidden relative shadow-inner">
            
            {/* LÁSERES Y LÍNEAS DE AMENAZA NEÓN */}
            {activeCell && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
                <line
                  x1="0%"
                  y1={`${(activeCell.row + 0.5) * 12.5}%`}
                  x2="100%"
                  y2={`${(activeCell.row + 0.5) * 12.5}%`}
                  stroke="#f43f5e"
                  strokeWidth="3.5"
                  strokeDasharray="6 4"
                  className="animate-pulse drop-shadow-[0_0_10px_#f43f5e]"
                />
                <line
                  x1={`${(activeCell.col + 0.5) * 12.5}%`}
                  y1="0%"
                  x2={`${(activeCell.col + 0.5) * 12.5}%`}
                  y2="100%"
                  stroke="#f43f5e"
                  strokeWidth="3.5"
                  strokeDasharray="6 4"
                  className="animate-pulse drop-shadow-[0_0_10px_#f43f5e]"
                />
                {Array.from({ length: 8 }).map((_, r) =>
                  Array.from({ length: 8 }).map((_, c) => {
                    const isDiag = Math.abs(r - activeCell.row) === Math.abs(c - activeCell.col);
                    if (isDiag && (r !== activeCell.row || c !== activeCell.col)) {
                      return (
                        <circle
                          key={`diag-${r}-${c}`}
                          cx={`${(c + 0.5) * 12.5}%`}
                          cy={`${(r + 0.5) * 12.5}%`}
                          r="5"
                          fill="#22d3ee"
                          className="animate-ping drop-shadow-[0_0_12px_#22d3ee]"
                        />
                      );
                    }
                    return null;
                  })
                )}
              </svg>
            )}

            {/* CELDAS DEL TABLERO */}
            {Array.from({ length: 8 }).map((_, row) =>
              Array.from({ length: 8 }).map((_, col) => {
                const isDarkTile = (row + col) % 2 === 1;
                const hasQueen = queens[row] === col;
                const isActive = activeCell?.row === row && activeCell?.col === col;

                return (
                  <div
                    key={`${row}-${col}`}
                    className={`relative flex items-center justify-center border border-indigo-500/10 transition-colors duration-200 ${
                      isDarkTile ? 'bg-[#0f142b]' : 'bg-[#182042]'
                    } ${
                      isActive
                        ? 'bg-rose-500/30 border-2 border-rose-400 shadow-[inset_0_0_20px_rgba(244,63,94,0.6)]'
                        : ''
                    }`}
                  >
                    {hasQueen && (
                      <div className="relative z-10 w-4/5 h-4/5 flex items-center justify-center animate-bounce duration-300">
                        <div className="absolute inset-0 bg-rose-500/40 rounded-full blur-md animate-pulse" />
                        
                        <svg
                          viewBox="0 0 100 100"
                          className="w-full h-full filter drop-shadow-[0_4px_14px_rgba(244,63,94,0.9)]"
                        >
                          <defs>
                            <linearGradient id="queenGold" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#ffe4e6" />
                              <stop offset="50%" stopColor="#fb7185" />
                              <stop offset="100%" stopColor="#e11d48" />
                            </linearGradient>
                          </defs>

                          <path d="M20,80 L80,80 L75,88 L25,88 Z" fill="url(#queenGold)" stroke="#fff" strokeWidth="2" />
                          <path d="M28,75 L72,75 L68,80 L32,80 Z" fill="url(#queenGold)" />
                          <path d="M32,50 C32,65 25,70 25,75 L75,75 C75,70 68,65 68,50 Z" fill="url(#queenGold)" stroke="#fda4af" strokeWidth="1.5" />
                          <path d="M22,35 L32,50 L50,42 L68,50 L78,35 L62,38 L50,22 L38,38 Z" fill="url(#queenGold)" stroke="#fff" strokeWidth="2" />
                          <circle cx="22" cy="33" r="4.5" fill="#38bdf8" className="animate-pulse" />
                          <circle cx="50" cy="20" r="5.5" fill="#facc15" className="animate-pulse" />
                          <circle cx="78" cy="33" r="4.5" fill="#38bdf8" className="animate-pulse" />
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

      {/* PIE DE PÁGINA CON BOTÓN ATRÁS (IDÉNTICO AL DEL LABORATORIO) */}
      <footer className="w-full flex justify-start items-center pt-2 z-10 shrink-0">
        <button
          onClick={onBack}
          className="group flex items-center gap-3 px-7 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-base rounded-2xl shadow-[0_0_20px_rgba(79,70,229,0.5)] hover:shadow-[0_0_30px_rgba(79,70,229,0.8)] transition-all duration-300 transform hover:-translate-x-1 cursor-pointer"
        >
          <svg
            className="w-6 h-6 transition-transform duration-300 group-hover:-translate-x-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 12H5m7 7l-7-7 7-7" />
          </svg>
          <span>Atrás</span>
        </button>
      </footer>

    </div>
  );
};

export default QueensPanelV2;