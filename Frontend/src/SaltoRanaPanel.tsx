import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Pause, Play, RotateCcw } from 'lucide-react';
import { resolverSaltoDeRana } from './services/saltoRanaService';
import type { MovimientoRana } from './services/saltoRanaService';
import { useNotification } from './NotificationContext';

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

const POSICIONES_X_DE_LOS_JUNCOS = [25, 55, ANCHO_DEL_ESCENARIO - 25, ANCHO_DEL_ESCENARIO - 55];
const POSICIONES_DE_LAS_FLORES = [
  { x: 180, y: 70 },
  { x: 610, y: 50 },
  { x: 1000, y: 80 },
];

// ---------- Componente principal ----------

export const SaltoRanaPanel: React.FC<SaltoRanaPanelProps> = ({ onBack }) => {
  const { showNotification } = useNotification();

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
  const referenciaDelCuadroDeAnimacion = useRef<number | null>(null);
  const referenciaDelCronometro = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { estaReproduciendoRef.current = estaReproduciendo; }, [estaReproduciendo]);
  useEffect(() => { velocidadRef.current = velocidad; }, [velocidad]);
  useEffect(() => { movimientosRef.current = movimientos; }, [movimientos]);

  // --- Sonidos sintetizados con Web Audio API (sin archivos externos) ---
  const obtenerContextoDeAudio = useCallback((): AudioContext => {
    if (!referenciaDelContextoDeAudio.current) {
      const ClaseDeContextoDeAudio = window.AudioContext || (window as any).webkitAudioContext;
      referenciaDelContextoDeAudio.current = new ClaseDeContextoDeAudio();
    }
    return referenciaDelContextoDeAudio.current;
  }, []);

  const reproducirSonidoDeSalto = useCallback(() => {
    try {
      const contexto = obtenerContextoDeAudio();
      const oscilador = contexto.createOscillator();
      const ganancia = contexto.createGain();
      oscilador.type = 'sine';
      oscilador.frequency.setValueAtTime(320, contexto.currentTime);
      oscilador.frequency.exponentialRampToValueAtTime(700, contexto.currentTime + 0.07);
      oscilador.frequency.exponentialRampToValueAtTime(240, contexto.currentTime + 0.16);
      ganancia.gain.setValueAtTime(0.001, contexto.currentTime);
      ganancia.gain.exponentialRampToValueAtTime(0.18, contexto.currentTime + 0.02);
      ganancia.gain.exponentialRampToValueAtTime(0.001, contexto.currentTime + 0.2);
      oscilador.connect(ganancia).connect(contexto.destination);
      oscilador.start();
      oscilador.stop(contexto.currentTime + 0.22);
    } catch {
      // Si el navegador aún bloquea audio por falta de interacción previa, se ignora.
    }
  }, [obtenerContextoDeAudio]);

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

  return (
    <div className="h-dvh min-h-screen w-full overflow-hidden bg-[#0a0d18] text-white flex flex-col items-center justify-between p-4 sm:p-6 font-sans">
      <header className="text-center shrink-0">
        <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
          Algoritmos Recursivos
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2">El Salto de la Rana</h1>
      </header>

      <main className="flex-1 w-full flex flex-col items-center justify-center gap-4 min-h-0">
        <div className="w-full max-w-4xl" style={{ aspectRatio: `${ANCHO_DEL_ESCENARIO} / ${ALTO_DEL_ESCENARIO}` }}>
          <svg
            viewBox={`0 0 ${ANCHO_DEL_ESCENARIO} ${ALTO_DEL_ESCENARIO}`}
            className="w-full h-full rounded-3xl border border-emerald-500/30 shadow-lg"
            role="img"
            aria-label="Estanque con seis ranas sobre rocas"
          >
            <defs>
              <linearGradient id="gradienteDelAgua" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0f766e" />
                <stop offset="100%" stopColor="#134e4a" />
              </linearGradient>
              <radialGradient id="gradienteDeRoca" cx="35%" cy="30%" r="75%">
                <stop offset="0%" stopColor="#94a3b8" />
                <stop offset="100%" stopColor="#475569" />
              </radialGradient>
              <linearGradient id="gradienteDeJunco" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#166534" />
                <stop offset="100%" stopColor="#4ade80" />
              </linearGradient>
            </defs>

            <rect x="0" y="0" width={ANCHO_DEL_ESCENARIO} height={ALTO_DEL_ESCENARIO} fill="url(#gradienteDelAgua)" />

            {[80, 145, 210].map((yOnda, indice) => (
              <path
                key={indice}
                d={`M 40 ${yOnda} Q 200 ${yOnda - 12} 400 ${yOnda} T 800 ${yOnda} T 1160 ${yOnda}`}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="3"
                fill="none"
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
                  y={ALTURA_DE_LAS_ROCAS_EN_Y}
                  tipoDeFicha={celda.tipoDeFicha}
                />
              );
            })}

            {animacionActual && (() => {
              const xOrigen = calcularPosicionXDeLaCasilla(animacionActual.posicionOrigen);
              const xDestino = calcularPosicionXDeLaCasilla(animacionActual.posicionDestino);
              const xActual = xOrigen + (xDestino - xOrigen) * progresoDelSalto;
              const yActual = ALTURA_DE_LAS_ROCAS_EN_Y - calcularAlturaDelArco(progresoDelSalto);
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

        <div className="flex flex-wrap items-center justify-center gap-3 bg-[#11162b] border border-emerald-500/30 rounded-2xl px-5 py-3 shrink-0">
          <div className="flex items-center gap-1 bg-[#0a0d18] rounded-xl p-1 border border-emerald-500/20">
            {(['lento', 'normal', 'rapido'] as VelocidadDeAnimacion[]).map((opcionDeVelocidad) => (
              <button
                key={opcionDeVelocidad}
                onClick={() => setVelocidad(opcionDeVelocidad)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  velocidad === opcionDeVelocidad
                    ? 'bg-emerald-500 text-emerald-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {opcionDeVelocidad}
              </button>
            ))}
          </div>

          <button
            onClick={handleAlternarReproduccion}
            disabled={estaCargando || movimientos.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold transition-all active:scale-95"
          >
            {estaReproduciendo ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {estaReproduciendo ? 'Pausar' : 'Reproducir'}
          </button>

          <button
            onClick={handleReiniciar}
            className="p-2.5 rounded-xl bg-slate-500/20 text-slate-300 hover:bg-slate-500 hover:text-white transition-all"
            title="Reiniciar animación"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400 shrink-0">
          {estaCargando ? 'Calculando la solución...' : `Movimiento ${indiceSiguienteMovimiento} de ${movimientos.length}`}
        </p>
      </main>

      <footer className="flex justify-end w-full max-w-4xl shrink-0">
        <button
          onClick={onBack}
          className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold hover:from-emerald-500 hover:to-teal-500 transition-all duration-200 shadow-lg active:scale-95"
        >
          <ArrowLeft className="w-5 h-5 transition-transform duration-200 group-hover:-translate-x-1" />
          Atrás
        </button>
      </footer>
    </div>
  );
};

export default SaltoRanaPanel;