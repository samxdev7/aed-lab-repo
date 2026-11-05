import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Play, RotateCcw, Network, Check, X } from 'lucide-react';
import { useSoundEffects } from './useSoundEffects';
import { useMouseParallax } from './useMouseParallax';
import { useNotification } from './NotificationContext';
import {
  iniciarArbol,
  responderPregunta,
  confirmarHijo as apiConfirmarHijo,
  cancelarHijo as apiCancelarHijo,
  ejecutarRecorrido,
  reiniciarArbol as apiReiniciarArbol,
  type TipoRecorrido,
  type NodoArbolDTO,
  type DialogoDTO,
  type BinaryTreePanelProps,
  type ArbolesRespuestaDTO,
} from './services/arbolService';

/* ------------------------------------------------------------------ */
/*  TIPOS (contrato con el backend)                                    */
/* ------------------------------------------------------------------ */
interface PosicionNodo {
  id: number;
  valor: string;
  columna: number;
  nivel: number;
  padreId: number | null;
}

interface ColorResaltado {
  nodo: string;
  insignia: string;
}

interface MarcoLlamadaFront {
  nodoId: number;
  lado: 'izq' | 'der';
}

function obtenerTodosLosIds(nodo: NodoArbolDTO | null): number[] {
  if (!nodo) return [];
  const ids: number[] = [nodo.id];
  if (nodo.izq) ids.push(...obtenerTodosLosIds(nodo.izq));
  if (nodo.der) ids.push(...obtenerTodosLosIds(nodo.der));
  return ids;
}

/* ------------------------------------------------------------------ */
/*  CONSTANTES VISUALES                                                */
/* ------------------------------------------------------------------ */
const SEPARACION_HORIZONTAL: number = 52;
const SEPARACION_VERTICAL: number = 68;
const RADIO_NODO: number = 17;
const MARGEN_LIENZO: number = 36;
const ESCALA_RESALTADO: number = 1.14;
const REGEX_MAYUSCULA: RegExp = /^[A-Z]$/;
const TIPOS_RECORRIDO: TipoRecorrido[] = ['PreOrden', 'InOrden', 'PosOrden'];

const INFO_RECORRIDO: Record<TipoRecorrido, string> = {
  PreOrden: 'Raíz • Izq • Der',
  InOrden: 'Izq • Raíz • Der',
  PosOrden: 'Izq • Der • Raíz',
};

const PASOS_INICIO = [
  { numero: '1', titulo: 'Escribe la raíz', clase: 'text-emerald-200 border-emerald-400/40 bg-emerald-500/10', insignia: 'bg-emerald-400 text-[#03060d]' },
  { numero: '2', titulo: 'Construye con Sí / No', clase: 'text-teal-200 border-teal-400/40 bg-teal-500/10', insignia: 'bg-teal-400 text-[#03060d]' },
  { numero: '3', titulo: 'Elige un recorrido', clase: 'text-cyan-200 border-cyan-400/40 bg-cyan-500/10', insignia: 'bg-cyan-400 text-[#03060d]' },
];

/** Azul → verde → verde aqua → celeste, en ciclo según el orden de visita. */
const PALETA_RESALTADO: ColorResaltado[] = [
  { nodo: '#2563eb', insignia: '#93c5fd' },
  { nodo: '#059669', insignia: '#6ee7b7' },
  { nodo: '#0d9488', insignia: '#5eead4' },
  { nodo: '#0ea5e9', insignia: '#7dd3fc' },
];

/** Disposición visual: columna = posición inorden, por eso los nodos nunca se enciman. */
function calcularPosiciones(raiz: NodoArbolDTO | null): PosicionNodo[] {
  const posiciones: PosicionNodo[] = [];
  let contadorColumna: number = 0;

  const recorrer = (nodo: NodoArbolDTO | null, nivel: number, padreId: number | null): void => {
    if (nodo === null) return;
    recorrer(nodo.izq, nivel + 1, nodo.id);
    posiciones.push({ id: nodo.id, valor: nodo.valor, columna: contadorColumna++, nivel, padreId });
    recorrer(nodo.der, nivel + 1, nodo.id);
  };

  recorrer(raiz, 0, null);
  return posiciones;
}

/* ------------------------------------------------------------------ */
/*  COMPONENTE                                                         */
/* ------------------------------------------------------------------ */
export const BinaryTreePanel: React.FC<BinaryTreePanelProps> = ({
  onBack,
  arbol: propArbol,
  dialogo: propDialogo,
  tipoRecorrido: propTipoRecorrido,
  nodosResaltados: propNodosResaltados,
  animando: propAnimando,
  mensajeEstado: propMensajeEstado,
  onCrearArbol,
  onResponderHijo,
  onConfirmarHijo,
  onCancelarHijo,
  onRecorrido,
  onReiniciar,
}) => {
  const { playClickSound, playHoverSound } = useSoundEffects();
  const { showNotification } = useNotification();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const parallax = useMouseParallax(12);

  // Fondo dinámico de nodos/algoritmos (igual al del panel de presentación)
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

  const [arbolState, setArbolState] = useState<NodoArbolDTO | null>(null);
  const [dialogoState, setDialogoState] = useState<DialogoDTO | null>(null);
  const [tipoRecorridoState, setTipoRecorridoState] = useState<TipoRecorrido | null>(null);
  const [nodosResaltadosState, setNodosResaltadosState] = useState<number[]>([]);
  const [animandoState, setAnimandoState] = useState<boolean>(false);
  const [mensajeEstadoState, setMensajeEstadoState] = useState<string | undefined>(undefined);

  const arbol: NodoArbolDTO | null = propArbol !== undefined ? propArbol : arbolState;
  const dialogo: DialogoDTO | null = propDialogo !== undefined ? propDialogo : dialogoState;
  const tipoRecorrido: TipoRecorrido | null = propTipoRecorrido !== undefined ? propTipoRecorrido : tipoRecorridoState;
  const nodosResaltados: number[] = propNodosResaltados !== undefined ? propNodosResaltados : nodosResaltadosState;
  const animando: boolean = propAnimando !== undefined ? propAnimando : animandoState;
  const mensajeEstado: string | undefined = propMensajeEstado !== undefined ? propMensajeEstado : mensajeEstadoState;

  const [letraRaiz, setLetraRaiz] = useState<string>('');
  const [letraDialogo, setLetraDialogo] = useState<string>('');
  const [confirmandoReiniciar, setConfirmandoReiniciar] = useState<boolean>(false);
  const [padreActivoId, setPadreActivoId] = useState<number | null>(null);
  const [pilaLlamadas, setPilaLlamadas] = useState<MarcoLlamadaFront[]>([]);

  const bloqueado: boolean = dialogo !== null || animando;

  const posiciones: PosicionNodo[] = useMemo(() => calcularPosiciones(arbol), [arbol]);
  const posicionPorId: Map<number, PosicionNodo> = useMemo(
    () => new Map<number, PosicionNodo>(posiciones.map((p: PosicionNodo): [number, PosicionNodo] => [p.id, p])),
    [posiciones]
  );
  const ordenPorId: Map<number, number> = useMemo(
    () => new Map<number, number>(nodosResaltados.map((id: number, i: number): [number, number] => [id, i + 1])),
    [nodosResaltados]
  );

  const idActivoEfectivo: number | null = useMemo(() => {
    if (dialogo === null) return null;
    if (padreActivoId !== null) {
      const pos = posicionPorId.get(padreActivoId);
      if (pos && pos.valor === dialogo.valorPadre) {
        return padreActivoId;
      }
    }
    if (pilaLlamadas.length > 0) {
      const tope = pilaLlamadas[pilaLlamadas.length - 1];
      const posTope = posicionPorId.get(tope.nodoId);
      if (posTope && posTope.valor === dialogo.valorPadre) {
        return tope.nodoId;
      }
    }
    // Fallback de respaldo en caso de desincronización
    const candidatos = posiciones.filter((p) => p.valor === dialogo.valorPadre);
    if (candidatos.length > 0) {
      return candidatos[candidatos.length - 1].id;
    }
    return null;
  }, [dialogo, padreActivoId, pilaLlamadas, posicionPorId, posiciones]);

  const posicionPadreActivo = idActivoEfectivo !== null ? posicionPorId.get(idActivoEfectivo) : undefined;

  const aplicarRespuesta = (res: ArbolesRespuestaDTO) => {
    setArbolState(res.arbol);
    setDialogoState(res.dialogo);
    if (res.tipoRecorrido) setTipoRecorridoState(res.tipoRecorrido);
    if (res.mensajeEstado) setMensajeEstadoState(res.mensajeEstado);
  };

  const animarRecorrido = (ids: number[]) => {
    setAnimandoState(true);
    setNodosResaltadosState([]);
    let step = 0;
    const interval = setInterval(() => {
      if (step < ids.length) {
        setNodosResaltadosState(ids.slice(0, step + 1));
        playClickSound();
        step++;
      } else {
        clearInterval(interval);
        setAnimandoState(false);
      }
    }, 550);
  };

  /* ---------- Entrada: solo letras A-Z mayúsculas ---------- */
  const filtrarEntrada = (texto: string, aplicar: (valor: string) => void): void => {
    const mayuscula = texto.toUpperCase();
    if (mayuscula === '' || REGEX_MAYUSCULA.test(mayuscula)) {
      aplicar(mayuscula);
    } else {
      showNotification('warning', 'Carácter no permitido', 'Solo se aceptan letras mayúsculas (A-Z).');
    }
  };

  const crearArbol = async (): Promise<void> => {
    if (!REGEX_MAYUSCULA.test(letraRaiz)) {
      showNotification('error', 'Raíz inválida', 'Ingrese una letra mayúscula (A-Z).');
      return;
    }
    playClickSound();
    if (onCrearArbol) {
      onCrearArbol(letraRaiz);
      return;
    }
    try {
      const res = await iniciarArbol(letraRaiz);
      aplicarRespuesta(res);
      setNodosResaltadosState([]);
      setTipoRecorridoState(null);
      setLetraRaiz('');
      if (res.arbol) {
        setPadreActivoId(res.arbol.id);
        setPilaLlamadas([{ nodoId: res.arbol.id, lado: 'izq' }]);
      }
      showNotification('success', 'Árbol iniciado', res.mensajeEstado);
    } catch (err: any) {
      showNotification('error', 'Error al iniciar árbol', err.message || 'Error del servidor');
    }
  };

  const actualizarPilaAlResponderNo = (res: ArbolesRespuestaDTO) => {
    if (res.dialogo === null) {
      setPadreActivoId(null);
      setPilaLlamadas([]);
      return;
    }
    setPilaLlamadas((prev) => {
      const copia = prev.map((m) => ({ ...m }));
      if (copia.length === 0) return copia;
      const tope = copia[copia.length - 1];
      if (tope.lado === 'izq') {
        tope.lado = 'der';
        setPadreActivoId(tope.nodoId);
        return copia;
      } else {
        while (copia.length > 0 && copia[copia.length - 1].lado === 'der') {
          copia.pop();
        }
        if (copia.length > 0) {
          const nuevoTope = copia[copia.length - 1];
          nuevoTope.lado = 'der';
          setPadreActivoId(nuevoTope.nodoId);
        }
        return copia;
      }
    });
  };

  const handleResponderHijo = async (tieneHijo: boolean): Promise<void> => {
    playClickSound();
    if (onResponderHijo) {
      onResponderHijo(tieneHijo);
      return;
    }
    try {
      const res = await responderPregunta(tieneHijo);
      aplicarRespuesta(res);
      if (!tieneHijo) {
        actualizarPilaAlResponderNo(res);
      }
    } catch (err: any) {
      showNotification('error', 'Error', err.message || 'Error del servidor');
    }
  };

  const confirmarHijo = async (): Promise<void> => {
    if (!REGEX_MAYUSCULA.test(letraDialogo)) {
      showNotification('error', 'Nodo inválido', 'Ingrese una letra mayúscula (A-Z).');
      return;
    }
    playClickSound();
    if (onConfirmarHijo) {
      onConfirmarHijo(letraDialogo);
      setLetraDialogo('');
      return;
    }
    try {
      const idsPrevios = new Set(obtenerTodosLosIds(arbol));
      const res = await apiConfirmarHijo(letraDialogo);
      aplicarRespuesta(res);
      setLetraDialogo('');
      const idsNuevos = obtenerTodosLosIds(res.arbol);
      const nuevoId = idsNuevos.find((id) => !idsPrevios.has(id)) ?? (idsNuevos.length > 0 ? Math.max(...idsNuevos) : null);
      if (nuevoId !== null) {
        setPadreActivoId(nuevoId);
        setPilaLlamadas((prev) => [...prev, { nodoId: nuevoId, lado: 'izq' }]);
      }
      showNotification('success', 'Nodo insertado', res.mensajeEstado);
    } catch (err: any) {
      showNotification('error', 'Error', err.message || 'Error del servidor');
    }
  };

  const handleCancelarHijo = async (): Promise<void> => {
    playClickSound();
    setLetraDialogo('');
    if (onCancelarHijo) {
      onCancelarHijo();
      return;
    }
    try {
      const res = await apiCancelarHijo();
      aplicarRespuesta(res);
      actualizarPilaAlResponderNo(res);
    } catch (err: any) {
      showNotification('error', 'Error', err.message || 'Error del servidor');
    }
  };

  const handleRecorrido = async (tipo: TipoRecorrido): Promise<void> => {
    playClickSound();
    if (onRecorrido) {
      onRecorrido(tipo);
      return;
    }
    try {
      setTipoRecorridoState(tipo);
      const res = await ejecutarRecorrido(tipo);
      aplicarRespuesta(res);
      if (res.nodosResaltados && res.nodosResaltados.length > 0) {
        animarRecorrido(res.nodosResaltados);
      }
    } catch (err: any) {
      showNotification('error', 'Error de recorrido', err.message || 'Error del servidor');
    }
  };

  const reiniciar = async (): Promise<void> => {
    playClickSound();
    setLetraRaiz('');
    setLetraDialogo('');
    setConfirmandoReiniciar(false);
    setPadreActivoId(null);
    setPilaLlamadas([]);
    if (onReiniciar) {
      onReiniciar();
      return;
    }
    try {
      const res = await apiReiniciarArbol();
      aplicarRespuesta(res);
      setNodosResaltadosState([]);
      setTipoRecorridoState(null);
      showNotification('info', 'Árbol reiniciado', res.mensajeEstado);
    } catch (err: any) {
      showNotification('error', 'Error al reiniciar', err.message || 'Error del servidor');
    }
  };

  /* ---------- Medidas del lienzo ---------- */
  const maxColumna: number = posiciones.reduce((m: number, p: PosicionNodo) => Math.max(m, p.columna), 0);
  const maxNivel: number = posiciones.reduce((m: number, p: PosicionNodo) => Math.max(m, p.nivel), 0);
  const anchoLienzo: number = Math.max(maxColumna * SEPARACION_HORIZONTAL + MARGEN_LIENZO * 2 + 80, 360);
  const altoLienzo: number = Math.max((maxNivel + (dialogo !== null ? 1.4 : 0)) * SEPARACION_VERTICAL + MARGEN_LIENZO * 2 + 50, 260);
  const coordX = (p: PosicionNodo): number => MARGEN_LIENZO + p.columna * SEPARACION_HORIZONTAL + 40;
  const coordY = (p: PosicionNodo): number => MARGEN_LIENZO + p.nivel * SEPARACION_VERTICAL + 20;

  const textoRecorrido: string | null =
    tipoRecorrido && nodosResaltados.length > 0
      ? `${tipoRecorrido}: ${nodosResaltados.map((id: number) => posicionPorId.get(id)?.valor ?? '').join(', ')}`
      : null;
  const textoEstado: string =
    mensajeEstado ?? textoRecorrido ?? (arbol ? 'Árbol listo • Seleccione un recorrido' : 'Ingrese la letra raíz (A-Z) para comenzar');

  return (
    <div className="fixed inset-0 h-dvh w-full bg-[#090b16] text-white flex flex-col items-center overflow-hidden select-none font-tech-body">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Fira+Code:wght@500;600;700&display=swap');      
          html, body { overflow: hidden; }
          .font-tech-header { font-family: 'Rajdhani', sans-serif; letter-spacing: 0.06em; }
          .font-tech-body { font-family: 'Plus Jakarta Sans', sans-serif; }
          .font-mono-tech { font-family: 'Fira Code', monospace; }
          .lienzo-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
          .lienzo-scroll::-webkit-scrollbar-track { background: rgba(3, 6, 13, 0.6); }
          .lienzo-scroll::-webkit-scrollbar-thumb { background: rgba(52, 211, 153, 0.3); border-radius: 4px; }
          .lienzo-scroll::-webkit-scrollbar-thumb:hover { background: rgba(52, 211, 153, 0.6); }
          @keyframes flotar { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
          @keyframes pulso-anillo { 0% { transform: scale(0.9); opacity: 0.6; } 100% { transform: scale(1.8); opacity: 0; } }
          @keyframes brillo-barrido { 0% { transform: translateX(-120%); } 100% { transform: translateX(320%); } }
          @keyframes nodo-fantasma { 0%, 100% { opacity: 0.25; } 50% { opacity: 0.85; } }
          .anim-flotar { animation: flotar 3.5s ease-in-out infinite; }
          .anim-anillo { animation: pulso-anillo 2.2s ease-out infinite; }
          .nodo-fantasma { animation: nodo-fantasma 3s ease-in-out infinite; }
          .fondo-puntos { background-image: radial-gradient(rgba(52, 211, 153, 0.14) 1px, transparent 1px); background-size: 22px 22px; }
          .boton-brillo { position: relative; overflow: hidden; }
          .boton-brillo::after { content: ''; position: absolute; top: 0; bottom: 0; left: 0; width: 35%; background: linear-gradient(100deg, transparent, rgba(255,255,255,0.28), transparent); transform: translateX(-120%); pointer-events: none; }
          .boton-brillo:enabled:hover::after { animation: brillo-barrido 0.9s ease; }
        `}
      </style>

            {/* Canvas para fondo de red de algoritmos */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none opacity-60" />

      {/* Destellos ambientales neón con parallax */}
      <div
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-indigo-600/15 rounded-full blur-[160px] pointer-events-none z-0"
        style={{ transform: `translate3d(${parallax.x * 0.5}px, ${parallax.y * 0.5}px, 0)` }}
      />
      <div
        className="absolute -bottom-28 -left-28 w-[500px] h-[500px] bg-purple-700/20 rounded-full blur-[150px] pointer-events-none z-0"
        style={{ transform: `translate3d(${parallax.x * 0.8}px, ${parallax.y * 0.8}px, 0)` }}
      />
      <div
        className="absolute -bottom-28 -right-28 w-[500px] h-[500px] bg-cyan-600/20 rounded-full blur-[150px] pointer-events-none z-0"
        style={{ transform: `translate3d(${parallax.x * -0.6}px, ${parallax.y * -0.6}px, 0)` }}
      />

      {/* Grid de puntos estilizados */}
      <div
        className="absolute top-12 left-10 w-32 h-32 opacity-15 pointer-events-none hidden lg:block transition-transform duration-75 z-0"
        style={{
          backgroundImage: `radial-gradient(#ffffff 2px, transparent 2px)`,
          backgroundSize: '14px 14px',
          transform: `translate3d(${parallax.x * -1}px, ${parallax.y * -1}px, 0)`,
        }}
      />
      <div
        className="absolute top-12 right-10 w-32 h-32 opacity-15 pointer-events-none hidden lg:block transition-transform duration-75 z-0"
        style={{
          backgroundImage: `radial-gradient(#ffffff 2px, transparent 2px)`,
          backgroundSize: '14px 14px',
          transform: `translate3d(${parallax.x}px, ${parallax.y}px, 0)`,
        }}
      />

      {/* ENCABEZADO */}
      <header
        className="relative z-10 shrink-0 w-full text-center pt-3 pb-1 space-y-1 transition-transform duration-75"
        style={{ transform: `translate3d(${parallax.x * 0.3}px, ${parallax.y * 0.3}px, 0)` }}
      >
        <
        >
        </>
        <div className="flex items-center justify-center gap-2">
          <span className="h-px w-12 sm:w-20 bg-gradient-to-r from-transparent to-emerald-400/70" />
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 shadow-[0_0_8px_#34d399]" />
          <span className="font-tech-body tracking-wide font-bold text-slate-200 uppercase text-xs sm:text-sm">
            Construcción Gráfica Paso a Paso
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#22d3ee]" />
          <span className="h-px w-12 sm:w-20 bg-gradient-to-l from-transparent to-cyan-400/70" />
        </div>
      </header>

      {/* DOS MINI-MENÚS SEPARADOS Y ESTILIZADOS */}
      <section className="relative z-10 shrink-0 w-full max-w-4xl px-4 grid grid-cols-1 md:grid-cols-2 gap-3 py-1">
        
        {/* MINI-MENÚ 1: CREACIÓN, CONTROL Y PASO A PASO */}
        <div
          className={`bg-[#0f1426]/85 backdrop-blur-xl rounded-2xl p-3 flex flex-col justify-between gap-2 transition-all ${
            dialogo !== null
              ? 'border-2 border-emerald-400/80 shadow-[0_0_30px_rgba(52,211,153,0.3)]'
              : 'border border-emerald-500/35 hover:border-emerald-400/60 shadow-[0_0_25px_rgba(16,185,129,0.12)]'
          }`}
        >
          {/* CASO A: DURANTE LA CREACIÓN PASO A PASO (PREGUNTA O INGRESO) */}
          {dialogo !== null ? (
            <>
              <div className="flex items-center justify-between border-b border-emerald-500/20 pb-1 gap-2">
                <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                  <span className="text-xs font-tech-header font-extrabold uppercase tracking-wider text-emerald-300">
                    Paso a Paso • Padre:
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-cyan-950/90 border border-cyan-400/60 shadow-[0_0_12px_rgba(56,189,248,0.4)]">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#38bdf8] anim-anillo" />
                    <strong className="text-cyan-200 font-mono-tech text-sm font-bold">{dialogo.valorPadre}</strong>
                    {posicionPadreActivo && (
                      <span className="text-[10px] font-mono-tech text-cyan-300/90 border-l border-cyan-500/40 pl-1.5">
                        Nivel {posicionPadreActivo.nivel}
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] text-cyan-300/80 font-mono-tech hidden sm:inline">
                    (Padre resaltado en azul)
                  </span>
                </div>
                <span className="text-[10px] font-mono-tech font-bold uppercase px-2 py-0.5 rounded-md border bg-amber-500/15 border-amber-400/40 text-amber-300 shrink-0">
                  En Proceso
                </span>
              </div>

              {confirmandoReiniciar ? (
                <div className="flex items-center justify-between gap-2.5 px-3 h-9 rounded-xl bg-rose-950/40 border border-rose-500/50">
                  <span className="text-xs font-tech-header font-bold text-rose-200 min-w-0 truncate">
                    ¿Reiniciar? Se perderá el avance
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={(): void => {
                        setConfirmandoReiniciar(false);
                        void reiniciar();
                      }}
                      onMouseEnter={playHoverSound}
                      className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-tech-header text-xs font-bold shadow-[0_0_10px_rgba(244,63,94,0.4)] cursor-pointer active:scale-95 transition-all whitespace-nowrap"
                    >
                      Sí, reiniciar
                    </button>
                    <button
                      onClick={(): void => {
                        playHoverSound();
                        setConfirmandoReiniciar(false);
                      }}
                      onMouseEnter={playHoverSound}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-tech-header text-xs font-bold cursor-pointer active:scale-95 transition-all whitespace-nowrap"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : dialogo.fase === 'pregunta' ? (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-slate-100 text-xs sm:text-sm font-medium">
                    ¿Tiene hijo por la <strong className="text-emerald-300 font-tech-header uppercase text-sm font-bold">{dialogo.lado === 'izq' ? 'izquierda' : 'derecha'}</strong>?
                  </p>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(): void => {
                        setConfirmandoReiniciar(false);
                        void handleResponderHijo(true);
                      }}
                      onMouseEnter={playHoverSound}
                      className="h-9 px-3.5 rounded-xl font-tech-header font-bold text-xs tracking-wider inline-flex items-center justify-center gap-1 text-white bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-400 hover:to-indigo-400 shadow-[0_0_12px_rgba(139,92,246,0.4)] active:scale-95 transition-all cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Sí</span>
                    </button>
                    <button
                      onClick={(): void => {
                        setConfirmandoReiniciar(false);
                        void handleResponderHijo(false);
                      }}
                      onMouseEnter={playHoverSound}
                      className="h-9 px-3.5 rounded-xl font-tech-header font-bold text-xs tracking-wider inline-flex items-center justify-center gap-1 text-slate-200 bg-[#121933] hover:bg-[#1a2347] border border-slate-600/50 hover:border-slate-400 active:scale-95 transition-all cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>No</span>
                    </button>
                    <button
                      onClick={(): void => {
                        playHoverSound();
                        setConfirmandoReiniciar(true);
                      }}
                      onMouseEnter={playHoverSound}
                      title="Reiniciar árbol"
                      className="h-9 px-2.5 rounded-xl font-tech-header font-bold text-xs text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/35 hover:border-rose-400 active:scale-95 transition-all cursor-pointer shrink-0"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-slate-100 text-xs sm:text-sm font-medium">
                    Hijo <strong className="text-emerald-300 font-tech-header uppercase text-sm font-bold">{dialogo.lado === 'izq' ? 'izquierdo' : 'derecho'}</strong>:
                  </p>
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      autoFocus
                      type="text"
                      value={letraDialogo}
                      maxLength={1}
                      placeholder="A-Z"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>): void => filtrarEntrada(e.target.value, setLetraDialogo)}
                      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>): void => {
                        if (e.key === 'Enter') {
                          void confirmarHijo();
                        }
                      }}
                      className="w-14 h-9 rounded-xl bg-[#03060d] border-2 border-emerald-400/70 focus:border-cyan-300 text-emerald-100 font-mono-tech text-base font-bold text-center placeholder:text-slate-600 focus:outline-none focus:shadow-[0_0_15px_rgba(52,211,153,0.45)] transition-all"
                    />
                    <button
                      onClick={(): void => {
                        void confirmarHijo();
                      }}
                      onMouseEnter={playHoverSound}
                      className="h-9 px-3 rounded-xl font-tech-header font-bold text-xs tracking-wider inline-flex items-center justify-center gap-1 text-white bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-400 hover:to-indigo-400 shadow-[0_0_12px_rgba(139,92,246,0.4)] active:scale-95 transition-all cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Aceptar</span>
                    </button>
                    <button
                      onClick={(): void => {
                        void handleCancelarHijo();
                      }}
                      onMouseEnter={playHoverSound}
                      className="h-9 px-3 rounded-xl font-tech-header font-bold text-xs tracking-wider inline-flex items-center justify-center gap-1 text-slate-200 bg-[#121933] hover:bg-[#1a2347] border border-slate-600/50 hover:border-slate-400 active:scale-95 transition-all cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Cancelar</span>
                    </button>
                    <button
                      onClick={(): void => {
                        playHoverSound();
                        setConfirmandoReiniciar(true);
                      }}
                      onMouseEnter={playHoverSound}
                      title="Reiniciar árbol"
                      className="h-9 px-2.5 rounded-xl font-tech-header font-bold text-xs text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/35 hover:border-rose-400 active:scale-95 transition-all cursor-pointer shrink-0"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* CASO B: ESTADO NORMAL (INICIAL O YA CONSTRUIDO) */
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs font-tech-header font-extrabold uppercase tracking-wider text-emerald-300">
                  {arbol !== null ? '1. Árbol Construido' : '1. Nodo Raíz y Control'}
                </span>
                <span
                  className={`text-[10px] font-mono-tech font-bold uppercase px-2 py-0.5 rounded-md border ${
                    arbol !== null
                      ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400'
                  }`}
                >
                  {arbol !== null ? 'Completado' : 'Sin Raíz'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {arbol === null ? (
                  <>
                    {/* Input Raíz */}
                    <div className="relative flex-1 min-w-[7rem]">
                      <input
                        type="text"
                        value={letraRaiz}
                        maxLength={1}
                        disabled={bloqueado}
                        placeholder="Raíz (A-Z)"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>): void => filtrarEntrada(e.target.value, setLetraRaiz)}
                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>): void => {
                          if (e.key === 'Enter' && !bloqueado) {
                            void crearArbol();
                          }
                        }}
                        className="w-full h-10 rounded-xl px-3 text-center bg-[#03060d] border border-emerald-500/40 text-white font-mono-tech text-base font-bold placeholder:text-slate-500 placeholder:text-xs placeholder:font-normal focus:outline-none focus:border-emerald-300 focus:shadow-[0_0_15px_rgba(52,211,153,0.35)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      />
                    </div>

                    {/* Botón Crear Árbol */}
                    <button
                      onClick={(): void => {
                        void crearArbol();
                      }}
                      onMouseEnter={playHoverSound}
                      disabled={bloqueado}
                      className="h-10 px-4 rounded-xl font-tech-header font-bold tracking-wider text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 text-white bg-gradient-to-r from-violet-500 via-violet-500 to-indigo-500 hover:from-violet-400 hover:to-indigo-400 shadow-[0_0_15px_rgba(139,92,246,0.4)] hover:shadow-[0_0_22px_rgba(139,92,246,0.6)] active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed shrink-0"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Crear árbol</span>
                    </button>
                  </>
                ) : confirmandoReiniciar ? (
                  <div className="flex-1 flex items-center justify-between gap-2.5 px-3 h-10 rounded-xl bg-rose-950/40 border border-rose-500/50">
                    <span className="text-xs font-tech-header font-bold text-rose-200 min-w-0 truncate">¿Reiniciar árbol?</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={(): void => {
                          setConfirmandoReiniciar(false);
                          void reiniciar();
                        }}
                        onMouseEnter={playHoverSound}
                        className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-tech-header text-xs font-bold shadow-[0_0_10px_rgba(244,63,94,0.4)] cursor-pointer active:scale-95 transition-all whitespace-nowrap"
                      >
                        Sí, reiniciar
                      </button>
                      <button
                        onClick={(): void => {
                          playHoverSound();
                          setConfirmandoReiniciar(false);
                        }}
                        onMouseEnter={playHoverSound}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-tech-header text-xs font-bold cursor-pointer active:scale-95 transition-all whitespace-nowrap"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                                        <div className="relative flex-1 min-w-0 flex items-center gap-2.5 px-3 h-11 rounded-xl bg-gradient-to-r from-emerald-500/15 via-emerald-500/5 to-transparent border border-emerald-400/40 overflow-hidden">
                      <span className="relative flex w-5 h-5 items-center justify-center shrink-0">
                        <span className="absolute inset-0 rounded-full bg-emerald-400/40 anim-anillo" />
                        <span className="relative w-5 h-5 rounded-full bg-emerald-400 flex items-center justify-center shadow-[0_0_10px_rgba(52,211,153,0.7)]">
                          <Check className="w-3 h-3 text-[#03060d] stroke-[3.5]" />
                        </span>
                      </span>
                      <div className="flex flex-col leading-tight min-w-0">
                        <span className="text-emerald-200 font-tech-header font-extrabold text-xs uppercase tracking-wider truncate">
                          Árbol completo
                        </span>
                        <span className="text-slate-400 font-mono-tech text-[10px] truncate">
                          {posiciones.length} {posiciones.length === 1 ? 'nodo' : 'nodos'} • listo para recorrer
                        </span>
                      </div>
                    </div>

                    {/* Botón Reiniciar */}
                    <button
                      onClick={(): void => {
                        playHoverSound();
                        setConfirmandoReiniciar(true);
                      }}
                      onMouseEnter={playHoverSound}
                      title="Reinicia el árbol al estado inicial"
                      className="boton-brillo group h-11 px-3.5 rounded-xl font-tech-header font-bold tracking-wider text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 text-rose-200 bg-gradient-to-br from-rose-500/20 to-rose-700/10 border border-rose-400/40 hover:border-rose-300 hover:shadow-[0_0_18px_rgba(244,63,94,0.4)] active:scale-95 transition-all duration-200 cursor-pointer shrink-0"
                    >
                      <RotateCcw className="w-3.5 h-3.5 transition-transform duration-500 group-hover:-rotate-180" />
                      <span className="hidden sm:inline">Reiniciar</span>
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* MINI-MENÚ 2: RECORRIDOS ALGORÍTMICOS */}
        <div className="bg-[#0f1426]/85 backdrop-blur-xl border border-cyan-500/35 hover:border-cyan-400/60 rounded-2xl p-3 shadow-[0_0_25px_rgba(34,211,238,0.12)] flex flex-col justify-between gap-2 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-tech-header font-extrabold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
              <Network className="w-3.5 h-3.5 text-cyan-400" />
              2. Recorridos
            </span>
            <span
              className={`text-[10px] font-mono-tech font-bold uppercase px-2 py-0.5 rounded-md border ${
                tipoRecorrido !== null
                  ? 'bg-cyan-500/15 border-cyan-400/40 text-cyan-200'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400'
              }`}
            >
              {tipoRecorrido ?? (arbol !== null && !bloqueado ? 'Disponible' : 'En Espera')}
            </span>
          </div>

                    <div className="grid grid-cols-3 gap-2">
            {TIPOS_RECORRIDO.map((tipo: TipoRecorrido, indice: number) => {
              const estaActivo = tipoRecorrido === tipo;
              return (
                <button
                  key={tipo}
                  onClick={(): void => {
                    void handleRecorrido(tipo);
                  }}
                  onMouseEnter={playHoverSound}
                  disabled={arbol === null || bloqueado}
                  className={`boton-brillo group h-11 px-2 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all duration-200 ${
                    estaActivo
                      ? 'bg-gradient-to-b from-cyan-400/30 to-cyan-600/15 border border-cyan-300 text-cyan-50 shadow-[0_0_18px_rgba(34,211,238,0.45)]'
                      : 'bg-gradient-to-b from-[#0a1224] to-[#03060d] border border-cyan-500/30 text-cyan-200/90 enabled:hover:border-cyan-300 enabled:hover:shadow-[0_0_14px_rgba(34,211,238,0.3)] enabled:hover:-translate-y-0.5'
                  } disabled:opacity-30 disabled:cursor-not-allowed enabled:cursor-pointer enabled:active:scale-95`}
                >
                  <span className="flex items-center gap-1.5 font-tech-header font-bold text-xs sm:text-sm tracking-wider leading-none">
                    <span
                      className={`w-4 h-4 rounded-md text-[9px] font-mono-tech font-bold flex items-center justify-center ${
                        estaActivo ? 'bg-cyan-300 text-[#03060d]' : 'bg-cyan-500/15 text-cyan-300'
                      }`}
                    >
                      {indice + 1}
                    </span>
                    {tipo}
                  </span>
                  <span
                    className={`font-mono-tech text-[9px] leading-none hidden sm:block ${
                      estaActivo ? 'text-cyan-100/90' : 'text-slate-500 group-enabled:group-hover:text-cyan-200/80'
                    }`}
                  >
                    {INFO_RECORRIDO[tipo]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* PANTALLA PRINCIPAL: LIENZO 100% LIBRE (SIN MENSAJES QUE TAPEN EL ÁRBOL) */}
      <main className="relative z-10 flex-1 min-h-0 w-full max-w-5xl px-4 py-2 flex flex-col items-center">
                <div className="lienzo-scroll fondo-puntos relative w-full h-full flex overflow-auto rounded-2xl bg-[#070b16]/90 backdrop-blur-md border border-emerald-400/25 shadow-[0_0_40px_rgba(16,185,129,0.12)]">
          {arbol === null ? (
                        <div className="m-auto flex flex-col items-center text-center px-6 py-6 gap-3">
              {/* Árbol fantasma decorativo */}
              <div className="relative anim-flotar">
                <div className="absolute inset-0 -m-6 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
                <svg width="230" height="112" viewBox="0 0 230 112" className="relative">
                  <g stroke="rgba(110,231,183,0.35)" strokeWidth="1.6" strokeDasharray="4 4" fill="none">
                    <line x1="115" y1="18" x2="68" y2="56" />
                    <line x1="115" y1="18" x2="162" y2="56" />
                    <line x1="68" y1="56" x2="40" y2="92" />
                    <line x1="68" y1="56" x2="96" y2="92" />
                    <line x1="162" y1="56" x2="190" y2="92" />
                  </g>
                  {[
                    { x: 115, y: 18, l: 'A', d: '0s', raiz: true },
                    { x: 68, y: 56, l: 'B', d: '0.4s', raiz: false },
                    { x: 162, y: 56, l: 'C', d: '0.8s', raiz: false },
                    { x: 40, y: 92, l: 'D', d: '1.2s', raiz: false },
                    { x: 96, y: 92, l: 'E', d: '1.6s', raiz: false },
                    { x: 190, y: 92, l: 'F', d: '2s', raiz: false },
                  ].map((n) => (
                    <g key={n.l} className="nodo-fantasma" style={{ animationDelay: n.d }}>
                      <circle
                        cx={n.x}
                        cy={n.y}
                        r={13}
                        fill={n.raiz ? '#0d4a3f' : '#0b2f2a'}
                        stroke={n.raiz ? '#6ee7b7' : '#34d399'}
                        strokeWidth={1.5}
                        strokeDasharray={n.raiz ? undefined : '3 3'}
                      />
                      <text x={n.x} y={n.y} textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600} fill="#a7f3d0" className="font-tech-header">
                        {n.l}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>

              <div>
                <p className="text-slate-100 font-tech-header font-extrabold text-base sm:text-lg tracking-widest uppercase">
                  Lienzo de Árbol Binario 
                </p>
                <p className="text-slate-400 text-xs sm:text-sm max-w-sm mt-1">
                  Ingrese la letra raíz (A-Z) en el panel superior y haga clic en <strong className="text-emerald-300">Crear árbol</strong> para observar la construcción paso a paso.
                </p>
              </div>

              {/* Mini guía de 3 pasos */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
                {PASOS_INICIO.map((paso) => (
                  <div
                    key={paso.numero}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-tech-header font-bold tracking-wide ${paso.clase}`}
                  >
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-mono-tech font-bold ${paso.insignia}`}>
                      {paso.numero}
                    </span>
                    {paso.titulo}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <svg
              width={anchoLienzo}
              height={altoLienzo}
              viewBox={`0 0 ${anchoLienzo} ${altoLienzo}`}
              className="m-auto shrink-0"
            >
              {/* Aristas */}
              {posiciones.map((p: PosicionNodo) => {
                const padre: PosicionNodo | undefined = p.padreId !== null ? posicionPorId.get(p.padreId) : undefined;
                if (!padre) return null;
                return (
                  <line
                    key={`arista-${p.id}`}
                    x1={coordX(padre)}
                    y1={coordY(padre)}
                    x2={coordX(p)}
                    y2={coordY(p)}
                    stroke="rgba(110, 231, 183, 0.45)"
                    strokeWidth={1.8}
                  />
                );
              })}

              {/* Nodos */}
              {posiciones.map((p: PosicionNodo) => {
                const orden: number | undefined = ordenPorId.get(p.id);
                const resaltado: boolean = orden !== undefined;
                const esPadreActivo: boolean = p.id === idActivoEfectivo;
                const color: ColorResaltado | null = orden !== undefined
                  ? PALETA_RESALTADO[(orden - 1) % PALETA_RESALTADO.length]
                  : null;
                const cx: number = coordX(p);
                const cy: number = coordY(p);

                return (
                  <g
                    key={`nodo-${p.id}`}
                    style={{
                      transformOrigin: `${cx}px ${cy}px`,
                      transform: `scale(${resaltado ? ESCALA_RESALTADO : esPadreActivo ? 1.15 : 1})`,
                      transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease',
                      opacity: dialogo !== null && !esPadreActivo ? 0.68 : 1,
                    }}
                  >
                    {/* Anillos de enfoque y pulso si es el padre activo */}
                    {esPadreActivo && (
                      <>
                        {/* Pulso exterior animado */}
                        <circle
                          cx={cx}
                          cy={cy}
                          r={RADIO_NODO + 8}
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth={2}
                          strokeDasharray="4 3"
                          className="anim-anillo pointer-events-none"
                          style={{ transformOrigin: `${cx}px ${cy}px` }}
                        />
                        {/* Anillo de resplandor fijo */}
                        <circle
                          cx={cx}
                          cy={cy}
                          r={RADIO_NODO + 4}
                          fill="none"
                          stroke="#0284c7"
                          strokeWidth={1.6}
                          opacity={0.85}
                        />
                      </>
                    )}

                    <circle
                      cx={cx}
                      cy={cy}
                      r={RADIO_NODO}
                      strokeWidth={esPadreActivo ? 2.6 : 1.5}
                      style={{
                        fill: esPadreActivo ? '#082f49' : (color ? color.nodo : '#0b2f2a'),
                        stroke: esPadreActivo ? '#38bdf8' : (color ? color.insignia : '#34d399'),
                        filter: esPadreActivo
                          ? 'drop-shadow(0 0 14px rgba(56, 189, 248, 0.95))'
                          : color
                          ? `drop-shadow(0 0 7px ${color.nodo})`
                          : 'drop-shadow(0 0 5px rgba(52,211,153,0.4))',
                        transition: 'fill 0.45s ease, stroke 0.45s ease, filter 0.45s ease',
                      }}
                    />
                    <text
                      x={cx}
                      y={cy}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={esPadreActivo ? 16 : 15}
                      fontWeight={esPadreActivo ? 800 : 600}
                      fill="#ffffff"
                      className="font-tech-header"
                    >
                      {p.valor}
                    </text>

                    {/* Insignia flotante PADRE ACTUAL */}
                    {esPadreActivo && (
                      <g className="pointer-events-none anim-flotar" style={{ transformOrigin: `${cx}px ${cy - RADIO_NODO - 14}px` }}>
                        <rect
                          x={cx - 38}
                          y={cy - RADIO_NODO - 24}
                          width={76}
                          height={16}
                          rx={8}
                          fill="#0369a1"
                          stroke="#38bdf8"
                          strokeWidth={1.2}
                          filter="drop-shadow(0 0 8px rgba(56,189,248,0.75))"
                        />
                        <text
                          x={cx}
                          y={cy - RADIO_NODO - 15}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize={9}
                          fontWeight={800}
                          fill="#f0f9ff"
                          className="font-tech-header tracking-wider"
                        >
                        PADRE ACTUAL
                        </text>
                        <polygon
                          points={`${cx - 3},${cy - RADIO_NODO - 8} ${cx + 3},${cy - RADIO_NODO - 8} ${cx},${cy - RADIO_NODO - 4}`}
                          fill="#38bdf8"
                        />
                      </g>
                    )}

                    {/* Guía direccional del hijo solicitado */}
                    {esPadreActivo && dialogo !== null && (() => {
                      const targetX = dialogo.lado === 'izq' ? cx - 34 : cx + 34;
                      const targetY = cy + SEPARACION_VERTICAL;
                      return (
                        <g className="pointer-events-none">
                          <line
                            x1={cx}
                            y1={cy}
                            x2={targetX}
                            y2={targetY}
                            stroke="#38bdf8"
                            strokeWidth={1.8}
                            strokeDasharray="4 4"
                            opacity={0.8}
                          />
                          <circle
                            cx={targetX}
                            cy={targetY}
                            r={RADIO_NODO - 3}
                            fill="rgba(8, 47, 73, 0.85)"
                            stroke="#38bdf8"
                            strokeWidth={1.5}
                            strokeDasharray="3 3"
                            className="anim-anillo"
                            style={{ transformOrigin: `${targetX}px ${targetY}px` }}
                          />
                          <circle
                            cx={targetX}
                            cy={targetY}
                            r={RADIO_NODO - 3}
                            fill="rgba(8, 47, 73, 0.9)"
                            stroke="#38bdf8"
                            strokeWidth={1.5}
                            strokeDasharray="3 3"
                          />
                          <text
                            x={targetX}
                            y={targetY}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fontSize={12}
                            fontWeight={800}
                            fill="#38bdf8"
                            className="font-mono-tech"
                          >
                            ?
                          </text>
                          <text
                            x={targetX}
                            y={targetY + RADIO_NODO + 8}
                            textAnchor="middle"
                            fontSize={9}
                            fontWeight={800}
                            fill="#7dd3fc"
                            className="font-tech-header uppercase tracking-wider"
                          >
                            {dialogo.lado === 'izq' ? '¿Hijo Izq?' : '¿Hijo Der?'}
                          </text>
                        </g>
                      );
                    })()}

                    {/* Número de visita */}
                    <g
                      style={{
                        transformOrigin: `${cx + RADIO_NODO - 2}px ${cy - RADIO_NODO + 2}px`,
                        transform: `scale(${resaltado ? 1 : 0})`,
                        opacity: resaltado ? 1 : 0,
                        transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease',
                      }}
                    >
                      <circle
                        cx={cx + RADIO_NODO - 2}
                        cy={cy - RADIO_NODO + 2}
                        r={8}
                        stroke="#03060d"
                        strokeWidth={1.2}
                        style={{ fill: color ? color.insignia : 'transparent', transition: 'fill 0.45s ease' }}
                      />
                      <text
                        x={cx + RADIO_NODO - 2}
                        y={cy - RADIO_NODO + 2}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={9}
                        fontWeight={700}
                        fill="#03060d"
                      >
                        {orden}
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>
          )}
        </div>
      </main>

      {/* ESTADO INFORMATIVO + BOTÓN ATRÁS */}
      <footer className="relative z-20 shrink-0 w-full max-w-5xl px-4 pb-3 flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 max-w-[70vw] truncate rounded-xl px-4 py-2 bg-emerald-500/10 border border-emerald-400/30 text-emerald-200 text-xs font-mono-tech shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] shrink-0" />
          <span className="truncate">{textoEstado}</span>
        </div>

        <button
          onClick={(): void => {
            playClickSound();
            onBack();
          }}
          onMouseEnter={playHoverSound}
          className="relative inline-flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-[length:200%_auto] hover:bg-right shadow-md shadow-indigo-600/40 hover:shadow-purple-500/60 hover:-translate-y-0.5 active:scale-95 transition-all duration-300 group cursor-pointer border border-indigo-300/30 shrink-0"
        >
          <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform duration-300" />
          <span className="font-tech-header text-sm tracking-wider">Atrás</span>
        </button>
      </footer>
    </div>
  );
};

export default BinaryTreePanel;
