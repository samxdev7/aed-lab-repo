import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSoundEffects } from './useSoundEffects';
import { useNotification } from './NotificationContext';
import { API_KEY, apiRequest } from './HTTPMethods';

interface QuickSortPanelProps {
  onBack?: () => void;
}

interface BackendSwapLine {
  from: number;
  to: number;
}

interface BackendSortStep {
  array: number[];
  pivot: number | null;
  i: number | null;
  j: number | null;
  elevated: number[];
  swapLine: BackendSwapLine | null;
  phaseText: string;
  action: 'compare' | 'found' | 'swap' | 'done' | 'finish' | 'new_partition';
  range: [number, number] | null;
}

interface QuickSortResponse {
  sortedArray: number[];
  steps: BackendSortStep[];
  message: string;
}

interface CardItem {
  id: number;
  value: number;
  position: number;
}

export const QuickSortPanel: React.FC<QuickSortPanelProps> = ({ onBack }) => {
  const initialValues = [67, 9, 7, 12, 15, 6, 3, 1, 4, 2];
  const initialCards: CardItem[] = initialValues.map((v, i) => ({ id: i, value: v, position: i }));
  
  // States
  const [cards, setCards] = useState<CardItem[]>(initialCards);
  const [swappingPair, setSwappingPair] = useState<{ upperId: number; lowerId: number } | null>(null);
  const [celebratedCount, setCelebratedCount] = useState<number>(0);
  const [celebratingIndex, setCelebratingIndex] = useState<number | null>(null);
  const [pivotIndex, setPivotIndex] = useState<number | null>(null);
  const [iPointer, setIPointer] = useState<number | null>(null); 
  const [jPointer, setJPointer] = useState<number | null>(null);
  const [elevatedIndices, setElevatedIndices] = useState<number[]>([]);
  const [swapLine, setSwapLine] = useState<{from: number, to: number} | null>(null);
  const [phaseText, setPhaseText] = useState('ESPERANDO INICIAR (Simulación Estática)');
  const [currentRange, setCurrentRange] = useState<[number, number] | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSorted, setIsSorted] = useState(false);

  // Detección de elementos repetidos
  const duplicateValues = useMemo(() => {
    const counts = new Map<number, number>();
    cards.forEach(c => counts.set(c.value, (counts.get(c.value) || 0) + 1));
    const duplicates = new Set<number>();
    counts.forEach((count, val) => {
      if (count > 1) duplicates.add(val);
    });
    return duplicates;
  }, [cards]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isMounted = useRef(true);
  const cancelAnim = useRef(false);
  const userCards = useRef<CardItem[]>([...initialCards]);

  const { playClickSound, playHoverSound, playTone } = useSoundEffects();
  const { showNotification } = useNotification();

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      cancelAnim.current = true;
    };
  }, []);

  const playBeep = (freq: number, type: OscillatorType = 'sine', duration: number = 0.1, vol = 0.1) => {
    if (!isMounted.current) return;
    playTone(freq, type, duration, vol);
  };

  const playFoundSound = () => {
    playBeep(800, 'square', 0.15, 0.05);
    setTimeout(() => { if(isMounted.current) playBeep(1200, 'square', 0.2, 0.05) }, 100);
  };

  const playSwapSound = () => {
    playBeep(400, 'triangle', 0.3, 0.15);
  };

  const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

  const handleInputChange = (id: number, valStr: string) => {
    let numStr = valStr.replace(/\D/g, '').substring(0, 3);
    let num = numStr === '' ? 0 : parseInt(numStr);
    setCards(prev => {
      const next = prev.map(c => c.id === id ? { ...c, value: num } : c);
      userCards.current = [...next];
      return next;
    });
  };

  const handleStartSimulation = async () => {
    try {
      if (isAnimating) return;
      if (isSorted) {
        showNotification('info', 'Arreglo Ordenado', 'El arreglo ya está ordenado. Por favor, haz clic en Reiniciar.');
        playClickSound();
        return;
      }

      if (cards.length !== 10 || cards.some(c => isNaN(c.value))) {
        showNotification('warning', 'Entrada inválida', 'El arreglo debe tener exactamente 10 números válidos.');
        return;
      }

      // Validar que no existan elementos duplicados
      if (duplicateValues.size > 0) {
        const dupList = Array.from(duplicateValues).join(', ');
        showNotification('warning', 'Elementos duplicados', `El arreglo contiene elementos repetidos: [${dupList}]. Todos los números deben ser únicos.`);
        playBeep(220, 'sawtooth', 0.25, 0.2);
        return;
      }
      
      setIsAnimating(true);
      cancelAnim.current = false;
      setCelebratedCount(0);
      setCelebratingIndex(null);
      playClickSound();

      // Extraer los valores en orden posicional (slot 0..9)
      const currentValues = Array.from({ length: 10 }, (_, slot) => {
        const found = cards.find(c => c.position === slot);
        return found ? found.value : 0;
      });

      // Petición a la API Spring Boot (Esquema Hoare)
      const response = await apiRequest<QuickSortResponse>(
        `${API_KEY}/recursive/quicksort`,
        {
          method: "POST",
          body: { array: currentValues }
        }
      );

      if (!response || !response.steps || response.steps.length === 0) {
        showNotification("error", "Error de Servidor", "No se recibieron los pasos de ordenamiento.");
        setIsAnimating(false);
        return;
      }

      let currentCards = cards.map(c => ({ ...c }));

      // Animación secuencial consumiendo los pasos generados por el backend
      for (let idx = 0; idx < response.steps.length; idx++) {
        if (!isMounted.current || cancelAnim.current) break;
        const step = response.steps[idx];
        
        let activeSwapPair: { upperId: number; lowerId: number } | null = null;

        // Mantener la identidad fija de cada tarjeta en el DOM
        // Solo modificamos su propiedad 'position', disparando una transición horizontal CSS pura (left)
        if (step.action === 'swap' && step.swapLine) {
          const { from, to } = step.swapLine;
          const minSlot = Math.min(from, to);
          const maxSlot = Math.max(from, to);
          const cardLeft = currentCards.find(c => c.position === minSlot);
          const cardRight = currentCards.find(c => c.position === maxSlot);

          if (cardLeft && cardRight) {
            activeSwapPair = { upperId: cardLeft.id, lowerId: cardRight.id };
            cardLeft.position = maxSlot;
            cardRight.position = minSlot;
          }
        }

        setCards([...currentCards.map(c => ({ ...c }))]);
        setSwappingPair(activeSwapPair);
        setPivotIndex(step.pivot);
        setIPointer(step.i);
        setJPointer(step.j);
        setElevatedIndices(step.elevated || []);
        setSwapLine(step.swapLine);
        setPhaseText(step.phaseText);
        setCurrentRange(step.range);

        if (step.action === 'new_partition') {
          playBeep(300, 'sine', 0.1);
          await delay(700);
        } else if (step.action === 'found') {
          playFoundSound();
          await delay(600);
        } else if (step.action === 'swap') {
          playSwapSound();
          await delay(800); // 800ms para permitir que la animación CSS (700ms) complete su trayectoria
        } else if (step.action === 'done') {
          playBeep(300, 'sine', 0.08);
          await delay(450);
        } else if (step.action === 'finish') {
          playFoundSound();
          await delay(300);
        } else {
          // Compare step
          const cardAtI = currentCards.find(c => c.position === step.i);
          const val = cardAtI ? cardAtI.value : 0;
          const freq = 200 + (val * 5); 
          playBeep(freq, 'sine', 0.04);
          await delay(450);
        }
      }
      
      if (isMounted.current && !cancelAnim.current) {
        // Limpiar punteros para dar paso a la ola celebratoria
        setPivotIndex(null);
        setIPointer(null);
        setJPointer(null);
        setElevatedIndices([]);
        setSwapLine(null);
        setPhaseText('¡VERIFICANDO ARREGLO ORDENADO!');

        // Ola celebratoria verde de izquierda a derecha (uno por uno con leve elevación y chispas)
        for (let c = 0; c < 10; c++) {
          if (!isMounted.current || cancelAnim.current) break;
          setCelebratingIndex(c);
          setCelebratedCount(c + 1);

          // Tono armónico ascendente
          const freq = 420 + c * 50;
          playBeep(freq, 'sine', 0.12, 0.12);

          await delay(120);
        }

        setCelebratingIndex(null);
        setPhaseText('¡ORDENAMIENTO COMPLETADO CON ÉXITO!');

        // Acorde triunfal
        playBeep(880, 'triangle', 0.35, 0.15);
        setTimeout(() => {
          if (isMounted.current && !cancelAnim.current) {
            playBeep(1320, 'sine', 0.45, 0.15);
          }
        }, 100);

        setIsSorted(true);
      }
      if (isMounted.current) {
        setIsAnimating(false);
        setSwappingPair(null);
      }
    }
    catch (e) {
      if (isMounted.current) {
        setIsAnimating(false);
        setSwappingPair(null);
      }
      const msg = e instanceof Error ? e.message : 'No se pudo completar el ordenamiento.';
      showNotification("error", "Error de Ordenamiento", msg);
    }
  };

  const handleReset = () => {
    playClickSound();
    cancelAnim.current = true; // Interrumpir bucle
    setCards(userCards.current.map(c => ({ ...c, position: c.id })));
    setSwappingPair(null);
    setCelebratedCount(0);
    setCelebratingIndex(null);
    setPivotIndex(null);
    setIPointer(null);
    setJPointer(null);
    setElevatedIndices([]);
    setSwapLine(null);
    setPhaseText('ESPERANDO INICIAR (Simulación Estática)');
    setCurrentRange(null);
    setIsSorted(false);
    setIsAnimating(false);
  };

  // Fondo estrellado
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

  const handleBack = () => {
    playClickSound();
    if (onBack) onBack();
  };

  return (
    <div className="h-screen w-full bg-[#03060d] text-white font-sans flex flex-col relative overflow-hidden select-none">
      
      {/* Background Effects */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none opacity-60" />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/20 rounded-full blur-[120px] pointer-events-none z-0"></div>

      {/* HEADER */}
      <header className="w-full flex-shrink-0 flex items-center justify-between px-10 pt-8 pb-0 z-10">
        <div className="flex flex-col justify-center">
          <h1 className="text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-100 to-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.3)] font-sans tracking-[0.15em] uppercase">
            ORDENAMIENTO RÁPIDO
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
           <button 
             onClick={handleStartSimulation}
             onMouseEnter={playHoverSound}
             className={`px-6 py-2.5 rounded-full font-bold text-sm tracking-wide transition-all active:scale-95 ${
               isAnimating 
                 ? 'bg-slate-800/40 text-cyan-50/30 border border-cyan-700/30 cursor-not-allowed'
                 : 'bg-slate-800/80 hover:bg-slate-700 border border-cyan-700 text-cyan-50 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
             }`}
           >
             {isAnimating ? 'ORDENANDO...' : 'INICIAR ORDENAMIENTO'}
           </button>
           <button 
             onClick={handleReset}
             onMouseEnter={playHoverSound}
             className="px-6 py-2.5 rounded-full font-bold text-sm tracking-wide transition-all active:scale-95 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white shadow-md hover:shadow-lg"
           >
             REINICIAR
           </button>
        </div>
      </header>

      {/* BODY - Array Visualizer */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 z-10 w-full relative min-h-0">
        <div className="relative w-full max-w-5xl px-8 py-10 flex flex-col items-center">
          <div className="relative w-full h-44 md:h-52">
            
            {/* Punteros Superiores: Solo i y j (apuntando hacia abajo) */}
            <div className="absolute -top-14 left-0 right-0 h-12 pointer-events-none z-30">
                <div 
                  className={`absolute flex flex-col items-center transition-all duration-700 ease-in-out ${iPointer !== null ? 'opacity-100 scale-100' : 'opacity-0 scale-50'} ${iPointer !== null && elevatedIndices.includes(iPointer) ? '-translate-y-8' : ''}`}
                  style={{ left: `calc(${(iPointer ?? 0) * 10}%)`, width: '10%' }}
                >
                    <span className="text-purple-300 font-mono font-black text-xs uppercase px-2 py-0.5 rounded bg-purple-950/90 border border-purple-400/50 shadow-[0_0_10px_rgba(168,85,247,0.4)] mb-1">
                      i
                    </span>
                    <svg className="w-5 h-5 text-purple-400 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                </div>
                
                <div 
                  className={`absolute flex flex-col items-center transition-all duration-700 ease-in-out ${jPointer !== null ? 'opacity-100 scale-100' : 'opacity-0 scale-50'} ${jPointer !== null && elevatedIndices.includes(jPointer) ? '-translate-y-8' : ''}`}
                  style={{ left: `calc(${(jPointer ?? 0) * 10}%)`, width: '10%' }}
                >
                    <span className="text-emerald-300 font-mono font-black text-xs uppercase px-2 py-0.5 rounded bg-emerald-950/90 border border-emerald-400/50 shadow-[0_0_10px_rgba(52,211,153,0.4)] mb-1">
                      j
                    </span>
                    <svg className="w-5 h-5 text-emerald-400 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                </div>
            </div>

            {/* Cajas del Array posicionales absolutas con animación simétrica */}
            {cards.map((item) => {
              const pos = item.position;
              const isPivot = pos === pivotIndex;
              const isElevated = elevatedIndices.includes(pos);
              const isOutOfRange = currentRange && (pos < currentRange[0] || pos > currentRange[1]);
              const isCelebrated = celebratedCount > pos;
              const isCurrentCelebration = celebratingIndex === pos;
              const isDuplicate = !isAnimating && !isSorted && duplicateValues.has(item.value);
              
              // Simetría física en el intercambio y en la ola celebratoria
              let elevationClass = 'translate-y-0 scale-100 z-10';
              if (isCurrentCelebration) {
                elevationClass = '-translate-y-4 scale-105 z-40';
              } else if (swappingPair && item.id === swappingPair.upperId) {
                elevationClass = '-translate-y-12 scale-110 z-30';
              } else if (swappingPair && item.id === swappingPair.lowerId) {
                elevationClass = 'translate-y-6 scale-110 z-20';
              } else if (isElevated) {
                elevationClass = '-translate-y-8 scale-110 z-20';
              }

              // Estilos de borde y fondo sin marcos oscuros o sombras negras
              let cardBgColor = 'bg-[#0e172e] border border-cyan-400/30 text-white hover:border-cyan-300/60 shadow-[0_0_15px_rgba(6,182,212,0.2)]';
              if (isDuplicate) {
                cardBgColor = 'bg-rose-950/70 border-2 border-rose-500/80 text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.4)]';
              } else if (isCurrentCelebration || isCelebrated) {
                cardBgColor = isCurrentCelebration
                  ? 'bg-emerald-500/90 border-2 border-emerald-300 text-white shadow-[0_0_35px_rgba(52,211,153,0.9)]'
                  : 'bg-emerald-950/75 border border-emerald-400/80 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.45)]';
              } else if (swappingPair && (item.id === swappingPair.upperId || item.id === swappingPair.lowerId)) {
                cardBgColor = 'bg-purple-900/90 border-2 border-purple-400 text-purple-100 shadow-[0_0_25px_rgba(168,85,247,0.7)]';
              } else if (isElevated) {
                cardBgColor = 'bg-emerald-900/90 border-2 border-emerald-400 text-emerald-100 shadow-[0_0_25px_rgba(52,211,153,0.7)]';
              } else if (isPivot) {
                cardBgColor = 'bg-cyan-900/60 border-2 border-cyan-400 text-cyan-50 shadow-[0_0_20px_rgba(34,211,238,0.4)]';
              }

              return (
                <div 
                  key={item.id} 
                  className={`absolute top-0 flex flex-col items-center transition-all duration-700 ease-in-out ${elevationClass} ${isOutOfRange ? 'opacity-30 grayscale brightness-50' : 'opacity-100'}`}
                  style={{ left: `calc(${pos * 10}%)`, width: '10%' }}
                >
                  {/* Chispas flotantes animadas al verificarse la celda */}
                  {isCurrentCelebration && (
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 pointer-events-none z-50 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_15px_#34d399] animate-ping" />
                      <span className="absolute -top-3 -left-3 text-emerald-300 text-xs animate-[spark-1_0.6s_ease-out_forwards]">✦</span>
                      <span className="absolute -top-4 left-3 text-yellow-300 text-xs animate-[spark-2_0.6s_ease-out_forwards]">✨</span>
                      <span className="absolute -bottom-2 -left-4 text-cyan-300 text-xs animate-[spark-3_0.6s_ease-out_forwards]">★</span>
                      <span className="absolute -bottom-1 left-4 text-emerald-200 text-xs animate-[spark-4_0.6s_ease-out_forwards]">✦</span>
                    </div>
                  )}

                  <div className={`quick-sort-card w-16 h-20 md:w-20 md:h-24 flex items-center justify-center rounded-lg transition-all duration-300 ${cardBgColor}`}>
                    {isAnimating || isSorted ? (
                      <span className="w-full h-full flex items-center justify-center text-2xl md:text-3xl font-black font-mono select-none pointer-events-none">
                        {item.value}
                      </span>
                    ) : (
                      <input 
                        type="text"
                        maxLength={3}
                        value={item.value}
                        onChange={(e) => handleInputChange(item.id, e.target.value)}
                        className="w-full h-full bg-transparent text-center border-0 border-none outline-none focus:outline-none focus:ring-0 text-2xl md:text-3xl font-black cursor-text font-mono select-none"
                        style={{ border: 'none', outline: 'none', boxShadow: 'none', background: 'transparent' }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
            
            {/* Puntero Inferior: PIVOTE (debajo de las celdas pero arriba de los índices) */}
            <div className="absolute top-[88px] md:top-[106px] left-0 right-0 h-14 pointer-events-none z-30">
                <div 
                  className={`absolute flex flex-col items-center transition-all duration-700 ease-in-out ${pivotIndex !== null ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
                  style={{ left: `calc(${(pivotIndex ?? 0) * 10}%)`, width: '10%' }}
                >
                    <svg className="w-5 h-5 text-cyan-400 animate-bounce mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    <span className="text-cyan-300 font-mono font-black text-xs uppercase tracking-widest px-2 py-0.5 rounded bg-cyan-950/90 border border-cyan-400/50 shadow-[0_0_10px_rgba(34,211,238,0.4)]">
                      PIVOTE
                    </span>
                </div>
            </div>

            {/* Índices fijos en la parte inferior (debajo del rótulo de PIVOTE) */}
            <div className="absolute top-[148px] md:top-[170px] left-0 right-0 flex justify-between pointer-events-none">
              {initialValues.map((_, idx) => (
                <div key={`index-${idx}`} className="flex justify-center" style={{ width: '10%' }}>
                  <span className="text-slate-400 font-mono text-sm tracking-wider">
                    [{idx}]
                  </span>
                </div>
              ))}
            </div>
            
            {/* Curved arrow mockup representing swaps */}
            <div className="absolute top-[195px] md:top-[215px] left-0 right-0 h-16 pointer-events-none">
              {swapLine && (
                <svg className="absolute top-0 w-full h-full pointer-events-none transition-all duration-500" style={{ left: 0 }}>
                   <path 
                     d={`M calc(${(swapLine.from * 10) + 5}% ) 10 
                         Q calc(${((swapLine.from + swapLine.to) / 2 * 10) + 5}% ) 80 
                         calc(${(swapLine.to * 10) + 5}% ) 10`}
                     fill="none" 
                     stroke="rgba(168, 85, 247, 0.85)" 
                     strokeWidth="3" 
                     strokeDasharray="5 5"
                     markerEnd="url(#arrowhead)"
                   />
                   <defs>
                      <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="rgba(168, 85, 247, 0.9)" />
                      </marker>
                   </defs>
                </svg>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="w-full flex-shrink-0 px-10 pb-6 pt-0 flex items-center justify-between z-10">
        
        <div className="text-[#94a3b8] text-[13px] font-bold tracking-widest bg-[#0B0F19]/90 px-6 py-2.5 rounded-xl backdrop-blur-md border border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
          {phaseText}
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

      {/* Estilos para Celdas y Animaciones de Chispas */}
      <style>{`
        .quick-sort-card {
          box-shadow: none;
          outline: none !important;
        }
        .quick-sort-card input {
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
          background: transparent !important;
          -webkit-appearance: none !important;
          -moz-appearance: none !important;
          appearance: none !important;
        }
        @keyframes spark-1 {
          0% { transform: translate(0, 0) scale(0.6); opacity: 1; }
          100% { transform: translate(-16px, -20px) scale(1.4); opacity: 0; }
        }
        @keyframes spark-2 {
          0% { transform: translate(0, 0) scale(0.6); opacity: 1; }
          100% { transform: translate(16px, -22px) scale(1.5); opacity: 0; }
        }
        @keyframes spark-3 {
          0% { transform: translate(0, 0) scale(0.6); opacity: 1; }
          100% { transform: translate(-20px, 14px) scale(1.3); opacity: 0; }
        }
        @keyframes spark-4 {
          0% { transform: translate(0, 0) scale(0.6); opacity: 1; }
          100% { transform: translate(20px, 12px) scale(1.4); opacity: 0; }
        }
      `}</style>

    </div>
  );
};

export default QuickSortPanel;
