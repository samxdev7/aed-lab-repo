import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TorresHanoiDto {
  disco: number;
  origen: 'A' | 'B' | 'C';
  destino: 'A' | 'B' | 'C';
}

interface TorresEstado {
  A: number[];
  B: number[];
  C: number[];
}

interface HanoiPanelProps {
  onBack?: () => void;
}

// Mapa de colores individuales para cada disco (del 1 al 7)
const DISK_COLORS: Record<number, { bg: string; border: string; text: string; shadow: string }> = {
  1: { bg: 'bg-cyan-500/30', border: 'border-cyan-400', text: 'text-cyan-200', shadow: 'shadow-cyan-500/40' },
  2: { bg: 'bg-emerald-500/30', border: 'border-emerald-400', text: 'text-emerald-200', shadow: 'shadow-emerald-500/40' },
  3: { bg: 'bg-yellow-500/30', border: 'border-yellow-400', text: 'text-yellow-200', shadow: 'shadow-yellow-500/40' },
  4: { bg: 'bg-orange-500/30', border: 'border-orange-400', text: 'text-orange-200', shadow: 'shadow-orange-500/40' },
  5: { bg: 'bg-pink-500/30', border: 'border-pink-400', text: 'text-pink-200', shadow: 'shadow-pink-500/40' },
  6: { bg: 'bg-purple-500/30', border: 'border-purple-400', text: 'text-purple-200', shadow: 'shadow-purple-500/40' },
  7: { bg: 'bg-indigo-500/30', border: 'border-indigo-400', text: 'text-indigo-200', shadow: 'shadow-indigo-500/40' },
};

// Altura de despeje: cuánto debe subir el disco (medido desde la base de la
// torre) para liberar el poste más alto antes de desplazarse horizontalmente.
const ALTURA_DESPEJE = 280;

// Alto de cada disco (h-9 = 36px) + separación entre discos (gap-1.5 = 6px).
// Se usa para calcular a qué altura real, dentro de su pila, estaba el disco
// antes de moverse.
const DISC_HEIGHT_PX = 36;
const DISC_GAP_PX = 6;
const SLOT_PITCH_PX = DISC_HEIGHT_PX + DISC_GAP_PX;

export const HanoiPanel: React.FC<HanoiPanelProps> = ({ onBack }) => {
  const [discos, setDiscos] = useState<number>(3);
  const [movimientos, setMovimientos] = useState<TorresHanoiDto[]>([]);
  const [pasoActual, setPasoActual] = useState<number>(0);
  const [cargando, setCargando] = useState<boolean>(false);
  const [reproduciendo, setReproduciendo] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [torres, setTorres] = useState<TorresEstado>({
    A: [3, 2, 1],
    B: [],
    C: [],
  });

  // Refs a los contenedores de cada poste, usados para medir la distancia
  // horizontal REAL entre torres (en píxeles) en lugar de asumirla en %.
  const torreRefs = {
    A: useRef<HTMLDivElement>(null),
    B: useRef<HTMLDivElement>(null),
    C: useRef<HTMLDivElement>(null),
  };

  // Contexto de Audio para sintetizar el sonido de impacto de discos
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playDiscSound = () => {
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

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      // Ignorar restricciones de reproducción automática de audio si no hay interacción
    }
  };

  // Consumir API del Backend
  const resolverHanoi = async (): Promise<void> => {
    setCargando(true);
    setReproduciendo(false);
    setError(null);
    try {
      const response = await fetch(`http://localhost:8080/api/hanoi/resolver/${discos}`);

      if (!response.ok) {
        throw new Error('Error al conectar con el servidor.');
      }

      const data: TorresHanoiDto[] = await response.json();
      setMovimientos(data);
      setPasoActual(0);

      const discosIniciales = Array.from({ length: discos }, (_, i) => discos - i);
      setTorres({ A: discosIniciales, B: [], C: [] });
      setReproduciendo(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCargando(false);
    }
  };

  const ejecutarSiguientePaso = () => {
    if (pasoActual >= movimientos.length) {
      setReproduciendo(false);
      return;
    }

    const { disco, origen, destino } = movimientos[pasoActual];

    setTorres((prev) => {
      const nuevaOrigen = prev[origen].filter((d) => d !== disco);
      const nuevaDestino = [...prev[destino], disco];

      return {
        ...prev,
        [origen]: nuevaOrigen,
        [destino]: nuevaDestino,
      };
    });

    setPasoActual((prev) => prev + 1);
  };

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (reproduciendo && pasoActual < movimientos.length) {
      timer = setInterval(() => {
        ejecutarSiguientePaso();
      }, 700);
    } else if (pasoActual >= movimientos.length) {
      setReproduciendo(false);
    }
    return () => clearInterval(timer);
  }, [reproduciendo, pasoActual, movimientos]);

  const reiniciar = (): void => {
    setReproduciendo(false);
    const discosIniciales = Array.from({ length: discos }, (_, i) => discos - i);
    setTorres({ A: discosIniciales, B: [], C: [] });
    setMovimientos([]);
    setPasoActual(0);
    setError(null);
  };

  return (
    <div className="relative h-dvh w-screen max-h-dvh bg-slate-950 text-indigo-200 font-sans flex flex-col justify-between pt-3 px-8 pb-4 overflow-hidden select-none">

      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e1b4b15_1px,transparent_1px),linear-gradient(to_bottom,#1e1b4b15_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 left-1/3 w-[400px] h-[200px] bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none" />

      <header className="relative z-10 border-b border-indigo-900/40 pb-3 flex justify-between items-center flex-shrink-0">
        <div>
          <h1 className="text-4xl font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">
            Torres de Hanoi
          </h1>
          <p className="text-sm font-medium text-indigo-400 mt-1">
            {cargando ? 'RESOLVIENDO...' : reproduciendo ? 'ANIMANDO...' : 'LISTO PARA EJECUTAR'}
          </p>
        </div>

        <div className="flex items-center gap-6">
          <label className="text-base font-semibold text-indigo-300 flex items-center gap-3 bg-slate-900/80 px-4 py-2.5 rounded-2xl border border-indigo-800/40 backdrop-blur-md">
            DISCOS [1-7]:
            <input
              type="number"
              min="1"
              max="7"
              value={discos}
              disabled={reproduciendo}
              onChange={(e) => {
                const nuevaCantidad = Math.min(7, Math.max(1, Number(e.target.value)));
                setDiscos(nuevaCantidad);

                // Reflejar el cambio de inmediato en la torre A, sin esperar a EJECUTAR.
                const discosIniciales = Array.from({ length: nuevaCantidad }, (_, i) => nuevaCantidad - i);
                setTorres({ A: discosIniciales, B: [], C: [] });
                setMovimientos([]);
                setPasoActual(0);
                setError(null);
              }}
              className="w-16 bg-slate-950 border border-indigo-600/50 text-indigo-200 font-bold px-2 py-1 rounded-xl text-center focus:outline-none focus:border-blue-400 text-lg disabled:opacity-50"
            />
          </label>

          <button
            onClick={resolverHanoi}
            disabled={cargando || reproduciendo}
            className="px-8 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-bold text-base rounded-full shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/50 active:scale-95 transition-all duration-200 flex items-center gap-2 disabled:opacity-40"
          >
            <span>EJECUTAR</span>
            <span className="text-lg">➔</span>
          </button>

          <button
            onClick={() => setReproduciendo(!reproduciendo)}
            disabled={movimientos.length === 0 || pasoActual >= movimientos.length}
            className="px-8 py-3.5 bg-gradient-to-r from-indigo-700 via-purple-600 to-indigo-800 hover:from-indigo-600 hover:to-purple-500 text-white font-bold text-base rounded-full shadow-lg shadow-purple-600/30 hover:shadow-purple-500/50 active:scale-95 transition-all duration-200 flex items-center gap-2 disabled:opacity-40"
          >
            <span>{reproduciendo ? 'PAUSAR' : 'REPRODUCIR'}</span>
            <span className="text-xs bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-400/30">
              {pasoActual}/{movimientos.length}
            </span>
          </button>

          <button
            onClick={reiniciar}
            className="px-8 py-3.5 bg-gradient-to-r from-red-600 via-red-500 to-red-600 hover:from-red-500 hover:to-red-600 text-white font-bold text-base rounded-full shadow-lg shadow-red-600/30 hover:shadow-red-500/50 active:scale-95 transition-all duration-200 flex items-center gap-2 disabled:opacity-40"
          >
            REINICIAR
          </button>
        </div>
      </header>

      {error && (
        <div className="relative z-10 bg-red-950/80 border border-red-500/60 text-red-200 p-3 text-sm text-center rounded-2xl shadow-lg backdrop-blur-md">
          ERROR: {error}
        </div>
      )}

      <main className="relative z-10 flex-1 min-h-0 flex items-end justify-around py-4 px-12">
        {(['A', 'B', 'C'] as const).map((torreKey) => (
          <div key={torreKey} className="relative flex flex-col items-center justify-end h-full w-1/4">

            <div className="absolute -top-1 text-2xl font-extrabold text-indigo-100 tracking-wider drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">
              {torreKey}
            </div>

            <div className="absolute bottom-4 w-4 h-[85%] max-h-[320px] bg-gradient-to-t from-slate-800 to-indigo-950/80 rounded-t-lg border-t-2 border-indigo-500/30 shadow-lg shadow-indigo-950/50" />

            {/* Contenedor de discos: ahora con ref para poder medir su posición real en pantalla */}
            <div
              ref={torreRefs[torreKey]}
              className="z-10 flex flex-col-reverse items-center w-full mb-3 gap-1.5 relative min-h-[200px]"
            >
              <AnimatePresence>
                {torres[torreKey].map((discoId) => {
                  const anchoPorcentaje = 25 + (discoId / 7) * 70;
                  const style = DISK_COLORS[discoId] || DISK_COLORS[1];

                  const ultimoPaso = movimientos[pasoActual - 1];
                  const esDiscoMovido = ultimoPaso && ultimoPaso.disco === discoId;

                  // Distancia horizontal REAL (en px) entre el centro del poste de
                  // origen y el centro del poste de destino, medida en el DOM.
                  // Esto reemplaza el cálculo en % relativo al ancho del propio
                  // disco, que no coincidía con la separación real entre postes
                  // y hacía que el disco "derivara" a la izquierda/derecha en
                  // lugar de salir exactamente sobre su torre.
                  let startXpx = 0;
                  let startYpx = 0;
                  let peakYpx = -ALTURA_DESPEJE;
                  if (esDiscoMovido) {
                    const origenEl = torreRefs[ultimoPaso.origen as 'A' | 'B' | 'C'].current;
                    const destinoEl = torreRefs[ultimoPaso.destino as 'A' | 'B' | 'C'].current;
                    if (origenEl && destinoEl) {
                      const origenRect = origenEl.getBoundingClientRect();
                      const destinoRect = destinoEl.getBoundingClientRect();
                      startXpx =
                        (origenRect.left + origenRect.width / 2) -
                        (destinoRect.left + destinoRect.width / 2);
                    }

                    // Índice (desde la base, 0 = piso) de la posición que ocupaba
                    // el disco en la torre de origen justo antes de moverse: como
                    // se quitó de arriba de la pila, es la cantidad de discos que
                    // quedaron debajo de él en el origen.
                    const origIdx = torres[ultimoPaso.origen].length;
                    // Índice de su posición final (de reposo) en la torre destino:
                    // queda arriba de todo lo que ya había ahí.
                    const destIdx = torres[ultimoPaso.destino].length - 1;

                    // El "reposo natural" del disco (transform y:0) corresponde a
                    // destIdx. Para que arranque visualmente a la altura real en la
                    // que estaba en origen (origIdx), y luego suba a la altura de
                    // despeje, se calculan ambos offsets relativos a ese reposo.
                    startYpx = (destIdx - origIdx) * SLOT_PITCH_PX;
                    peakYpx = destIdx * SLOT_PITCH_PX - ALTURA_DESPEJE;
                  }

                  return (
                    <motion.div
                      key={discoId}
                      // Se quita layoutId: la animación automática de layout (FLIP)
                      // de Framer Motion competía con el "animate" manual de abajo,
                      // provocando el desplazamiento diagonal/desordenado.
                      // layout={false} asegura que SOLO la secuencia manual controle
                      // la posición de este disco.
                      layout={false}
                      initial={esDiscoMovido ? { x: startXpx, y: startYpx } : false}
                      animate={{
                        // 1) Permanece sobre el eje de origen, a la altura real donde estaba
                        // 2) Sube verticalmente liberando el tope de la torre
                        // 3) Se desplaza en el aire hasta el eje de destino
                        // 4) Baja verticalmente hasta su posición final de reposo
                        x: esDiscoMovido ? [startXpx, startXpx, 0, 0] : 0,
                        y: esDiscoMovido ? [startYpx, peakYpx, peakYpx, 0] : 0,
                      }}
                      transition={{
                        duration: 0.6,
                        times: [0, 0.25, 0.75, 1],
                        ease: 'easeInOut',
                      }}
                      onAnimationComplete={() => {
                        // El sonido de "choque" suena justo cuando el disco
                        // termina de bajar y se posa sobre la torre destino.
                        if (esDiscoMovido) {
                          playDiscSound();
                        }
                      }}
                      style={{ width: `${anchoPorcentaje}%` }}
                      className={`h-9 ${style.bg} border-2 ${style.border} rounded-xl flex items-center justify-center text-sm font-extrabold ${style.text} shadow-lg ${style.shadow} backdrop-blur-sm z-30`}
                    >
                      {discoId}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            <div className="w-full h-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-t-2 border-indigo-500/40 rounded-xl text-center text-xs text-indigo-300 pt-0.5 font-bold shadow-2xl">
            </div>
          </div>
        ))}
      </main>

      <footer className="border-t border-emerald-900/40 pt-2 text-xs text-slate-500 flex justify-between items-center flex-shrink-0">
        <span>
          {movimientos[pasoActual - 1]
            ? ` MOVIMIENTO: Disco ${movimientos[pasoActual - 1].disco} [${movimientos[pasoActual - 1].origen} -> ${movimientos[pasoActual - 1].destino}]`
            : '> ESPERANDO EJECUCION...'}
        </span>

        {onBack && (
          <button
            onClick={onBack}
            className="px-6 py-3.5 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 hover:from-slate-700 hover:to-slate-600 border border-indigo-500/30 text-indigo-200 font-bold text-base rounded-full shadow-lg shadow-slate-900/50 hover:shadow-indigo-500/20 active:scale-95 transition-all duration-200 flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5 transition-transform duration-200 group-hover:-translate-x-1" />
            <span>INICIO</span>
          </button>
        )}
      </footer>
    </div>
  );
};