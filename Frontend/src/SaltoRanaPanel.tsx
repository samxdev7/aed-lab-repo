import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Pause, Play, RotateCcw } from 'lucide-react';
import { resolverSaltoDeRana } from './services/saltoRanaService';
import type { MovimientoRana } from './services/saltoRanaService';
import { useNotification } from './NotificationContext';
import { useSoundEffects } from './useSoundEffects';

interface SaltoRanaPanelProps {
  onBack: () => void;
}

type TipoDeFicha = 'V' | 'C';

interface FichaEnTablero {
  identificadorUnico: string;
  tipoDeFicha: TipoDeFicha;
}

type CeldaDelTablero = FichaEnTablero | null;

type VelocidadDeAnimacion = 'lento' | 'normal' | 'rapido';

interface AnimacionDeSalto {
  identificadorUnico: string;
  tipoFicha: TipoDeFicha;
  posicionOrigen: number;
  posicionDestino: number;
}

// El ejercicio siempre trabaja con 3 ranas verdes y 3 café = 6 ranas fijas.
const RANAS_POR_LADO_FIJAS = 3;
const TOTAL_DE_CASILLAS = RANAS_POR_LADO_FIJAS * 2 + 1;

const DURACION_DE_SALTO_EN_MS: Record<VelocidadDeAnimacion, number> = {
  lento: 950,
  normal: 550,
  rapido: 280,
};

const PAUSA_ENTRE_SALTOS_EN_MS: Record<VelocidadDeAnimacion, number> = {
  lento: 550,
  normal: 260,
  rapido: 90,
};

// Coordenadas propias del escenario SVG: al usar viewBox, TODO escala como
// una sola unidad sin importar el zoom del navegador o el tamaño de pantalla.
const ANCHO_DEL_ESCENARIO = 1200;
const ALTO_DEL_ESCENARIO = 420;
const MARGEN_HORIZONTAL_DEL_ESCENARIO = 130;
const ALTURA_DE_LAS_ROCAS_EN_Y = 300;
const ALTURA_MAXIMA_DEL_SALTO = 95;
// Cuánto se elevan visualmente las ranas por encima del centro de la roca,
// para que se note que están paradas ENCIMA y no flotando sobre ella.
const ALTURA_DE_LA_RANA_SOBRE_LA_ROCA = 14;

// Croar de rana real, incrustado como Data URI para que el componente sea
// autocontenido y no dependa de un archivo de assets externo en el proyecto.
const SONIDO_DE_CROAR_BASE64 = 'data:audio/mpeg;base64,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';

const calcularPosicionXDeLaCasilla = (indiceDeCasilla: number): number => {
  const espacioDisponible = ANCHO_DEL_ESCENARIO - MARGEN_HORIZONTAL_DEL_ESCENARIO * 2;
  const separacionEntreCasillas = espacioDisponible / (TOTAL_DE_CASILLAS - 1);
  return MARGEN_HORIZONTAL_DEL_ESCENARIO + indiceDeCasilla * separacionEntreCasillas;
};

const construirTableroInicial = (): CeldaDelTablero[] => {
  const tablero: CeldaDelTablero[] = [];
  for (let indice = 0; indice < RANAS_POR_LADO_FIJAS; indice++) {
    tablero.push({ identificadorUnico: `verde-${indice}`, tipoDeFicha: 'V' });
  }
  tablero.push(null);
  for (let indice = 0; indice < RANAS_POR_LADO_FIJAS; indice++) {
    tablero.push({ identificadorUnico: `cafe-${indice}`, tipoDeFicha: 'C' });
  }
  return tablero;
};

// Parábola invertida: el salto sube y baja suavemente.
const calcularAlturaDelArco = (progreso: number): number =>
  ALTURA_MAXIMA_DEL_SALTO * 4 * progreso * (1 - progreso);

// Suavizado "ease-in-out" para que el salto no se vea lineal/robótico.
const aplicarSuavizado = (progreso: number): number =>
  progreso < 0.5 ? 2 * progreso * progreso : 1 - Math.pow(-2 * progreso + 2, 2) / 2;

// ---------- Piezas visuales del escenario ----------

const RanaDetallada: React.FC<{
  x: number;
  y: number;
  tipoDeFicha: TipoDeFicha;
  factorDeEstiramiento?: number;
}> = ({ x, y, tipoDeFicha, factorDeEstiramiento = 1 }) => {
  const esRanaVerde = tipoDeFicha === 'V';
  const colorDelCuerpo = esRanaVerde ? '#4ade80' : '#c2854a';
  const colorDelCuerpoOscuro = esRanaVerde ? '#15803d' : '#78350f';
  const colorDelVientre = esRanaVerde ? '#ecfccb' : '#fde68a';

  return (
    <g transform={`translate(${x}, ${y}) scale(${factorDeEstiramiento}, ${2 - factorDeEstiramiento})`}>
      <ellipse cx="-22" cy="14" rx="12" ry="7" fill={colorDelCuerpoOscuro} transform="rotate(25 -22 14)" />
      <ellipse cx="22" cy="14" rx="12" ry="7" fill={colorDelCuerpoOscuro} transform="rotate(-25 22 14)" />
      <ellipse cx="0" cy="0" rx="30" ry="22" fill={colorDelCuerpo} />
      <ellipse cx="0" cy="8" rx="18" ry="12" fill={colorDelVientre} />
      <circle cx="-10" cy="-6" r="3" fill={colorDelCuerpoOscuro} opacity="0.5" />
      <circle cx="9" cy="-9" r="2.5" fill={colorDelCuerpoOscuro} opacity="0.5" />
      <ellipse cx="-18" cy="16" rx="6" ry="4" fill={colorDelCuerpo} />
      <ellipse cx="18" cy="16" rx="6" ry="4" fill={colorDelCuerpo} />
      <circle cx="-11" cy="-18" r="8" fill="white" stroke={colorDelCuerpoOscuro} strokeWidth="1.5" />
      <circle cx="11" cy="-18" r="8" fill="white" stroke={colorDelCuerpoOscuro} strokeWidth="1.5" />
      <circle cx="-9" cy="-18" r="4" fill="#111827" />
      <circle cx="13" cy="-18" r="4" fill="#111827" />
      <circle cx="-10.5" cy="-19.5" r="1.2" fill="white" />
      <circle cx="11.5" cy="-19.5" r="1.2" fill="white" />
      <path d="M -8 2 Q 0 8 8 2" stroke={colorDelCuerpoOscuro} strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </g>
  );
};

const RocaDeApoyo: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x}, ${y})`}>
    <ellipse cx="0" cy="20" rx="46" ry="12" fill="rgba(0,0,0,0.25)" />
    <ellipse cx="0" cy="0" rx="52" ry="26" fill="url(#gradienteDeRoca)" />
    <ellipse cx="-14" cy="-8" rx="16" ry="7" fill="rgba(255,255,255,0.18)" />
    <path d="M -30 6 Q -10 14 10 4 Q 30 -4 40 8" stroke="rgba(0,0,0,0.18)" strokeWidth="3" fill="none" />
  </g>
);

const FlorDeLoto: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x}, ${y})`} opacity={0.92}>
    <ellipse cx="0" cy="22" rx="46" ry="10" fill="#0d9488" opacity={0.6} />
    {[0, 72, 144, 216, 288].map((angulo) => (
      <ellipse key={angulo} cx="0" cy="-10" rx="7" ry="14" fill="#f9a8d4" transform={`rotate(${angulo})`} />
    ))}
    <circle cx="0" cy="0" r="6" fill="#fde047" />
  </g>
);

const JuncoDecorativo: React.FC<{ x: number }> = ({ x }) => (
  <path
    d={`M ${x} ${ALTO_DEL_ESCENARIO} C ${x - 10} ${ALTO_DEL_ESCENARIO - 90}, ${x + 18} ${ALTO_DEL_ESCENARIO - 140}, ${x + 4} ${ALTO_DEL_ESCENARIO - 210}`}
    stroke="url(#gradienteDeJunco)"
    strokeWidth="6"
    strokeLinecap="round"
    fill="none"
  />
);

// Cada ola tiene su propio recorrido y duración para que el agua se sienta
// viva en vez de repetirse de forma idéntica (efecto de parallax sutil).
// Los valores de opacidad y desplazamiento son deliberadamente altos para
// que el movimiento se note con claridad, no solo en teoría.
const OLAS_DEL_AGUA: Array<{ y: number; duracionEnSegundos: number; desplazamiento: number; opacidad: number }> = [
  { y: 80, duracionEnSegundos: 6, desplazamiento: 34, opacidad: 0.32 },
  { y: 145, duracionEnSegundos: 8, desplazamiento: -30, opacidad: 0.26 },
  { y: 210, duracionEnSegundos: 10, desplazamiento: 38, opacidad: 0.22 },
];

// Estilos de animación en CSS puro (en vez de SMIL/animateTransform), que se
// soportan de forma más consistente entre navegadores y motores de render.
const ESTILOS_DE_ANIMACION_DEL_AGUA = `
  @keyframes saltoRana_moverOla {
    0%, 100% { transform: translateX(0px); }
    50% { transform: translateX(var(--desplazamiento-ola, 24px)); }
  }
  @keyframes saltoRana_moverBrillo {
    0% { transform: translateX(-220px); opacity: 0; }
    15% { opacity: 0.55; }
    85% { opacity: 0.55; }
    100% { transform: translateX(1300px); opacity: 0; }
  }
  .ola-de-agua {
    animation-name: saltoRana_moverOla;
    animation-timing-function: ease-in-out;
    animation-iteration-count: infinite;
  }
  .brillo-de-agua {
    animation: saltoRana_moverBrillo 9s linear infinite;
  }
`;

// Pequeños destellos (líneas horizontales) que viajan pegados al brillo que
// cruza el agua, siguiendo el mismo sentido de la corriente que las olas de
// fondo. Se distribuyen de forma irregular en x e y, y con grosor/opacidad
// bajos, para que se vean como reflejos naturales y no como una rejilla.
const LINEAS_DEL_BRILLO: Array<{ x: number; y: number; ancho: number; curvatura: number; grosor: number; opacidad: number }> = [
  { x: -34, y: 42, ancho: 65, curvatura: 5, grosor: 1.5, opacidad: 0.32 },
  { x: 20, y: 88, ancho: 105, curvatura: -6, grosor: 1.5, opacidad: 0.24 },
  { x: -8, y: 128, ancho: 55, curvatura: 4, grosor: 2, opacidad: 0.3 },
  { x: 30, y: 180, ancho: 85, curvatura: -5, grosor: 1.5, opacidad: 0.22 },
  { x: -25, y: 235, ancho: 95, curvatura: 6, grosor: 2, opacidad: 0.28 },
  { x: 5, y: 285, ancho: 60, curvatura: -4, grosor: 1.5, opacidad: 0.2 },
  { x: -15, y: 335, ancho: 90, curvatura: 5, grosor: 1.5, opacidad: 0.25 },
  { x: 22, y: 380, ancho: 55, curvatura: -5, grosor: 1.5, opacidad: 0.18 },
];

const POSICIONES_X_DE_LOS_JUNCOS = [25, 55, ANCHO_DEL_ESCENARIO - 25, ANCHO_DEL_ESCENARIO - 55];
const POSICIONES_DE_LAS_FLORES = [
  { x: 180, y: 70 },
  { x: 610, y: 50 },
  { x: 1000, y: 80 },
];

// ---------- Componente principal ----------

export const SaltoRanaPanel: React.FC<SaltoRanaPanelProps> = ({ onBack }) => {
  const { showNotification } = useNotification();

  const { playHoverSound, playClickSound } = useSoundEffects();
  const [posiciones, setPosiciones] = useState<CeldaDelTablero[]>(construirTableroInicial());
  const [movimientos, setMovimientos] = useState<MovimientoRana[]>([]);
  const [indiceSiguienteMovimiento, setIndiceSiguienteMovimiento] = useState<number>(0);
  const [animacionActual, setAnimacionActual] = useState<AnimacionDeSalto | null>(null);
  const [progresoDelSalto, setProgresoDelSalto] = useState<number>(0);
  const [velocidad, setVelocidad] = useState<VelocidadDeAnimacion>('normal');
  const [estaReproduciendo, setEstaReproduciendo] = useState<boolean>(false);
  const [estaCargando, setEstaCargando] = useState<boolean>(true);

  // Refs con los valores "vivos" para poder leerlos dentro de rAF/setTimeout
  // sin arrastrar closures obsoletos (stale state).
  const posicionesRef = useRef<CeldaDelTablero[]>(posiciones);
  const movimientosRef = useRef<MovimientoRana[]>([]);
  const indiceRef = useRef<number>(0);
  const estaReproduciendoRef = useRef<boolean>(false);
  const velocidadRef = useRef<VelocidadDeAnimacion>('normal');
  const referenciaDelContextoDeAudio = useRef<AudioContext | null>(null);
  const referenciaDelAudioDeCroar = useRef<HTMLAudioElement | null>(null);
  const referenciaDelCuadroDeAnimacion = useRef<number | null>(null);
  const referenciaDelCronometro = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => { estaReproduciendoRef.current = estaReproduciendo; }, [estaReproduciendo]);
  useEffect(() => { velocidadRef.current = velocidad; }, [velocidad]);
  useEffect(() => { movimientosRef.current = movimientos; }, [movimientos]);

  const obtenerContextoDeAudio = useCallback((): AudioContext => {
    if (!referenciaDelContextoDeAudio.current) {
      const ClaseDeContextoDeAudio = window.AudioContext || (window as any).webkitAudioContext;
      referenciaDelContextoDeAudio.current = new ClaseDeContextoDeAudio();
    }
    return referenciaDelContextoDeAudio.current;
  }, []);

  // El croar real de la rana (audio grabado) en lugar de un tono sintetizado.
  const obtenerAudioDeCroar = useCallback((): HTMLAudioElement => {
    if (!referenciaDelAudioDeCroar.current) {
      const audio = new Audio(SONIDO_DE_CROAR_BASE64);
      audio.preload = 'auto';
      audio.volume = 0.85;
      referenciaDelAudioDeCroar.current = audio;
    }
    return referenciaDelAudioDeCroar.current;
  }, []);

  const reproducirSonidoDeSalto = useCallback(() => {
    try {
      const audio = obtenerAudioDeCroar();
      // Reiniciar desde el inicio permite superponer croares si los saltos
      // van muy seguidos (velocidad "rápido") sin cortar el sonido anterior.
      audio.currentTime = 0;
      void audio.play();
    } catch {
      // Si el navegador aún bloquea audio por falta de interacción previa, se ignora.
    }
  }, [obtenerAudioDeCroar]);

  const reproducirSonidoDeAterrizaje = useCallback(() => {
    try {
      const contexto = obtenerContextoDeAudio();
      const duracionEnSegundos = 0.18;
      const tamanoDelBuffer = Math.floor(contexto.sampleRate * duracionEnSegundos);
      const bufferDeRuido = contexto.createBuffer(1, tamanoDelBuffer, contexto.sampleRate);
      const datosDelCanal = bufferDeRuido.getChannelData(0);
      for (let indice = 0; indice < tamanoDelBuffer; indice++) {
        datosDelCanal[indice] = (Math.random() * 2 - 1) * (1 - indice / tamanoDelBuffer);
      }
      const fuenteDeRuido = contexto.createBufferSource();
      fuenteDeRuido.buffer = bufferDeRuido;
      const filtroPasaBajos = contexto.createBiquadFilter();
      filtroPasaBajos.type = 'lowpass';
      filtroPasaBajos.frequency.value = 700;
      const ganancia = contexto.createGain();
      ganancia.gain.setValueAtTime(0.28, contexto.currentTime);
      ganancia.gain.exponentialRampToValueAtTime(0.001, contexto.currentTime + duracionEnSegundos);
      fuenteDeRuido.connect(filtroPasaBajos).connect(ganancia).connect(contexto.destination);
      fuenteDeRuido.start();
    } catch {
      // Igual que arriba.
    }
  }, [obtenerContextoDeAudio]);

  // --- Carga de la solución (siempre 3 vs 3 = 6 ranas) ---
  useEffect(() => {
    let estaMontado = true;
    setEstaCargando(true);
    resolverSaltoDeRana(RANAS_POR_LADO_FIJAS)
      .then((respuesta) => {
        if (estaMontado) setMovimientos(respuesta.movimientos);
      })
      .catch((error: any) => {
        if (estaMontado) {
          showNotification('error', 'Error al calcular la solución', error.message || 'No se pudo contactar al backend.');
        }
      })
      .finally(() => {
        if (estaMontado) setEstaCargando(false);
      });
    return () => { estaMontado = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const limpiarTemporizadores = useCallback(() => {
    if (referenciaDelCronometro.current !== null) {
      clearTimeout(referenciaDelCronometro.current);
      referenciaDelCronometro.current = null;
    }
    if (referenciaDelCuadroDeAnimacion.current !== null) {
      cancelAnimationFrame(referenciaDelCuadroDeAnimacion.current);
      referenciaDelCuadroDeAnimacion.current = null;
    }
  }, []);

  useEffect(() => () => limpiarTemporizadores(), [limpiarTemporizadores]);

  const ejecutarElSiguienteSalto = useCallback(() => {
    const movimientosActuales = movimientosRef.current;
    const indiceActual = indiceRef.current;
    if (indiceActual >= movimientosActuales.length) return;

    const movimiento = movimientosActuales[indiceActual];
    const fichaQueSalta = posicionesRef.current[movimiento.posicionOrigen];
    if (!fichaQueSalta) return;

    reproducirSonidoDeSalto();

    const inicioEnMilisegundos = performance.now();
    const duracionEnMilisegundos = DURACION_DE_SALTO_EN_MS[velocidadRef.current];

    setAnimacionActual({
      identificadorUnico: fichaQueSalta.identificadorUnico,
      tipoFicha: fichaQueSalta.tipoDeFicha,
      posicionOrigen: movimiento.posicionOrigen,
      posicionDestino: movimiento.posicionDestino,
    });

    const animarCuadro = (marcaDeTiempoActual: number) => {
      const tiempoTranscurrido = marcaDeTiempoActual - inicioEnMilisegundos;
      const progresoSinSuavizar = Math.min(tiempoTranscurrido / duracionEnMilisegundos, 1);
      setProgresoDelSalto(aplicarSuavizado(progresoSinSuavizar));

      if (progresoSinSuavizar < 1) {
        referenciaDelCuadroDeAnimacion.current = requestAnimationFrame(animarCuadro);
        return;
      }

      reproducirSonidoDeAterrizaje();

      const posicionesNuevas = [...posicionesRef.current];
      posicionesNuevas[movimiento.posicionDestino] = posicionesNuevas[movimiento.posicionOrigen];
      posicionesNuevas[movimiento.posicionOrigen] = null;
      posicionesRef.current = posicionesNuevas;
      setPosiciones(posicionesNuevas);

      setAnimacionActual(null);
      setProgresoDelSalto(0);

      indiceRef.current = indiceActual + 1;
      setIndiceSiguienteMovimiento(indiceRef.current);

      if (indiceRef.current >= movimientosActuales.length) {
        setEstaReproduciendo(false);
        showNotification('success', '¡Solución completada!', 'Las ranas verdes y café intercambiaron sus lugares.');
        return;
      }

      if (estaReproduciendoRef.current) {
        referenciaDelCronometro.current = setTimeout(
          ejecutarElSiguienteSalto,
          PAUSA_ENTRE_SALTOS_EN_MS[velocidadRef.current]
        );
      }
    };

    referenciaDelCuadroDeAnimacion.current = requestAnimationFrame(animarCuadro);
  }, [reproducirSonidoDeSalto, reproducirSonidoDeAterrizaje, showNotification]);

  const handleAlternarReproduccion = () => {
    playClickSound();
    if (estaReproduciendo) {
      setEstaReproduciendo(false);
      if (referenciaDelCronometro.current !== null) {
        clearTimeout(referenciaDelCronometro.current);
        referenciaDelCronometro.current = null;
      }
      return;
    }
    if (indiceRef.current >= movimientosRef.current.length) return;
    setEstaReproduciendo(true);
    if (!animacionActual) {
      ejecutarElSiguienteSalto();
    }
  };

  const handleReiniciar = () => {
    playClickSound();
    limpiarTemporizadores();
    setEstaReproduciendo(false);
    setAnimacionActual(null);
    setProgresoDelSalto(0);
    const tableroInicial = construirTableroInicial();
    posicionesRef.current = tableroInicial;
    setPosiciones(tableroInicial);
    indiceRef.current = 0;
    setIndiceSiguienteMovimiento(0);
  };

    // Fondo dinámico de nodos (igual que el panel de 8 Reinas)
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

    const particles = Array.from({ length: 45 }, () => ({
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

    return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#03060d] text-white flex flex-col items-center justify-between px-4 sm:px-6 py-3 font-sans select-none">
      {/* Fondo: red de nodos + destellos (igual que 8 Reinas) */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none opacity-60" />
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/20 rounded-full blur-[120px] pointer-events-none z-0" />

      <header className="relative z-10 text-center shrink-0">
        <span className="text-xs uppercase tracking-widest text-emerald-300 font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-400/40 shadow-[0_0_15px_rgba(16,185,129,0.25)]">
          Algoritmos Recursivos
        </span>
        <h1 className="text-3xl sm:text-4xl font-black tracking-[0.12em] uppercase mt-2 text-transparent bg-clip-text bg-gradient-to-b from-white via-emerald-100 to-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.35)]">
          El Salto de la Rana
        </h1>
      </header>

      <main className="relative z-10 flex-1 w-full flex flex-col items-center justify-center gap-3 min-h-0">
        <div
          className="shrink-0"
          style={{
            aspectRatio: `${ANCHO_DEL_ESCENARIO} / ${ALTO_DEL_ESCENARIO}`,
            width: 'min(100%, 56rem, calc((100dvh - 19rem) * 2.857))',
          }}
        >
          <svg
            viewBox={`0 0 ${ANCHO_DEL_ESCENARIO} ${ALTO_DEL_ESCENARIO}`}
            className="w-full h-full rounded-3xl border border-emerald-400/40 shadow-[0_0_35px_rgba(16,185,129,0.25)]"
            role="img"
            aria-label="Estanque con seis ranas sobre rocas"
          >
            <defs>
              <linearGradient id="gradienteDelAgua" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2dd4bf" />
                <stop offset="55%" stopColor="#0e9488" />
                <stop offset="100%" stopColor="#0f766e" />
              </linearGradient>
              <radialGradient id="gradienteDeRoca" cx="35%" cy="30%" r="75%">
                <stop offset="0%" stopColor="#94a3b8" />
                <stop offset="100%" stopColor="#475569" />
              </radialGradient>
              <linearGradient id="gradienteDeJunco" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#166534" />
                <stop offset="100%" stopColor="#4ade80" />
              </linearGradient>
              <filter id="desenfoqueSuave" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="20" />
              </filter>
            </defs>

            <style>{ESTILOS_DE_ANIMACION_DEL_AGUA}</style>

            <rect x="0" y="0" width={ANCHO_DEL_ESCENARIO} height={ALTO_DEL_ESCENARIO} fill="url(#gradienteDelAgua)" />

            {/* Franja de luz que cruza el agua de lado a lado, acompañada de
                pequeños destellos (líneas) que viajan pegados a ella — el
                indicador de movimiento más evidente, más allá del ondulado
                sutil de las olas. */}
            <g className="brillo-de-agua">
              <ellipse
                cx="0"
                cy={ALTO_DEL_ESCENARIO / 2 - 20}
                rx="70"
                ry="240"
                fill="rgba(255,255,255,0.55)"
                filter="url(#desenfoqueSuave)"
              />
              {LINEAS_DEL_BRILLO.map((linea, indice) => (
                <path
                  key={indice}
                  d={`M ${linea.x - linea.ancho / 2} ${linea.y} Q ${linea.x} ${linea.y - linea.curvatura} ${
                    linea.x + linea.ancho / 2
                  } ${linea.y}`}
                  stroke="rgba(255,255,255,0.85)"
                  strokeWidth={linea.grosor}
                  strokeLinecap="round"
                  fill="none"
                  opacity={linea.opacidad}
                />
              ))}
            </g>

            {OLAS_DEL_AGUA.map((ola, indice) => (
              <path
                key={indice}
                className="ola-de-agua"
                d={`M 40 ${ola.y} Q 200 ${ola.y - 14} 400 ${ola.y} T 800 ${ola.y} T 1160 ${ola.y}`}
                stroke="rgba(255,255,255,0.55)"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
                opacity={ola.opacidad}
                style={
                  {
                    animationDuration: `${ola.duracionEnSegundos}s`,
                    '--desplazamiento-ola': `${ola.desplazamiento}px`,
                  } as React.CSSProperties
                }
              />
            ))}

            {POSICIONES_X_DE_LOS_JUNCOS.map((x) => (
              <JuncoDecorativo key={x} x={x} />
            ))}

            {POSICIONES_DE_LAS_FLORES.map((flor) => (
              <FlorDeLoto key={`${flor.x}-${flor.y}`} x={flor.x} y={flor.y} />
            ))}

            {Array.from({ length: TOTAL_DE_CASILLAS }).map((_, indice) => (
              <RocaDeApoyo key={indice} x={calcularPosicionXDeLaCasilla(indice)} y={ALTURA_DE_LAS_ROCAS_EN_Y} />
            ))}

            {posiciones.map((celda, indice) => {
              if (!celda) return null;
              if (animacionActual && celda.identificadorUnico === animacionActual.identificadorUnico) return null;
              return (
                <RanaDetallada
                  key={celda.identificadorUnico}
                  x={calcularPosicionXDeLaCasilla(indice)}
                  y={ALTURA_DE_LAS_ROCAS_EN_Y - ALTURA_DE_LA_RANA_SOBRE_LA_ROCA}
                  tipoDeFicha={celda.tipoDeFicha}
                />
              );
            })}

            {animacionActual && (() => {
              const xOrigen = calcularPosicionXDeLaCasilla(animacionActual.posicionOrigen);
              const xDestino = calcularPosicionXDeLaCasilla(animacionActual.posicionDestino);
              const xActual = xOrigen + (xDestino - xOrigen) * progresoDelSalto;
              const yActual =
                ALTURA_DE_LAS_ROCAS_EN_Y - ALTURA_DE_LA_RANA_SOBRE_LA_ROCA - calcularAlturaDelArco(progresoDelSalto);
              const factorDeEstiramiento = 1 + 0.12 * Math.sin(Math.PI * progresoDelSalto);
              return (
                <RanaDetallada
                  x={xActual}
                  y={yActual}
                  tipoDeFicha={animacionActual.tipoFicha}
                  factorDeEstiramiento={factorDeEstiramiento}
                />
              );
            })()}
          </svg>
        </div>

                <div className="flex flex-wrap items-center justify-center gap-3 bg-[#0B0F19]/85 backdrop-blur-md border border-emerald-400/30 rounded-2xl px-5 py-2.5 shrink-0 shadow-[0_0_25px_rgba(16,185,129,0.15)]">
          <div className="flex items-center gap-1 bg-[#02050f] rounded-xl p-1 border border-cyan-500/30">
            {(['lento', 'normal', 'rapido'] as VelocidadDeAnimacion[]).map((opcionDeVelocidad) => (
              <button
                key={opcionDeVelocidad}
                onClick={() => {
                  playClickSound();
                  setVelocidad(opcionDeVelocidad);
                }}
                onMouseEnter={playHoverSound}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize tracking-wide transition-all ${
                  velocidad === opcionDeVelocidad
                    ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-900 shadow-[0_0_12px_rgba(34,211,238,0.6)]'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {opcionDeVelocidad}
              </button>
            ))}
          </div>

                    <button
            onClick={handleAlternarReproduccion}
            onMouseEnter={playHoverSound}
            disabled={estaCargando || movimientos.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:via-teal-400 hover:to-cyan-400 disabled:opacity-50 text-white font-bold tracking-wide shadow-[0_0_20px_rgba(20,184,166,0.45)] hover:shadow-[0_0_28px_rgba(34,211,238,0.7)] hover:-translate-y-0.5 transition-all active:scale-95"
          >
            {estaReproduciendo ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {estaReproduciendo ? 'Pausar' : 'Reproducir'}
          </button>

          <button
            onClick={handleReiniciar}
            onMouseEnter={playHoverSound}
            className="p-2.5 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white shadow-md hover:shadow-[0_0_18px_rgba(249,115,22,0.6)] transition-all active:scale-95"
            title="Reiniciar animación"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs font-bold tracking-widest text-cyan-300/70 uppercase shrink-0">
          {estaCargando ? 'Calculando la solución...' : `Movimiento ${indiceSiguienteMovimiento} de ${movimientos.length}`}
        </p>
      </main>

        <footer className="relative z-10 flex justify-end w-full shrink-0 px-6 pb-1 pt-1">
        <button
          onClick={() => {
            playClickSound();
            onBack();
          }}
          onMouseEnter={playHoverSound}
          className="relative inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-[length:200%_auto] hover:bg-right shadow-lg shadow-indigo-600/40 hover:shadow-purple-500/70 hover:-translate-y-1 active:translate-y-0 active:scale-95 transition-all duration-300 group cursor-pointer border border-indigo-300/30"
        >
          <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1.5 transition-transform duration-300" />
          <span className="text-[15px] tracking-wider capitalize">Atrás</span>
        </button>
      </footer>
    </div>
  );
};

export default SaltoRanaPanel;