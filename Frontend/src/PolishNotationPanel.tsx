import React, { useState, useEffect, useRef } from 'react';
import { useMouseParallax } from './useMouseParallax';
import { useSoundEffects } from './useSoundEffects';
import { useNotification } from './NotificationContext';
import { convertirNotacionPolaca } from './services/notacionPolacaService';

export interface PolishNotationPanelProps {
  onBack: () => void;
}

export type PolishMode = 'prefijo' | 'postfijo';
export type AnimationSpeed = 'normal' | 'lento';

export interface PolishStep {
  stepNumber: number;
  operator: string;
  subExpression: string;
  convertedSubExpression: string;
}

// Colores consistentes según el tipo de operador para vincular Pila y Pasos
export const getOperatorColors = (op: string) => {
  switch (op) {
    case '^':
      return {
        bg: 'bg-fuchsia-950/80',
        border: 'border-fuchsia-400',
        text: 'text-fuchsia-300',
        shadow: 'shadow-[0_0_15px_rgba(217,70,239,0.45)]',
        badge: 'bg-fuchsia-950/90 text-fuchsia-300 border-fuchsia-400/60',
      };
    case '*':
      return {
        bg: 'bg-emerald-950/80',
        border: 'border-emerald-400',
        text: 'text-emerald-300',
        shadow: 'shadow-[0_0_15px_rgba(52,211,153,0.45)]',
        badge: 'bg-emerald-950/90 text-emerald-300 border-emerald-400/60',
      };
    case '/':
      return {
        bg: 'bg-cyan-950/80',
        border: 'border-cyan-400',
        text: 'text-cyan-300',
        shadow: 'shadow-[0_0_15px_rgba(34,211,238,0.45)]',
        badge: 'bg-cyan-950/90 text-cyan-300 border-cyan-400/60',
      };
    case '+':
      return {
        bg: 'bg-amber-950/80',
        border: 'border-amber-400',
        text: 'text-amber-300',
        shadow: 'shadow-[0_0_15px_rgba(251,191,36,0.45)]',
        badge: 'bg-amber-950/90 text-amber-300 border-amber-400/60',
      };
    case '-':
      return {
        bg: 'bg-rose-950/80',
        border: 'border-rose-400',
        text: 'text-rose-300',
        shadow: 'shadow-[0_0_15px_rgba(244,63,94,0.45)]',
        badge: 'bg-rose-950/90 text-rose-300 border-rose-400/60',
      };
    case '(':
    case ')':
      return {
        bg: 'bg-indigo-950/80',
        border: 'border-indigo-400',
        text: 'text-indigo-300',
        shadow: 'shadow-[0_0_15px_rgba(129,140,248,0.45)]',
        badge: 'bg-indigo-950/90 text-indigo-300 border-indigo-400/60',
      };
    default:
      return {
        bg: 'bg-[#0e172e]',
        border: 'border-slate-500',
        text: 'text-slate-200',
        shadow: 'shadow-none',
        badge: 'bg-slate-900 text-slate-300 border-slate-600',
      };
  }
};

export const PolishNotationPanel: React.FC<PolishNotationPanelProps> = ({ onBack }) => {
  // Parallax y efectos de sonido
  const parallax = useMouseParallax(12);
  const {
    playClickSound,
    playHoverSound,
    playStackPush,
    playStackPop,
    playPolishEval,
    playTone,
  } = useSoundEffects();
  const { showNotification } = useNotification();

  // Estados principales
  const [expression, setExpression] = useState<string>('(A + B) * (C - D) ^ E');
  const [mode, setMode] = useState<PolishMode>('prefijo');
  const [speed, setSpeed] = useState<AnimationSpeed>('normal');
  const speedRef = useRef<AnimationSpeed>('normal');

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  // Estados de animación
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [steps, setSteps] = useState<PolishStep[]>([]);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(-1);
  const [stackItems, setStackItems] = useState<string[]>([]);

  // Referencias para control de montaje y temporizadores
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isMounted = useRef<boolean>(true);
  const cancelAnim = useRef<boolean>(false);
  const stepsContainerRef = useRef<HTMLDivElement | null>(null);
  const stackScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      cancelAnim.current = true;
    };
  }, []);

  // Enfocar el elemento más reciente agregado al stack si se desborda
  useEffect(() => {
    if (stackScrollRef.current) {
      stackScrollRef.current.scrollTop = 0;
    }
  }, [stackItems]);

  // Fondo dinámico de red de partículas (idéntico a LinearMenuPanel)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const particles = Array.from({ length: 40 }, () => ({
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
        ctx.fillStyle = 'rgba(168, 85, 247, 0.35)';
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
            ctx.strokeStyle = `rgba(99, 102, 241, ${1 - dist / 120})`;
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

  // Validación de la expresión algebraica según PEMDAS y letras A-Z
  const validateExpression = (expr: string): string | null => {
    const clean = expr.replace(/\s+/g, '');
    if (!clean) {
      return 'Ingrese una expresión algebraica infija.';
    }

    // Caracteres permitidos: letras mayúsculas A-Z y operadores PEMDAS: ( ), ^, *, /, +, -
    const invalidChars = clean.match(/[^A-Z\+\-\*\/\^\(\)]/g);
    if (invalidChars) {
      const uniques = Array.from(new Set(invalidChars)).join(', ');
      return `Caracteres no permitidos: [${uniques}]. Solo se permiten letras (A-Z) y operadores PEMDAS: ( ), ^, *, /, +, -.`;
    }

    // Balanceo de paréntesis
    let depth = 0;
    for (let i = 0; i < clean.length; i++) {
      if (clean[i] === '(') depth++;
      if (clean[i] === ')') depth--;
      if (depth < 0) {
        return 'Paréntesis desbalanceados: existe un paréntesis de cierre ")" sin apertura.';
      }
    }
    if (depth !== 0) {
      return 'Paréntesis desbalanceados: falta cerrar paréntesis "(".';
    }

    // Paréntesis vacíos
    if (/\(\)/.test(clean)) {
      return 'Los paréntesis no pueden estar vacíos: "()".';
    }

    // Operadores consecutivos
    if (/[\+\-\*\/\^]{2,}/.test(clean)) {
      return 'Sintaxis inválida: no se permiten operadores consecutivos.';
    }

    // Operador al inicio o al final
    if (/^[\+\-\*\/\^]/.test(clean)) {
      return 'La expresión no puede comenzar con un operador.';
    }
    if (/[\+\-\*\/\^]$/.test(clean)) {
      return 'La expresión no puede terminar con un operador.';
    }

    // Operador después de '(' o antes de ')'
    if (/\([\+\-\*\/\^]/.test(clean)) {
      return 'Sintaxis inválida: operador inmediatamente después de apertura "(".';
    }
    if (/[\+\-\*\/\^]\)/.test(clean)) {
      return 'Sintaxis inválida: operador inmediatamente antes de cierre ")".';
    }

    // Dos operandos contiguos sin operador
    if (/[A-Z]{2,}/.test(clean)) {
      return 'Falta un operador entre operandos consecutivos.';
    }
    if (/[A-Z]\(/.test(clean)) {
      return 'Falta un operador antes del paréntesis "(" (ej. A*(B+C)).';
    }
    if (/\)[A-Z]/.test(clean)) {
      return 'Falta un operador después del paréntesis ")" (ej. (A+B)*C).';
    }
    if (/\)\(/.test(clean)) {
      return 'Falta un operador entre paréntesis adyacentes ")(".';
    }

    // Al menos un operando
    const operands = clean.match(/[A-Z]/g);
    if (!operands || operands.length === 0) {
      return 'La expresión debe contener al menos un operando (A-Z).';
    }

    return null;
  };

  // Manejo de cambio de texto: convierte automáticamente minúsculas a mayúsculas
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const upper = e.target.value.toUpperCase();
    setExpression(upper);

    if (isAnimating || steps.length > 0 || isCompleted) {
      handleReset();
    }
  };

  // Ejecución animada conectada al Backend con control de velocidad
  const handleStartConversion = async () => {
    if (isAnimating) return;

    playClickSound();
    const err = validateExpression(expression);
    if (err) {
      showNotification('error', 'Error de Validación', err);
      playTone(200, 'sawtooth', 0.25, 0.2);
      return;
    }

    setIsAnimating(true);
    setIsCompleted(false);
    cancelAnim.current = false;
    setSteps([]);
    setCurrentStepIdx(-1);
    setStackItems([]);

    try {
      const respuesta = await convertirNotacionPolaca(expression, mode);

      if (respuesta.totalPasos === 0) {
        showNotification('info', 'Sin operadores', 'La expresión no contiene operadores para convertir.');
        setIsAnimating(false);
        return;
      }

      const frames = respuesta.fotogramas;

      // Recorrido de los fotogramas generados por el Backend según el algoritmo del curso
      for (let i = 0; i < frames.length; i++) {
        if (cancelAnim.current || !isMounted.current) break;

        const frame = frames[i];

        // Tiempos dinámicos según speedRef (permite alternar velocidad en tiempo real)
        const pushDelay = speedRef.current === 'lento' ? 1200 : 450;
        const popDelay = speedRef.current === 'lento' ? 1000 : 380;
        const stepDelay = speedRef.current === 'lento' ? 1300 : 500;

        if (frame.tipo === 'push' && frame.pila) {
          setStackItems([...frame.pila]);
          playStackPush();
          await new Promise((r) => setTimeout(r, pushDelay));
        } else if (frame.tipo === 'pop' && frame.pila) {
          setStackItems([...frame.pila]);
          playStackPop();
          await new Promise((r) => setTimeout(r, popDelay));
        } else if (frame.tipo === 'step' && frame.paso) {
          const newStep: PolishStep = {
            stepNumber: frame.paso.numeroPaso,
            operator: frame.paso.operador,
            subExpression: frame.paso.subExpresion,
            convertedSubExpression: frame.paso.subExpresionConvertida,
          };
          setSteps((prev) => [...prev, newStep]);
          setCurrentStepIdx(newStep.stepNumber - 1);

          if (stepsContainerRef.current) {
            stepsContainerRef.current.scrollTop = stepsContainerRef.current.scrollHeight;
          }

          await new Promise((r) => setTimeout(r, stepDelay));
        }
      }

      if (!cancelAnim.current && isMounted.current) {
        setStackItems([]);
        setIsCompleted(true);
        setIsAnimating(false);
        playPolishEval();

        // Asegurar que el paso de resultado quede enfocado con desplazamiento suave
        setTimeout(() => {
          if (stepsContainerRef.current) {
            stepsContainerRef.current.scrollTo({
              top: stepsContainerRef.current.scrollHeight,
              behavior: 'smooth',
            });
          }
        }, 50);
      }
    } catch (apiError: any) {
      setIsAnimating(false);
      showNotification(
        'error',
        'Error de Conversión',
        apiError.message || 'No se pudo conectar con el servidor para la conversión.'
      );
      playTone(200, 'sawtooth', 0.25, 0.2);
    }
  };

  // Reiniciar estado
  const handleReset = () => {
    playClickSound();
    cancelAnim.current = true;
    setIsAnimating(false);
    setIsCompleted(false);
    setSteps([]);
    setCurrentStepIdx(-1);
    setStackItems([]);
  };

  // Cambiar modalidad (Prefijo o Postfijo)
  const handleModeChange = (newMode: PolishMode) => {
    if (isAnimating || mode === newMode) return;
    playClickSound();
    setMode(newMode);
    handleReset();
  };

  // Retroceder al menú principal
  const handleBack = () => {
    playClickSound();
    cancelAnim.current = true;
    onBack();
  };

  return (
    <div className="fixed inset-0 h-dvh w-full bg-[#090b16] text-white flex flex-col justify-between overflow-hidden select-none font-sans">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700;800&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap');

          html, body { overflow: hidden; }
          .font-tech-header { font-family: 'Rajdhani', sans-serif; letter-spacing: 0.08em; }
          .font-tech-body { font-family: 'Plus Jakarta Sans', sans-serif; }

          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(15, 20, 38, 0.6);
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(34, 211, 238, 0.3);
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(34, 211, 238, 0.6);
          }

          @keyframes stackSlideIn {
            0% {
              transform: translateY(-30px) scale(0.92);
              opacity: 0;
            }
            100% {
              transform: translateY(0) scale(1);
              opacity: 1;
            }
          }
          .animate-stack-in {
            animation: stackSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        `}
      </style>

      {/* Canvas dinámico de partículas idéntico a LinearMenuPanel */}
      <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none opacity-60" />

      {/* Destellos ambientales neón con Parallax */}
      <div
        className="fixed -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-indigo-600/15 rounded-full blur-[160px] pointer-events-none z-0"
        style={{ transform: `translate3d(${parallax.x * 0.5}px, ${parallax.y * 0.5}px, 0)` }}
      />
      <div
        className="fixed -bottom-28 -left-28 w-[500px] h-[500px] bg-purple-700/20 rounded-full blur-[150px] pointer-events-none z-0"
        style={{ transform: `translate3d(${parallax.x * 0.8}px, ${parallax.y * 0.8}px, 0)` }}
      />
      <div
        className="fixed -bottom-28 -right-28 w-[500px] h-[500px] bg-cyan-600/20 rounded-full blur-[150px] pointer-events-none z-0"
        style={{ transform: `translate3d(${parallax.x * -0.6}px, ${parallax.y * -0.6}px, 0)` }}
      />

      <div
        className="fixed top-12 left-10 w-32 h-32 opacity-15 pointer-events-none hidden lg:block z-0"
        style={{
          backgroundImage: `radial-gradient(#ffffff 2px, transparent 2px)`,
          backgroundSize: '14px 14px',
          transform: `translate3d(${parallax.x * -1}px, ${parallax.y * -1}px, 0)`,
        }}
      />
      <div
        className="fixed top-12 right-10 w-32 h-32 opacity-15 pointer-events-none hidden lg:block z-0"
        style={{
          backgroundImage: `radial-gradient(#ffffff 2px, transparent 2px)`,
          backgroundSize: '14px 14px',
          transform: `translate3d(${parallax.x}px, ${parallax.y}px, 0)`,
        }}
      />

      {/* ENCABEZADO: Título limpio */}
      <header
        className="relative z-10 w-full flex-shrink-0 flex items-center justify-between px-6 sm:px-10 pt-3 sm:pt-5 pb-1 font-tech-body"
        style={{ transform: `translate3d(${parallax.x * 0.3}px, 0, 0)` }}
      >
        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-100 to-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.3)] font-tech-header tracking-[0.12em] uppercase">
          NOTACIÓN POLACA
        </h1>

        <button
          onClick={handleReset}
          onMouseEnter={playHoverSound}
          className="px-5 py-2 rounded-xl font-bold text-xs sm:text-sm tracking-wider uppercase transition-all active:scale-95 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white shadow-md hover:shadow-orange-500/30 cursor-pointer"
        >
          REINICIAR
        </button>
      </header>

      {/* SECCIÓN SUPERIOR: Campo de entrada y controles de modalidad y velocidad */}
      <section
        className="relative z-10 w-full max-w-4xl mx-auto px-4 flex flex-col items-center mt-1"
        style={{ transform: `translate3d(${parallax.x * 0.4}px, 0, 0)` }}
      >
        {/* Fila del Campo de Entrada + Botón de Conversión */}
        <div className="w-full flex items-center gap-2.5 sm:gap-3">
          <div className="relative flex-1 bg-[#0e172e]/90 border border-cyan-500/40 focus-within:border-cyan-300 focus-within:shadow-[0_0_20px_rgba(6,182,212,0.35)] rounded-2xl flex items-center px-4 py-2.5 transition-all">
            <input
              type="text"
              value={expression}
              onChange={handleInputChange}
              disabled={isAnimating}
              placeholder="EJ: (A + B) * (C - D) ^ E"
              className="w-full bg-transparent text-cyan-50 font-mono font-black text-base sm:text-xl tracking-wider outline-none placeholder:text-slate-500 select-text"
            />
          </div>

          <button
            onClick={handleStartConversion}
            onMouseEnter={playHoverSound}
            disabled={isAnimating}
            className={`shrink-0 px-6 sm:px-8 py-3 rounded-2xl font-bold text-xs sm:text-sm tracking-wider uppercase transition-all font-tech-header cursor-pointer active:scale-95 ${
              isAnimating
                ? 'bg-slate-800/40 text-cyan-200/40 border border-cyan-800/30 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-[0_0_25px_rgba(6,182,212,0.4)] border border-cyan-300/40'
            }`}
          >
            {isAnimating ? 'CONVIRTIENDO...' : 'CONVERTIR'}
          </button>
        </div>

        {/* Fila de Controles: Selector de Modalidad y Selector de Velocidad */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-2 sm:mt-2.5 font-tech-header">
          {/* Modalidad: Prefijo / Postfijo */}
          <div className="flex items-center gap-1.5 bg-[#0e172e]/80 border border-slate-700/60 rounded-xl p-1 shadow-sm">
            <button
              onClick={() => handleModeChange('prefijo')}
              onMouseEnter={playHoverSound}
              disabled={isAnimating}
              className={`px-4 sm:px-5 py-1.5 rounded-lg font-extrabold text-xs sm:text-sm tracking-wider uppercase transition-all duration-300 cursor-pointer ${
                mode === 'prefijo'
                  ? 'bg-cyan-950/90 border border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(34,211,238,0.4)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Prefijo
            </button>

            <button
              onClick={() => handleModeChange('postfijo')}
              onMouseEnter={playHoverSound}
              disabled={isAnimating}
              className={`px-4 sm:px-5 py-1.5 rounded-lg font-extrabold text-xs sm:text-sm tracking-wider uppercase transition-all duration-300 cursor-pointer ${
                mode === 'postfijo'
                  ? 'bg-purple-950/90 border border-purple-400 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Postfijo
            </button>
          </div>

          {/* Velocidad: Normal / Lento (se puede alternar en cualquier momento, incluso durante la animación) */}
          <div className="flex items-center gap-1.5 bg-[#0e172e]/80 border border-slate-700/60 rounded-xl p-1 shadow-sm">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400 px-2 select-none">
              Velocidad:
            </span>
            <button
              onClick={() => {
                playClickSound();
                setSpeed('normal');
              }}
              className={`px-3 py-1 rounded-lg font-extrabold text-xs tracking-wider uppercase transition-all duration-300 cursor-pointer ${
                speed === 'normal'
                  ? 'bg-cyan-900/80 border border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(34,211,238,0.3)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Normal
            </button>
            <button
              onClick={() => {
                playClickSound();
                setSpeed('lento');
              }}
              className={`px-3 py-1 rounded-lg font-extrabold text-xs tracking-wider uppercase transition-all duration-300 cursor-pointer ${
                speed === 'lento'
                  ? 'bg-amber-900/80 border border-amber-400 text-amber-200 shadow-[0_0_10px_rgba(251,191,36,0.3)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Lento
            </button>
          </div>
        </div>
      </section>

      {/* CUERPO PRINCIPAL: Pasos de conversión a la izquierda y Pila vertical a la derecha */}
      <main
        className="relative z-10 max-w-6xl w-full mx-auto flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-5 px-4 sm:px-8 py-3 font-tech-body"
        style={{ transform: `translate3d(${parallax.x * 0.5}px, 0, 0)` }}
      >
        {/* PANEL IZQUIERDO: Pasos de conversión (con padding interno para no cortar esquinas) */}
        <div className="lg:col-span-7 flex flex-col min-h-0 h-full bg-[#0f1426]/85 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-4 sm:p-5 shadow-[0_0_25px_rgba(6,182,212,0.12)]">
          <div className="flex items-center justify-between pb-2.5 border-b border-cyan-500/20 mb-2">
            <h2 className="font-tech-header text-base sm:text-lg font-black uppercase tracking-wider text-cyan-300">
              Pasos de Conversión ({mode.toUpperCase()})
            </h2>
            <span className="font-mono text-xs font-bold text-slate-400 bg-[#090b16] px-2.5 py-1 rounded-lg border border-slate-800">
              {steps.length > 0
                ? `${currentStepIdx >= 0 ? currentStepIdx + 1 : 0} / ${steps.length}`
                : '0'}
            </span>
          </div>

          {/* Lista de pasos con espacio interno suficiente para no cortar esquinas redondeadas ni resplandores */}
          <div
            ref={stepsContainerRef}
            className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-3.5 pr-2.5 sm:pr-3 space-y-3 custom-scrollbar min-h-0"
          >
            {steps.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center p-6 text-slate-500 font-tech-header tracking-wider uppercase text-xs sm:text-sm">
                Sin pasos de conversión
              </div>
            ) : (
              steps.map((step, idx) => {
                const isCurrent = idx === currentStepIdx;
                const isPast = idx < currentStepIdx;
                const isLastStep = idx === steps.length - 1;
                const isResultCard = isCompleted && isLastStep;
                const opColor = getOperatorColors(step.operator);

                // Estilos de la tarjeta de paso
                let cardStyle =
                  'bg-slate-900/30 border-slate-800/40 text-slate-500 opacity-45';
                if (isResultCard) {
                  cardStyle =
                    'bg-emerald-950/90 border-2 border-emerald-400 text-emerald-100';
                } else if (isCurrent) {
                  cardStyle =
                    'bg-cyan-950/70 border-cyan-400 text-white shadow-[0_0_20px_rgba(34,211,238,0.35)]';
                } else if (isPast) {
                  cardStyle = 'bg-[#0e172e]/75 border-slate-700/60 text-slate-300';
                }

                return (
                  <div
                    key={`step-${step.stepNumber}`}
                    className={`relative w-full px-4 py-3 rounded-xl border flex items-center justify-between transition-all duration-300 font-mono shadow-sm ${cardStyle}`}
                  >
                    {/* Número de paso adjacente + Badge del operador con su color distintivo */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-tech-header font-bold text-xs sm:text-sm text-cyan-400 bg-cyan-950/80 border border-cyan-500/40 px-2 py-0.5 rounded-md">
                        #{step.stepNumber}
                      </span>
                      <span
                        className={`font-mono font-black text-xs px-2 py-0.5 rounded border ${opColor.badge}`}
                      >
                        {step.operator}
                      </span>
                    </div>

                    {/* Reducción centrada */}
                    <span
                      className={`font-black text-xs sm:text-sm md:text-base tracking-wider text-center flex-1 mx-2 break-all ${
                        isResultCard ? 'text-emerald-200' : 'text-amber-300'
                      }`}
                    >
                      {step.subExpression} → {step.convertedSubExpression}
                    </span>

                    {/* Indicador de resultado final para el último paso */}
                    {isResultCard && (
                      <span className="font-tech-header font-extrabold text-[11px] uppercase px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/80 shrink-0">
                        ✦ RESULTADO
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* PANEL DERECHO: ¡Una Pila! en disposición vertical (estilo Shunting Yard) */}
        <div className="lg:col-span-5 flex flex-col min-h-0 h-full bg-[#0f1426]/85 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-4 sm:p-5 shadow-[0_0_25px_rgba(168,85,247,0.12)]">
          <div className="flex items-center justify-between pb-2.5 border-b border-purple-500/20 mb-3">
            <h2 className="font-tech-header text-base sm:text-lg font-black uppercase tracking-wider text-purple-300">
              Pila de Operadores (LIFO)
            </h2>
            <span className="font-mono text-xs font-bold text-purple-300 bg-purple-950/70 px-2.5 py-1 rounded-lg border border-purple-500/30">
              {stackItems.length}
            </span>
          </div>

          {/* Contenedor vertical de la Pila de gran altura para alojar cómodamente más de 5 elementos */}
          <div className="flex-1 flex flex-col items-center justify-center relative min-h-0">
            <div
              ref={stackScrollRef}
              className="relative w-48 sm:w-56 h-[320px] sm:h-[380px] md:h-[400px] border-b-4 border-l-2 border-r-2 border-cyan-400/70 rounded-b-2xl bg-[#090e1c]/80 shadow-[0_0_25px_rgba(6,182,212,0.15)] flex flex-col-reverse items-center justify-start gap-2 p-3 overflow-y-auto custom-scrollbar"
            >
              {/* Elementos apilados verticalmente de abajo hacia arriba */}
              {stackItems.length === 0 ? (
                <div className="h-full w-full flex items-center justify-center text-slate-500 font-tech-header text-sm tracking-wider uppercase select-none border border-dashed border-slate-700/60 rounded-xl">
                  Pila Vacía
                </div>
              ) : (
                stackItems.map((op, idx) => {
                  const isTop = idx === stackItems.length - 1;
                  const opColor = getOperatorColors(op);

                  return (
                    <div
                      key={`stack-${idx}-${op}`}
                      className={`relative w-40 sm:w-44 h-10 sm:h-11 rounded-lg flex items-center justify-center font-mono font-black text-xl transition-all duration-300 animate-stack-in border-2 ${opColor.bg} ${opColor.border} ${opColor.text} ${opColor.shadow} ${
                        isTop ? 'scale-105 z-20 ring-2 ring-cyan-300/60' : 'z-10'
                      }`}
                    >
                      {/* Puntero de TOPE sobre el operador más reciente */}
                      {isTop && (
                        <div className="absolute -top-7 flex items-center gap-1 text-cyan-300 font-mono font-bold text-[10px] uppercase px-2 py-0.5 rounded bg-cyan-950/90 border border-cyan-400/60 shadow-[0_0_10px_rgba(34,211,238,0.5)] animate-bounce">
                          <span>TOPE</span>
                          <span>↓</span>
                        </div>
                      )}
                      <span>{op}</span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Base de soporte de la Pila */}
            <div className="w-60 sm:w-68 h-2 bg-gradient-to-r from-cyan-500/20 via-cyan-400/70 to-cyan-500/20 rounded-full mt-1 blur-[1px]" />
          </div>
        </div>
      </main>

      {/* FOOTER: Botón Atrás a la derecha */}
      <footer
        className="relative z-10 w-full flex-shrink-0 px-6 sm:px-10 pb-4 pt-1 flex items-center justify-end font-tech-body"
        style={{ transform: `translate3d(${parallax.x * 0.4}px, 0, 0)` }}
      >
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
          <span className="font-tech-header text-sm tracking-wider">Atrás</span>
        </button>
      </footer>
    </div>
  );
};

export default PolishNotationPanel;
