import React, { useState, useEffect, useRef } from 'react';
import { useSoundEffects } from './useSoundEffects';
import { useNotification } from './NotificationContext';

interface QuickSortPanelProps {
  onBack?: () => void;
}

type SortStep = {
  array: { id: number, value: number }[];
  pivot: number | null;
  i: number | null;
  j: number | null;
  elevated: number[];
  swapLine: { from: number; to: number } | null;
  phaseText: string;
  action: 'compare' | 'found' | 'swap' | 'done' | 'finish' | 'new_partition';
  range: [number, number] | null;
};

export const QuickSortPanel: React.FC<QuickSortPanelProps> = ({ onBack }) => {
  const initialValues = [67, 9, 7, 12, 15, 6, 3, 1, 4, 2];
  const initialArray = initialValues.map((v, i) => ({ id: i, value: v }));
  
  // States
  const [array, setArray] = useState(initialArray);
  const [pivotIndex, setPivotIndex] = useState<number | null>(null);
  const [iPointer, setIPointer] = useState<number | null>(null); 
  const [jPointer, setJPointer] = useState<number | null>(null);
  const [elevatedIndices, setElevatedIndices] = useState<number[]>([]);
  const [swapLine, setSwapLine] = useState<{from: number, to: number} | null>(null);
  const [phaseText, setPhaseText] = useState('ESPERANDO INICIAR (Simulación Estática)');
  const [currentRange, setCurrentRange] = useState<[number, number] | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSorted, setIsSorted] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isMounted = useRef(true);
  const cancelAnim = useRef(false);

  const { playClickSound, playHoverSound } = useSoundEffects();
  const { showNotification } = useNotification();

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      cancelAnim.current = true; // Stop any running loops on unmount
    };
  }, []);

  const playBeep = (freq: number, type: 'sine' | 'triangle' | 'square' | 'sawtooth' = 'sine', duration: number = 0.1, vol = 0.1) => {
    if (!isMounted.current) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  };

  const playFoundSound = () => {
    playBeep(800, 'square', 0.15, 0.05);
    setTimeout(() => { if(isMounted.current) playBeep(1200, 'square', 0.2, 0.05) }, 100);
  };

  const playSwapSound = () => {
    playBeep(400, 'triangle', 0.3, 0.15);
  };

  const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

  const handleStartSimulation = async () => {
    if (isAnimating) return;
    if (isSorted) {
      showNotification('info', 'Arreglo Ordenado', 'El arreglo ya está ordenado. Por favor, haz clic en Reiniciar.');
      playClickSound();
      return;
    }
    
    setIsAnimating(true);
    cancelAnim.current = false;
    playClickSound();

    const steps: SortStep[] = [];
    const arr = [...initialArray];
    let activeRange: [number, number] | null = null;

    const pushStep = (pivot: number|null, i: number|null, j: number|null, elevated: number[], swap: any, text: string, action: SortStep['action'] = 'compare') => {
      steps.push({ array: [...arr], pivot, i, j, elevated: [...elevated], swapLine: swap, phaseText: text, action, range: activeRange });
    };

    const partition = (low: number, high: number): number => {
      const pivot = arr[low].value;
      pushStep(low, null, null, [], null, `Seleccionando PIVOTE en índice ${low}: [${pivot}]`, 'compare');
      let left = low + 1;
      let right = high;
      
      while (true) {
        pushStep(low, left, right, [], null, `Buscando elementos para intercambiar...`, 'compare');
        while (left <= right && arr[left].value <= pivot) {
          left++;
          if (left <= right) pushStep(low, left, right, [], null, `Avanzando i: [${arr[left].value}] <= PIVOTE`, 'compare');
        }
        while (left <= right && arr[right].value > pivot) {
          right--;
          if (left <= right) pushStep(low, left, right, [], null, `Retrocediendo j: [${arr[right].value}] > PIVOTE`, 'compare');
        }
        if (left <= right) {
           pushStep(low, left, right, [left, right], null, `¡Encontró par! i [${arr[left].value}] y j [${arr[right].value}]`, 'found');
           const temp = arr[left]; arr[left] = arr[right]; arr[right] = temp;
           pushStep(low, left, right, [left, right], {from: left, to: right}, `Intercambiando posiciones...`, 'swap');
           pushStep(low, left, right, [], null, `Intercambio realizado`, 'done');
           left++;
           right--;
        } else {
           break;
        }
      }
      
      if (right !== low && right >= 0 && right < arr.length) {
        pushStep(low, right, null, [low, right], null, `Colocando PIVOTE en su lugar final`, 'found');
        const temp = arr[low]; arr[low] = arr[right]; arr[right] = temp;
        pushStep(right, null, null, [low, right], {from: low, to: right}, `Moviendo PIVOTE...`, 'swap');
        pushStep(right, null, null, [], null, `PIVOTE acomodado en índice ${right}`, 'done');
      }
      return right;
    };

    const qs = (low: number, high: number) => {
      if (low < high) {
        activeRange = [low, high];
        pushStep(null, null, null, [], null, `Iniciando partición en rango [${low} a ${high}]`, 'new_partition');
        const pi = partition(low, high);
        qs(low, pi - 1);
        qs(pi + 1, high);
      } else if (low === high) {
        activeRange = [low, high];
        pushStep(null, null, null, [], null, `Sub-arreglo de 1 elemento, índice ${low} ya ordenado`, 'new_partition');
      }
    };

    activeRange = [0, arr.length - 1];
    pushStep(null, null, null, [], null, 'INICIANDO SIMULACIÓN DE ORDENAMIENTO', 'compare');
    qs(0, arr.length - 1);
    activeRange = null;
    pushStep(null, null, null, [], null, '¡ORDENAMIENTO COMPLETADO!', 'finish');

    for (let i = 0; i < steps.length; i++) {
      if (!isMounted.current || cancelAnim.current) break;
      const step = steps[i];
      
      setArray(step.array);
      setPivotIndex(step.pivot);
      setIPointer(step.i);
      setJPointer(step.j);
      setElevatedIndices(step.elevated);
      setSwapLine(step.swapLine);
      setPhaseText(step.phaseText);
      setCurrentRange(step.range);

      if (step.action === 'new_partition') {
        playBeep(300, 'sine', 0.1);
        await delay(900); // Wait a bit longer to clearly show the range change
      } else if (step.action === 'found') {
        playFoundSound();
        await delay(800);
      } else if (step.action === 'swap') {
        playSwapSound();
        await delay(800);
      } else if (step.action === 'done') {
        playBeep(300, 'sine', 0.1);
        await delay(500);
      } else if (step.action === 'finish') {
        playFoundSound();
      } else {
        const freq = 200 + ((step.array[step.i ?? 0]?.value || 0) * 5); 
        playBeep(freq, 'sine', 0.05);
        await delay(600);
      }
    }
    
    if (isMounted.current && !cancelAnim.current) {
      setIsSorted(true);
    }
    if (isMounted.current) {
      setIsAnimating(false);
    }
  };

  const handleReset = () => {
    playClickSound();
    cancelAnim.current = true; // Interrupt loop if running
    setArray(initialArray);
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
           {/* ESPACIO PARA BACKEND: Aquí es donde conectarán la API Java en el futuro. */}
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
          <div className="relative w-full h-32 md:h-40">
            
            {/* Punteros Superiores */}
            <div className="absolute -top-12 left-0 right-0 h-10 pointer-events-none z-30">
                <div 
                  className={`absolute flex flex-col items-center transition-all duration-500 ${pivotIndex !== null ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
                  style={{ left: `calc(${(pivotIndex ?? 0) * 10}%)`, width: '10%' }}
                >
                    <span className="text-cyan-400 font-bold mb-1 tracking-wider text-sm">PIVOTE</span>
                    <svg className="w-6 h-6 text-cyan-400 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                </div>

                <div 
                  className={`absolute flex flex-col items-center transition-all duration-500 ${iPointer !== null ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
                  style={{ left: `calc(${(iPointer ?? 0) * 10}%)`, width: '10%' }}
                >
                    <span className="text-purple-400 font-bold mb-1 tracking-wider text-sm">i</span>
                    <svg className="w-6 h-6 text-purple-400 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                </div>
                
                <div 
                  className={`absolute flex flex-col items-center transition-all duration-500 ${jPointer !== null ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
                  style={{ left: `calc(${(jPointer ?? 0) * 10}%)`, width: '10%' }}
                >
                    <span className="text-emerald-400 font-bold mb-1 tracking-wider text-sm">j</span>
                    <svg className="w-6 h-6 text-emerald-400 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                </div>
            </div>

            {/* Cajas del Array posicionales absolutas */}
            {array.map((item, index) => {
              const isPivot = index === pivotIndex;
              const isElevated = elevatedIndices.includes(index);
              const isOutOfRange = currentRange && (index < currentRange[0] || index > currentRange[1]);
              
              return (
                <div 
                  key={item.id} 
                  className={`absolute top-0 flex flex-col items-center transition-all duration-700 ease-in-out ${isElevated ? '-translate-y-8 scale-110 z-20' : 'z-10'} ${isOutOfRange ? 'opacity-30 grayscale brightness-50' : 'opacity-100'}`}
                  style={{ left: `calc(${index * 10}%)`, width: '10%' }}
                >
                  <div 
                    className={`w-16 h-20 md:w-20 md:h-24 flex items-center justify-center rounded-lg border-2 transition-all duration-300 shadow-lg ${
                      isElevated
                        ? 'bg-emerald-900/80 border-emerald-400 text-emerald-50 shadow-[0_0_30px_rgba(52,211,153,0.6)]'
                        : isPivot 
                          ? 'bg-cyan-900/50 border-cyan-400 text-cyan-50 shadow-[0_0_20px_rgba(34,211,238,0.4)]'
                          : 'bg-[#0d1a33] border-slate-700 text-white'
                    }`}
                  >
                    <span className="text-2xl md:text-3xl font-black">{item.value}</span>
                  </div>
                </div>
              );
            })}
            
            {/* Índices fijos en la parte inferior */}
            {initialValues.map((_, idx) => (
              <div key={`index-${idx}`} className="absolute bottom-[0px] flex justify-center pointer-events-none" style={{ left: `calc(${idx * 10}%)`, width: '10%' }}>
                <span className="text-slate-400 font-tech-header text-sm tracking-wider">
                  {idx}
                </span>
              </div>
            ))}
            
            {/* Curved arrow mockup representing swaps */}
            <div className="absolute top-full left-0 right-0 h-16 md:h-24 pointer-events-none mt-2 md:mt-4">
              {swapLine && (
                <svg className="absolute top-0 w-full h-full pointer-events-none transition-all duration-500" style={{ left: 0 }}>
                   <path 
                     d={`M calc(${(swapLine.from * 10) + 5}% ) 10 
                         Q 50% 120 
                         calc(${(swapLine.to * 10) + 5}% ) 10`}
                     fill="none" 
                     stroke="rgba(168, 85, 247, 0.7)" 
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

    </div>
  );
};

export default QuickSortPanel;
