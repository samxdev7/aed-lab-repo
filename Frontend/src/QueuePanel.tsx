import React, { useEffect, useRef, useState } from 'react';

import { ArrowLeft, ArrowDown, ArrowUp, Save, Trash2, RotateCcw } from 'lucide-react';

import { useSoundEffects } from './useSoundEffects';
import { useNotification } from './NotificationContext';
import {
  obtenerEstadoCola,
  encolarPersona,
  desencolarPersona,
  reiniciarCola,
  type ColaEstado,
  type ContenidoCasilla,
  type TipoMensajeCola,
} from './services/colaService';

export interface QueuePanelProps {
  onBack: () => void;
}

// Deben coincidir con ColaServicio.MAX y ColaServicio.LONGITUD_MAXIMA_NOMBRE del backend
const CAPACIDAD_COLA: number = 8;
const LONGITUD_MAXIMA_NOMBRE: number = 12;

type MensajeEstado = { tipo: TipoMensajeCola; texto: string };
type EstiloMensaje = { pill: string; dot: string };
type PersonaSaliente = { indice: number; nombre: string };
type Particula = { x: number; y: number; vx: number; vy: number; tamano: number };

// Record<K, V> (genérico): un estilo por cada tipo de mensaje posible
const ESTILOS_MENSAJE: Record<TipoMensajeCola, EstiloMensaje> = {
  info: { pill: 'bg-purple-500/10 border-purple-400/40 text-purple-200', dot: 'bg-purple-400' },
  ok: { pill: 'bg-emerald-500/10 border-emerald-400/40 text-emerald-200', dot: 'bg-emerald-400' },
  warn: { pill: 'bg-amber-500/10 border-amber-400/40 text-amber-200', dot: 'bg-amber-400' },
};

// Centro horizontal (en %) de cada casilla, para colocar los punteros
const centroCasillaEnPorcentaje = (indiceCasilla: number): number =>
  ((indiceCasilla + 0.5) * 100) / CAPACIDAD_COLA;

const obtenerTextoError = (error: unknown): string =>
  error instanceof Error ? error.message : 'No se pudo conectar con el servidor.';

const obtenerTextoCasilla = (nombre: ContenidoCasilla, yaAtendida: boolean): string => {
  if (nombre !== null) return nombre;
  return yaAtendida ? '✕' : '—';
};

const obtenerClaseCasilla = (
  esFrente: boolean,
  esFinal: boolean,
  yaAtendida: boolean,
  tieneNombre: boolean
): string => {
  if (esFrente && esFinal) return 'bg-yellow-500/25 border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.4)]';
  if (esFrente) return 'bg-rose-500/20 border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.35)]';
  if (esFinal) return 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.35)]';
  if (tieneNombre) return 'bg-[#151b33]/90 border-emerald-500/40';
  if (yaAtendida) return 'celda-atendida bg-slate-900/60 border-dashed border-slate-600/50';
  return 'bg-white/5 border-dashed border-white/10';
};

export const QueuePanel: React.FC<QueuePanelProps> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { playClickSound, playHoverSound, playQueueSlide, playQueueOut, playTone } = useSoundEffects();
  const { showNotification } = useNotification();

  // ========================================================
  // ESTADO DE LA COLA (CONECTADO AL BACKEND)
  // ========================================================
  const [casillasCola, setCasillasCola] = useState<ContenidoCasilla[]>(
    Array<ContenidoCasilla>(CAPACIDAD_COLA).fill(null)
  );
  const [indiceFrente, setIndiceFrente] = useState<number>(-1);
  const [indiceFinal, setIndiceFinal] = useState<number>(-1);
  const [clientesEnEspera, setClientesEnEspera] = useState<number>(0);

  const [nombreIngresado, setNombreIngresado] = useState<string>('');
  const [mensajeEstado, setMensajeEstado] = useState<MensajeEstado>({
    tipo: 'info',
    texto: 'Cargando estado de la cola...',
  });
  const [indiceAnimado, setIndiceAnimado] = useState<number | null>(null);
  const [personaSaliente, setPersonaSaliente] = useState<PersonaSaliente | null>(null);
  const [estaCargando, setEstaCargando] = useState<boolean>(false);

  const aplicarEstado = (estado: ColaEstado): void => {
    setCasillasCola(estado.cola);
    setIndiceFrente(estado.frente);
    setIndiceFinal(estado.finalCola);
    setClientesEnEspera(estado.cantidad);
    setMensajeEstado({ tipo: estado.tipoMensaje, texto: estado.mensaje });
  };

  const mostrarError = (error: unknown, titulo: string): void => {
    const textoError: string = obtenerTextoError(error);
    playTone(200, 'sawtooth', 0.25, 0.2);
    setMensajeEstado({ tipo: 'warn', texto: textoError });
    showNotification('error', titulo, textoError);
  };

  // Carga inicial del estado desde el backend
  useEffect(() => {
    const cargarEstadoInicial = async (): Promise<void> => {
      try {
        const estadoInicial: ColaEstado = await obtenerEstadoCola();
        aplicarEstado(estadoInicial);
      } catch {
        setMensajeEstado({
          tipo: 'warn',
          texto: 'Sin conexión con el backend. Inícielo para sincronizar la cola.',
        });
      }
    };
    void cargarEstadoInicial();
  }, []);

  // ========================================================
  // OPERACIONES: ENCOLAR Y DESENCOLAR (ALGORITMOS EN EL BACKEND)
  // ========================================================
  const manejarEncolar = async (): Promise<void> => {
    const nombreLimpio: string = nombreIngresado.trim();
    if (nombreLimpio === '') {
      playTone(200, 'sawtooth', 0.25, 0.2);
      showNotification('warning', 'Campo Vacío', 'Ingrese el nombre de la persona que llegó al banco.');
      return;
    }

    try {
      setEstaCargando(true);
      playClickSound();
      const estado: ColaEstado = await encolarPersona(nombreLimpio);
      playQueueSlide();
      setNombreIngresado('');
      aplicarEstado(estado);
      if (estado.indiceAfectado !== null) {
        setIndiceAnimado(estado.indiceAfectado);
        setTimeout((): void => setIndiceAnimado(null), 600);
      }
      showNotification('success', 'Persona Encolada', estado.mensaje);
    } catch (error: unknown) {
      mostrarError(error, 'Error al Encolar');
    } finally {
      setEstaCargando(false);
    }
  };

  const manejarDesencolar = async (): Promise<void> => {
    try {
      setEstaCargando(true);
      playClickSound();
      const estado: ColaEstado = await desencolarPersona();
      playQueueOut();
      if (estado.indiceAfectado !== null && estado.elementoAfectado !== null) {
        setPersonaSaliente({ indice: estado.indiceAfectado, nombre: estado.elementoAfectado });
        setTimeout((): void => setPersonaSaliente(null), 500);
      }
      aplicarEstado(estado);
      showNotification('info', 'Persona Atendida', estado.mensaje);
    } catch (error: unknown) {
      mostrarError(error, 'Error al Desencolar');
    } finally {
      setEstaCargando(false);
    }
  };

  const manejarReiniciar = async (): Promise<void> => {
    try {
      setEstaCargando(true);
      playClickSound();
      setNombreIngresado('');
      const estado: ColaEstado = await reiniciarCola();
      aplicarEstado(estado);
      showNotification('info', 'Cola Reiniciada', 'La cola ha sido vaciada exitosamente.');
    } catch (error: unknown) {
      mostrarError(error, 'Error al Reiniciar');
    } finally {
      setEstaCargando(false);
    }
  };

  const manejarCambioNombre = (evento: React.ChangeEvent<HTMLInputElement>): void => {
    const soloLetrasYEspacios: string = evento.target.value.replace(/[^\p{L} ]/gu, '');
    setNombreIngresado(soloLetrasYEspacios);
  };

  const manejarTecla = (evento: React.KeyboardEvent<HTMLInputElement>): void => {
    if (evento.key === 'Enter' && !estaCargando) void manejarEncolar();
  };

  // Fondo animado de partículas neón
  useEffect(() => {
    const canvas: HTMLCanvasElement | null = canvasRef.current;
    if (!canvas) return;
    const contexto: CanvasRenderingContext2D | null = canvas.getContext('2d');
    if (!contexto) return;

    let idAnimacion: number = 0;
    let ancho: number = (canvas.width = window.innerWidth);
    let alto: number = (canvas.height = window.innerHeight);

    const ajustarTamano = (): void => {
      ancho = canvas.width = window.innerWidth;
      alto = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', ajustarTamano);

    const particulas: Particula[] = Array.from({ length: 45 }, (): Particula => ({
      x: Math.random() * ancho,
      y: Math.random() * alto,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      tamano: Math.random() * 2 + 1,
    }));

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

    return () => {
      window.removeEventListener('resize', ajustarTamano);
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

          @keyframes float-arrow {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-4px); }
          }
          .anim-arrow { animation: float-arrow 1.4s ease-in-out infinite; }

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

          /* Casillas ya atendidas: rayadas, porque la cola lineal no las reutiliza */
          .celda-atendida {
            background-image: repeating-linear-gradient(135deg, transparent 0, transparent 6px, rgba(148,163,184,0.14) 6px, rgba(148,163,184,0.14) 12px);
          }
        `}
      </style>

      {/* Fondo: red de nodos + destellos */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none opacity-60" />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/20 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/20 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* ENCABEZADO */}
      <header className="relative z-10 shrink-0 text-center px-10 pt-4 pb-2 space-y-1.5">
        <h1
          className="font-tech-header font-extrabold uppercase leading-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-white to-cyan-300 drop-shadow-[0_0_25px_rgba(52,211,153,0.5)]"
          style={{ fontSize: 'clamp(1.5rem, 6vh, 2.6rem)', letterSpacing: '0.08em' }}
        >
          Colas
        </h1>

        <div className="flex items-center justify-center gap-3 text-emerald-200/90">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span className="h-[1px] w-10 sm:w-24 bg-gradient-to-r from-transparent to-cyan-400" />
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
          </div>
          <span className="tracking-wide font-bold text-slate-200 uppercase text-xs sm:text-base">
            FILA DEL BANCO (FIFO)
          </span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
            <span className="h-[1px] w-10 sm:w-24 bg-gradient-to-l from-transparent to-emerald-400" />
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </div>
        </div>
      </header>

      {/* ZONA CENTRAL */}
      <main className="relative z-10 flex-1 min-h-0 w-full max-w-5xl mx-auto px-10 flex flex-col justify-center gap-4">
        {/* TARJETA: LA COLA */}
        <section className="bg-[#0f1426]/85 backdrop-blur-xl border border-emerald-500/40 rounded-2xl px-5 py-3 shadow-[0_0_35px_rgba(52,211,153,0.18)]">
          {/* Frente / Final + clientes en espera */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-2">
                <span className="font-tech-header font-bold text-sm text-rose-300 tracking-wider">Frente =</span>
                <div className="w-10 h-8 bg-[#03060d] border border-rose-500/40 rounded-lg flex items-center justify-center font-mono-tech text-sm font-black text-white shadow-[0_0_10px_rgba(244,63,94,0.25)]">
                  {indiceFrente === -1 ? '—' : indiceFrente}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-tech-header font-bold text-sm text-cyan-300 tracking-wider">Final =</span>
                <div className="w-10 h-8 bg-[#03060d] border border-cyan-500/40 rounded-lg flex items-center justify-center font-mono-tech text-sm font-black text-white shadow-[0_0_10px_rgba(34,211,238,0.25)]">
                  {indiceFinal === -1 ? '—' : indiceFinal}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-tech-header font-bold uppercase tracking-wider text-slate-300">
                En espera
              </span>
              <div className="w-24 h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all duration-500"
                  style={{ width: `${(clientesEnEspera / CAPACIDAD_COLA) * 100}%` }}
                />
              </div>
              <span className="font-mono-tech text-xs font-bold text-emerald-300">
                {clientesEnEspera}/{CAPACIDAD_COLA}
              </span>
            </div>
          </div>

          {/* Puntero FRENTE (arriba, apunta hacia abajo) */}
          <div className="relative h-9">
            <div
              className="absolute bottom-0"
              style={{
                left: `${centroCasillaEnPorcentaje(Math.max(indiceFrente, 0))}%`,
                transform: 'translateX(-50%)',
                opacity: clientesEnEspera > 0 ? 1 : 0,
                transition: 'left 0.55s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s',
              }}
            >
              <div className="flex flex-col items-center anim-arrow">
                <span className="text-[11px] font-extrabold text-rose-400 font-tech-header uppercase tracking-wider drop-shadow-[0_0_6px_#f43f5e]">
                  Frente
                </span>
                <ArrowDown className="w-4 h-4 text-rose-500 -mt-0.5" />
              </div>
            </div>
          </div>

          {/* Casillas 0..CAPACIDAD_COLA-1 */}
          <div className="flex">
            {casillasCola.map((nombre: ContenidoCasilla, indice: number) => {
              const esFrente: boolean = clientesEnEspera > 0 && indice === indiceFrente;
              const esFinal: boolean = clientesEnEspera > 0 && indice === indiceFinal;
              const yaAtendida: boolean = indiceFrente > 0 && indice < indiceFrente;
              const estaAnimada: boolean = indiceAnimado === indice;
              const nombreCorto: boolean = (nombre?.length ?? 0) <= 6;

              return (
                <div key={indice} className="px-0.5 sm:px-1" style={{ width: `${100 / CAPACIDAD_COLA}%` }}>
                  <div
                    className={`relative w-full rounded-xl border flex items-center justify-center transition-all duration-300 ${obtenerClaseCasilla(
                      esFrente,
                      esFinal,
                      yaAtendida,
                      nombre !== null
                    )} ${estaAnimada ? 'scale-110 shadow-[0_0_22px_#34d399] z-10' : ''}`}
                    style={{ height: 'clamp(2.75rem, 9vh, 4.5rem)' }}
                  >
                    <span
                      className={`block max-w-full truncate px-1 font-black font-mono-tech ${
                        esFrente
                          ? 'text-white'
                          : esFinal
                          ? 'text-cyan-200'
                          : nombre !== null
                          ? 'text-slate-100'
                          : 'text-slate-600'
                      } ${estaAnimada ? 'anim-cell-pop' : ''}`}
                      style={{
                        fontSize: nombreCorto
                          ? 'clamp(1rem, 3vh, 1.6rem)'
                          : 'clamp(0.6rem, 1.8vh, 0.85rem)',
                      }}
                    >
                      {obtenerTextoCasilla(nombre, yaAtendida)}
                    </span>

                    {/* Persona que acaba de ser atendida */}
                    {personaSaliente?.indice === indice && (
                      <span
                        className="absolute inset-0 flex items-center justify-center px-1 font-black font-mono-tech text-rose-300 anim-cell-leave pointer-events-none truncate"
                        style={{ fontSize: 'clamp(0.6rem, 1.8vh, 0.85rem)' }}
                      >
                        {personaSaliente.nombre}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Índices */}
          <div className="flex mt-1">
            {casillasCola.map((_: ContenidoCasilla, indice: number) => (
              <span
                key={indice}
                className={`text-center font-mono-tech text-[11px] sm:text-xs font-bold ${
                  clientesEnEspera > 0 && indice === indiceFrente
                    ? 'text-rose-300 font-extrabold'
                    : clientesEnEspera > 0 && indice === indiceFinal
                    ? 'text-cyan-300 font-extrabold'
                    : 'text-slate-400'
                }`}
                style={{ width: `${100 / CAPACIDAD_COLA}%` }}
              >
                {indice}
              </span>
            ))}
          </div>

          {/* Puntero FINAL (abajo, apunta hacia arriba) */}
          <div className="relative h-9">
            <div
              className="absolute top-0"
              style={{
                left: `${centroCasillaEnPorcentaje(Math.max(indiceFinal, 0))}%`,
                transform: 'translateX(-50%)',
                opacity: clientesEnEspera > 0 ? 1 : 0,
                transition: 'left 0.55s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s',
              }}
            >
              <div className="flex flex-col items-center anim-arrow">
                <ArrowUp className="w-4 h-4 text-cyan-400 -mb-0.5" />
                <span className="text-[11px] font-extrabold text-cyan-300 font-tech-header uppercase tracking-wider drop-shadow-[0_0_6px_#22d3ee]">
                  Final
                </span>
              </div>
            </div>
          </div>

          {/* Aviso: aparece cuando ya hay casillas atendidas (explica el desbordamiento con espacio libre) */}
          <div className="h-5 flex items-center justify-center">
            {indiceFrente > 0 && (
              <span className="text-[11px] font-mono-tech text-slate-400">
                ✕ Casillas atendidas: la cola lineal no las reutiliza hasta quedar vacía
              </span>
            )}
          </div>
        </section>

        {/* TARJETA: CONTROLES */}
        <section className="bg-[#0f1426]/85 backdrop-blur-xl border border-cyan-500/30 rounded-2xl px-5 py-4 shadow-[0_0_35px_rgba(34,211,238,0.12)] flex items-center gap-4">
          <label
            htmlFor="nombreCliente"
            className="font-tech-header text-base font-bold text-slate-100 tracking-wide shrink-0 whitespace-nowrap"
          >
            Nombre del cliente:
          </label>

          <div className="relative flex-1 min-w-[10rem]">
            <input
              id="nombreCliente"
              type="text"
              maxLength={LONGITUD_MAXIMA_NOMBRE}
              autoFocus
              placeholder="Ej: María, Carlos Pérez"
              value={nombreIngresado}
              onChange={manejarCambioNombre}
              onKeyDown={manejarTecla}
              disabled={estaCargando}
              className="w-full bg-[#03060d] border border-slate-500/50 focus:border-emerald-400 rounded-xl pl-4 pr-14 py-2.5 text-lg text-white placeholder:text-slate-500 focus:outline-none transition-all font-mono-tech font-bold tracking-wide disabled:opacity-50"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-mono-tech text-slate-500">
              {nombreIngresado.length}/{LONGITUD_MAXIMA_NOMBRE}
            </span>
          </div>

          <button
            type="button"
            onClick={manejarEncolar}
            onMouseEnter={playHoverSound}
            disabled={estaCargando}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[#03060d] bg-emerald-400 hover:bg-emerald-300 hover:-translate-y-0.5 active:scale-95 transition-transform duration-200 cursor-pointer shrink-0 font-tech-header text-base tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            Encolar
          </button>

          <span className="w-px h-8 bg-white/10 shrink-0" />

          <button
            type="button"
            onClick={manejarDesencolar}
            onMouseEnter={playHoverSound}
            disabled={estaCargando || clientesEnEspera === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-slate-200 bg-slate-700/50 border border-slate-500/40 hover:bg-slate-700 hover:-translate-y-0.5 active:scale-95 transition-transform duration-200 cursor-pointer shrink-0 font-tech-header text-base tracking-wider disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-5 h-5" />
            Desencolar
          </button>

          <button
            type="button"
            onClick={manejarReiniciar}
            onMouseEnter={playHoverSound}
            disabled={estaCargando}
            title="Volver al estado inicial"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-slate-300 bg-transparent border border-slate-500/40 hover:bg-white/5 hover:-translate-y-0.5 active:scale-95 transition-transform duration-200 cursor-pointer shrink-0 font-tech-header text-base tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-4 h-4" />
            Reiniciar
          </button>
        </section>
      </main>

      {/* FOOTER: estado a la izquierda, Atrás a la derecha */}
      <footer className="relative z-20 shrink-0 flex items-center justify-between gap-6 px-10 pt-2 pb-3">
        <div
          className={`inline-flex items-start gap-2 min-w-0 max-w-[calc(100%-9rem)] px-4 py-2 rounded-2xl border backdrop-blur-md text-xs leading-snug font-mono-tech transition-colors duration-300 ${ESTILOS_MENSAJE[mensajeEstado.tipo].pill}`}
        >
          <span className={`w-2 h-2 mt-1 shrink-0 rounded-full ${ESTILOS_MENSAJE[mensajeEstado.tipo].dot}`} />
          <span className="break-words">{mensajeEstado.texto}</span>
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

export default QueuePanel;