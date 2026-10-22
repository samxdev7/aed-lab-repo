import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, Save, Trash2 } from 'lucide-react';

import { useSoundEffects } from './useSoundEffects';
import { useNotification } from './NotificationContext';
import {
  obtenerEstadoPila,
  definirTamanoPila,
  pushCentroComercial,
  popCentroComercial,
  type PilaEstado,
  type PilaEstadoConElemento,
  type TipoMensajePila,
} from './services/pilaService';

export interface StackPanelProps {
  onBack: () => void;
}

/* ---------- Tipos propios del panel ---------- */
type CasillaPila = string | null; // Una casilla guarda el nombre de un centro comercial o está libre
type EstiloMensaje = { pill: string; dot: string };
type EstiloCasilla = { casilla: string; texto: string };
type Indicador = { etiqueta: string; valor: string; activo: boolean };
type ElementoSaliente = { indice: number; nombre: string }; // Dato que acaba de salir con Pop (solo para la animación)
type Particula = { x: number; y: number; vx: number; vy: number; tamano: number };

/* ---------- Constantes ---------- */
const TAMANO_MAXIMO_PILA: number = 100; // Debe coincidir con el Backend
const MAX_CARACTERES_NOMBRE: number = 30; // Debe coincidir con el Backend
const CARACTERES_NO_PERMITIDOS: RegExp = /[^\p{L}\d .'-]/gu; // Letras, números, espacio, punto, apóstrofo y guion
const DURACION_ANIMACION_APILAR_MS: number = 600;
const DURACION_ANIMACION_DESAPILAR_MS: number = 500;

// Se muestra mientras llega el primer estado del Backend (max = 0 significa "pila sin crear")
const ESTADO_PILA_INICIAL: PilaEstado = {
  elementos: [],
  tope: -1,
  max: 0,
  mensaje: 'Cargando estado de la pila...',
  tipoMensaje: 'info',
  elementoAfectado: null,
};

const ESTILOS_MENSAJE: Record<TipoMensajePila, EstiloMensaje> = {
  info: { pill: 'bg-cyan-500/10 border-cyan-400/40 text-cyan-200', dot: 'bg-cyan-400' },
  ok: { pill: 'bg-emerald-500/10 border-emerald-400/40 text-emerald-200', dot: 'bg-emerald-400' },
  warn: { pill: 'bg-amber-500/10 border-amber-400/40 text-amber-200', dot: 'bg-amber-400' },
};

const obtenerEstiloCasilla = (esTope: boolean, nombre: CasillaPila): EstiloCasilla => {
  if (esTope) {
    return {
      casilla: 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.35)]',
      texto: 'text-cyan-100',
    };
  }
  if (nombre !== null) {
    return { casilla: 'bg-[#151b33]/90 border-purple-500/40', texto: 'text-slate-100' };
  }
  return { casilla: 'bg-white/5 border-dashed border-white/10', texto: 'text-slate-600' };
};

export const StackPanel: React.FC<StackPanelProps> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const filaVisibleRef = useRef<HTMLDivElement | null>(null); // Fila del tope (o la base si la pila está vacía)
  const { playClickSound, playHoverSound, playStackPush, playStackPop, playTone } = useSoundEffects();
  const { showNotification } = useNotification();

  // ========================================================
  // ESTADO DE LA PILA (VIENE DEL BACKEND)
  // ========================================================
  const [estadoPila, setEstadoPila] = useState<PilaEstado>(ESTADO_PILA_INICIAL);
  const [tamanoPilaTexto, setTamanoPilaTexto] = useState<string>('');
  const [nombreCentroComercial, setNombreCentroComercial] = useState<string>('');
  const [ultimoDatoExtraido, setUltimoDatoExtraido] = useState<string | null>(null);
  const [indiceRecienApilado, setIndiceRecienApilado] = useState<number | null>(null);
  const [elementoSaliente, setElementoSaliente] = useState<ElementoSaliente | null>(null);
  const [estaCargando, setEstaCargando] = useState<boolean>(false);

  const elementos: string[] = estadoPila.elementos;
  const tope: number = estadoPila.tope;
  const max: number = estadoPila.max;
  const pilaCreada: boolean = max > 0;
  const cantidadElementos: number = tope + 1;
  const porcentajeOcupacion: number = pilaCreada ? (cantidadElementos / max) * 100 : 0;
  const bandPilaLlena: boolean = pilaCreada && tope === max - 1; // Resultado de Pilallena
  const bandPilaVacia: boolean = pilaCreada && tope === -1;      // Resultado de Pilavacia
  const indiceFilaVisible: number = Math.max(tope, 0);

  // Índices de arriba hacia abajo: el tope visual queda arriba y la base (0) abajo
  const indicesDeArribaAbajo: number[] = Array.from(
    { length: max },
    (_elemento: unknown, posicion: number): number => max - 1 - posicion
  );

  const indicadores: Indicador[] = [
    { etiqueta: 'Pila Llena', valor: bandPilaLlena ? 'Verdadero' : 'Falso', activo: bandPilaLlena },
    { etiqueta: 'Pila Vacía', valor: bandPilaVacia ? 'Verdadero' : 'Falso', activo: bandPilaVacia },
    { etiqueta: 'Elemento eliminado (Pop)', valor: ultimoDatoExtraido ?? '—', activo: ultimoDatoExtraido !== null },
  ];

  // Carga inicial: el Backend conserva la pila aunque se cambie de pantalla
  useEffect(() => {
    const cargarEstadoInicial = async (): Promise<void> => {
      try {
        const estadoInicial: PilaEstado = await obtenerEstadoPila();
        setEstadoPila(estadoInicial);
        if (estadoInicial.max > 0) setTamanoPilaTexto(String(estadoInicial.max));
      } catch {
        setEstadoPila((estadoAnterior: PilaEstado): PilaEstado => ({
          ...estadoAnterior,
          mensaje: 'Sin conexión con el Backend. Inícielo para operar la pila.',
          tipoMensaje: 'warn',
        }));
      }
    };
    cargarEstadoInicial();
  }, []);

  // Mantiene a la vista el tope: si la pila no cabe en pantalla, el scroll baja o sube solo
  useEffect(() => {
    filaVisibleRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [tope, max]);

  // ========================================================
  // OPERACIONES (Crear pila, Push y Pop comparten el mismo flujo)
  // T es el tipo exacto que devuelve cada operación: PilaEstadoConElemento en Push/Pop, PilaEstado en Crear pila.
  // Si el Backend responde con error (Desbordamiento / Subdesbordamiento) se muestra el mensaje y se devuelve null.
  // ========================================================
  const ejecutarOperacion = async <T extends PilaEstado>(
    operacion: () => Promise<T>,
    tituloError: string
  ): Promise<T | null> => {
    try {
      setEstaCargando(true);
      playClickSound();
      const nuevoEstado: T = await operacion();
      setEstadoPila(nuevoEstado);
      return nuevoEstado;
    } catch (error: unknown) {
      const mensajeError: string = error instanceof Error ? error.message : 'Error desconocido.';
      playTone(200, 'sawtooth', 0.25, 0.2);
      setEstadoPila((estadoAnterior: PilaEstado): PilaEstado => ({
        ...estadoAnterior,
        mensaje: mensajeError,
        tipoMensaje: 'warn',
      }));
      showNotification('error', tituloError, mensajeError);
      return null;
    } finally {
      setEstaCargando(false);
    }
  };

  const handleCrearPila = async (): Promise<void> => {
    const tamanoIngresado: number = Number(tamanoPilaTexto);
    if (!Number.isInteger(tamanoIngresado) || tamanoIngresado < 1 || tamanoIngresado > TAMANO_MAXIMO_PILA) {
      playTone(200, 'sawtooth', 0.25, 0.2);
      showNotification('warning', 'Tamaño Inválido', `Ingrese un número entero entre 1 y ${TAMANO_MAXIMO_PILA}.`);
      return;
    }

    const nuevoEstado: PilaEstado | null = await ejecutarOperacion(
      (): Promise<PilaEstado> => definirTamanoPila(tamanoIngresado),
      'Error al Crear la Pila'
    );
    if (nuevoEstado === null) return;

    setNombreCentroComercial('');
    setUltimoDatoExtraido(null);
    showNotification('success', 'Pila Creada', nuevoEstado.mensaje);
  };

  const handlePush = async (): Promise<void> => {
    const nombreLimpio: string = nombreCentroComercial.trim();
    if (nombreLimpio === '') {
      playTone(200, 'sawtooth', 0.25, 0.2);
      showNotification('warning', 'Campo Vacío', 'Ingrese el nombre del centro comercial.');
      return;
    }

    const nuevoEstado: PilaEstadoConElemento | null = await ejecutarOperacion(
      (): Promise<PilaEstadoConElemento> => pushCentroComercial(nombreLimpio),
      'Error al Apilar'
    );
    if (nuevoEstado === null) return;

    playStackPush();
    setNombreCentroComercial('');
    setUltimoDatoExtraido(null);
    setIndiceRecienApilado(nuevoEstado.tope);
    setTimeout((): void => setIndiceRecienApilado(null), DURACION_ANIMACION_APILAR_MS);
    showNotification('success', 'Centro Comercial Apilado', nuevoEstado.mensaje);
  };

  const handlePop = async (): Promise<void> => {
    const nuevoEstado: PilaEstadoConElemento | null = await ejecutarOperacion(
      (): Promise<PilaEstadoConElemento> => popCentroComercial(),
      'Error al Desapilar'
    );
    if (nuevoEstado === null) return;

    playStackPop();
    setUltimoDatoExtraido(nuevoEstado.elementoAfectado);
    // El dato salió de la casilla que era el tope antes del Pop (tope nuevo + 1)
    setElementoSaliente({ indice: nuevoEstado.tope + 1, nombre: nuevoEstado.elementoAfectado });
    setTimeout((): void => setElementoSaliente(null), DURACION_ANIMACION_DESAPILAR_MS);
    showNotification('info', 'Centro Comercial Desapilado', nuevoEstado.mensaje);
  };

  // Fondo animado de partículas neón
  useEffect(() => {
    const canvas: HTMLCanvasElement | null = canvasRef.current;
    if (!canvas) return;
    const contexto: CanvasRenderingContext2D | null = canvas.getContext('2d');
    if (!contexto) return;

    let idAnimacion: number;
    let ancho: number = (canvas.width = window.innerWidth);
    let alto: number = (canvas.height = window.innerHeight);

    const alCambiarTamano = (): void => {
      ancho = canvas.width = window.innerWidth;
      alto = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', alCambiarTamano);

    const particulas: Particula[] = Array.from(
      { length: 45 },
      (): Particula => ({
        x: Math.random() * ancho,
        y: Math.random() * alto,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        tamano: Math.random() * 2 + 1,
      })
    );

    const dibujarFotograma = (): void => {
      contexto.clearRect(0, 0, ancho, alto);
      for (let i: number = 0; i < particulas.length; i++) {
        const particula: Particula = particulas[i];
        particula.x += particula.vx;
        particula.y += particula.vy;
        if (particula.x < 0 || particula.x > ancho) particula.vx *= -1;
        if (particula.y < 0 || particula.y > alto) particula.vy *= -1;

        contexto.beginPath();
        contexto.arc(particula.x, particula.y, particula.tamano, 0, Math.PI * 2);
        contexto.fillStyle = 'rgba(168, 85, 247, 0.4)';
        contexto.fill();

        for (let j: number = i + 1; j < particulas.length; j++) {
          const otra: Particula = particulas[j];
          const distancia: number = Math.hypot(particula.x - otra.x, particula.y - otra.y);
          if (distancia < 130) {
            contexto.beginPath();
            contexto.moveTo(particula.x, particula.y);
            contexto.lineTo(otra.x, otra.y);
            contexto.strokeStyle = `rgba(99, 102, 241, ${1 - distancia / 130})`;
            contexto.lineWidth = 0.5;
            contexto.stroke();
          }
        }
      }
      idAnimacion = requestAnimationFrame(dibujarFotograma);
    };
    dibujarFotograma();

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
          .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(34, 211, 238, 0.3); border-radius: 4px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(34, 211, 238, 0.6); }

          @keyframes pointer-nudge {
            0%, 100% { transform: translateX(0); }
            50% { transform: translateX(-4px); }
          }
          .anim-pointer { animation: pointer-nudge 1.2s ease-in-out infinite; }

          @keyframes cell-pop {
            0% { transform: scale(0.3); opacity: 0; }
            60% { transform: scale(1.3); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }
          .anim-cell-pop { animation: cell-pop 0.55s cubic-bezier(0.22, 1, 0.36, 1) both; }

          @keyframes cell-leave {
            0% { transform: translateY(0) scale(1); opacity: 1; }
            100% { transform: translateY(-38px) scale(0.6); opacity: 0; }
          }
          .anim-cell-leave { animation: cell-leave 0.5s ease-in forwards; }
        `}
      </style>

      {/* Fondo: red de nodos + destellos */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none opacity-60" />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-600/20 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* ENCABEZADO */}
      <header className="relative z-10 shrink-0 text-center px-10 pt-4 pb-2 space-y-1.5">
        <h1
          className="font-tech-header font-extrabold uppercase leading-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-purple-300 drop-shadow-[0_0_25px_rgba(168,85,247,0.5)]"
          style={{ fontSize: 'clamp(1.5rem, 6vh, 2.6rem)', letterSpacing: '0.08em' }}
        >
          Pilas
        </h1>

        <div className="flex items-center justify-center gap-3 text-purple-200/90 -translate-y-5">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span className="h-[1px] w-10 sm:w-24 bg-gradient-to-r from-transparent to-cyan-400" />
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
          </div>
          <span className="tracking-wide font-bold text-slate-200 uppercase text-xs sm:text-base">
            Centros Comerciales (LIFO)
          </span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_10px_#c084fc]" />
            <span className="h-[1px] w-10 sm:w-24 bg-gradient-to-l from-transparent to-purple-400" />
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
          </div>
        </div>
      </header>

      {/* ZONA CENTRAL: la pila a la izquierda, controles e indicadores a la derecha */}
      <main className="relative z-10 flex-1 min-h-0 w-full max-w-6xl mx-auto px-10 py-2 grid grid-cols-1 lg:grid-cols-12 lg:grid-rows-[minmax(0,1fr)] gap-5">
        {/* TARJETA: LA PILA */}
        <section className="lg:col-span-7 min-h-0 flex flex-col bg-[#0f1426]/85 backdrop-blur-xl border border-cyan-500/40 rounded-2xl px-5 py-3 shadow-[0_0_35px_rgba(34,211,238,0.15)]">
          {/* Tope / Max + capacidad */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-2">
                <span className="font-tech-header font-bold text-sm text-cyan-300 tracking-wider">Tope =</span>
                <div className="min-w-10 h-8 px-2 bg-[#03060d] border border-cyan-500/40 rounded-lg flex items-center justify-center font-mono-tech text-sm font-black text-white shadow-[0_0_10px_rgba(34,211,238,0.25)]">
                  {tope}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-tech-header font-bold text-sm text-purple-300 tracking-wider">Max =</span>
                <div className="min-w-10 h-8 px-2 bg-[#03060d] border border-purple-500/40 rounded-lg flex items-center justify-center font-mono-tech text-sm font-black text-white shadow-[0_0_10px_rgba(168,85,247,0.25)]">
                  {pilaCreada ? max : '—'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-tech-header font-bold uppercase tracking-wider text-slate-300">Capacidad</span>
              <div className="w-24 h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-500"
                  style={{ width: `${porcentajeOcupacion}%` }}
                />
              </div>
              <span className="font-mono-tech text-xs font-bold text-cyan-300">
                {cantidadElementos}/{max}
              </span>
            </div>
          </div>

          {/* Casillas con scroll: la de mayor índice arriba, la base (0) abajo */}
          <div className="flex-1 min-h-0 mt-3 overflow-y-auto overflow-x-hidden pr-1 custom-scrollbar">
            <div className={`min-h-full flex flex-col gap-1 ${pilaCreada ? 'justify-end' : 'justify-center'}`}>
              {!pilaCreada ? (
                <p className="text-center font-tech-header text-sm uppercase tracking-wider text-slate-500">
                  Defina el tamaño de la pila para comenzar
                </p>
              ) : (
                indicesDeArribaAbajo.map((indice: number) => {
                  const nombre: CasillaPila = elementos[indice] ?? null;
                  const esTope: boolean = indice === tope;
                  const estaRecienApilada: boolean = indice === indiceRecienApilado;
                  const estilo: EstiloCasilla = obtenerEstiloCasilla(esTope, nombre);

                  return (
                    <div
                      key={indice}
                      ref={indice === indiceFilaVisible ? filaVisibleRef : undefined}
                      className="flex items-center gap-2 h-11 shrink-0"
                    >
                      <span className="w-8 shrink-0 text-right font-mono-tech text-[11px] font-bold text-slate-400">
                        {indice}
                      </span>

                      <div
                        className={`relative flex-1 h-full rounded-xl border flex items-center justify-center transition-all duration-300 ${estilo.casilla} ${
                          estaRecienApilada ? 'scale-105 shadow-[0_0_22px_#22d3ee] z-10' : ''
                        }`}
                      >
                        <span
                          className={`font-mono-tech text-sm sm:text-base font-bold truncate px-3 ${estilo.texto} ${
                            estaRecienApilada ? 'anim-cell-pop' : ''
                          }`}
                        >
                          {nombre ?? '—'}
                        </span>

                        {/* Centro comercial que acaba de salir con Pop */}
                        {elementoSaliente?.indice === indice && (
                          <span className="absolute inset-0 flex items-center justify-center px-3 truncate font-mono-tech text-sm sm:text-base font-bold text-rose-300 anim-cell-leave pointer-events-none">
                            {elementoSaliente.nombre}
                          </span>
                        )}
                      </div>

                      {/* Puntero TOPE */}
                      <div className="w-20 shrink-0">
                        {esTope && (
                          <div className="flex items-center gap-1 text-cyan-300 anim-pointer">
                            <ArrowLeft className="w-4 h-4" />
                            <span className="text-[11px] font-extrabold font-tech-header uppercase tracking-wider drop-shadow-[0_0_6px_#22d3ee]">
                              Tope
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {/* Base de la pila */}
              {pilaCreada && (
                <div className="h-1.5 mt-1 shrink-0 rounded-full bg-gradient-to-r from-cyan-500/20 via-cyan-400/70 to-cyan-500/20" />
              )}
            </div>
          </div>
        </section>

        {/* COLUMNA DERECHA: tamaño, controles e indicadores de los algoritmos */}
        <div className="lg:col-span-5 min-h-0 flex flex-col justify-center gap-4">
          {/* Tamaño de la pila (Max) */}
          <section className="bg-[#0f1426]/85 backdrop-blur-xl border border-cyan-500/30 rounded-2xl px-5 py-3 shadow-[0_0_35px_rgba(34,211,238,0.12)] flex flex-col gap-2">
            <label htmlFor="tamanoPilaInput" className="font-tech-header text-base font-bold text-slate-100 tracking-wide">
              Tamaño de la pila (Max):
            </label>

            <div className="flex items-center gap-3">
              <input
                id="tamanoPilaInput"
                type="number"
                min={1}
                max={TAMANO_MAXIMO_PILA}
                step={1}
                autoFocus
                placeholder={`1 a ${TAMANO_MAXIMO_PILA}`}
                value={tamanoPilaTexto}
                onChange={(evento: React.ChangeEvent<HTMLInputElement>): void => setTamanoPilaTexto(evento.target.value)}
                onKeyDown={(evento: React.KeyboardEvent<HTMLInputElement>): void => {
                  if (evento.key === 'Enter' && !estaCargando) handleCrearPila();
                }}
                className="flex-1 min-w-0 bg-[#03060d] border border-slate-500/50 focus:border-cyan-400 rounded-xl px-4 py-2 text-base text-white placeholder:text-slate-500 focus:outline-none transition-all font-mono-tech font-bold"
              />
              <button
                type="button"
                onClick={handleCrearPila}
                onMouseEnter={playHoverSound}
                disabled={estaCargando}
                title="Crea una pila vacía (también sirve para reiniciarla)"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-slate-200 bg-slate-700/50 border border-slate-500/40 hover:bg-slate-700 active:scale-95 transition-transform duration-200 cursor-pointer shrink-0 font-tech-header text-base tracking-wider whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-5 h-5" />
                Crear pila
              </button>
            </div>
          </section>

          {/* Insertar / Eliminar */}
          <section className="bg-[#0f1426]/85 backdrop-blur-xl border border-purple-500/30 rounded-2xl px-5 py-4 shadow-[0_0_35px_rgba(168,85,247,0.12)] flex flex-col gap-3">
            <label htmlFor="centroComercialInput" className="font-tech-header text-base font-bold text-slate-100 tracking-wide">
              Centro comercial:
            </label>

            <div className="relative">
              <input
                id="centroComercialInput"
                type="text"
                maxLength={MAX_CARACTERES_NOMBRE}
                placeholder="Ej: Metrocentro"
                value={nombreCentroComercial}
                disabled={!pilaCreada}
                onChange={(evento: React.ChangeEvent<HTMLInputElement>): void =>
                  setNombreCentroComercial(evento.target.value.replace(CARACTERES_NO_PERMITIDOS, ''))
                }
                onKeyDown={(evento: React.KeyboardEvent<HTMLInputElement>): void => {
                  if (evento.key === 'Enter' && !estaCargando) handlePush();
                }}
                className="w-full bg-[#03060d] border border-slate-500/50 focus:border-cyan-400 rounded-xl pl-4 pr-16 py-2.5 text-base text-white placeholder:text-slate-500 focus:outline-none transition-all font-mono-tech font-bold disabled:opacity-50"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-mono-tech text-slate-500">
                {nombreCentroComercial.length}/{MAX_CARACTERES_NOMBRE}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handlePush}
                onMouseEnter={playHoverSound}
                disabled={estaCargando || !pilaCreada}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-[#03060d] bg-cyan-400 hover:bg-cyan-300 hover:-translate-y-0.5 active:scale-95 transition-transform duration-200 cursor-pointer font-tech-header text-base tracking-wider whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                Insertar (Push)
              </button>

              <button
                type="button"
                onClick={handlePop}
                onMouseEnter={playHoverSound}
                disabled={estaCargando || !pilaCreada}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-slate-200 bg-slate-700/50 border border-slate-500/40 hover:bg-slate-700 hover:-translate-y-0.5 active:scale-95 transition-transform duration-200 cursor-pointer font-tech-header text-base tracking-wider whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-5 h-5" />
                Eliminar (Pop)
              </button>
            </div>
          </section>

          {/* Resultado de los algoritmos */}
          <section className="bg-[#0f1426]/85 backdrop-blur-xl border border-cyan-500/30 rounded-2xl px-5 py-3 shadow-[0_0_35px_rgba(34,211,238,0.12)] flex flex-col gap-2">
            {indicadores.map((indicador: Indicador) => (
              <div key={indicador.etiqueta} className="flex items-center justify-between gap-3">
                <span className="font-tech-header font-bold text-sm text-slate-300 tracking-wider">{indicador.etiqueta}</span>
                <span
                  className={`max-w-[55%] truncate px-3 py-1 rounded-lg border font-mono-tech text-xs font-bold transition-colors duration-300 ${
                    indicador.activo
                      ? 'bg-cyan-500/15 border-cyan-400/60 text-cyan-200'
                      : 'bg-[#03060d] border-slate-600/50 text-slate-400'
                  }`}
                >
                  {indicador.valor}
                </span>
              </div>
            ))}
          </section>
        </div>
      </main>

      {/* FOOTER: estado a la izquierda, Atrás a la derecha */}
      <footer className="relative z-20 shrink-0 flex items-center justify-between gap-6 px-10 pt-2 pb-3">
        <div
          className={`inline-flex items-start gap-2 min-w-0 max-w-[70%] px-4 py-2 rounded-2xl border backdrop-blur-md text-xs font-mono-tech transition-colors duration-300 ${ESTILOS_MENSAJE[estadoPila.tipoMensaje].pill}`}
        >
          <span className={`w-2 h-2 mt-1 shrink-0 rounded-full ${ESTILOS_MENSAJE[estadoPila.tipoMensaje].dot}`} />
          <span className="break-words">{estadoPila.mensaje}</span>
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

export default StackPanel;