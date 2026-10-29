import React, { useMemo, useState } from 'react';
import { ArrowLeft, Play, RotateCcw } from 'lucide-react';
import { useSoundEffects } from './useSoundEffects';
import { useNotification } from './NotificationContext';

/* ------------------------------------------------------------------ */
/*  TIPOS (contrato con el backend)                                    */
/* ------------------------------------------------------------------ */
export type LadoHijo = 'izq' | 'der';
export type TipoRecorrido = 'PreOrden' | 'InOrden' | 'PosOrden';

export interface NodoArbolDTO {
  id: number;
  valor: string;
  izq: NodoArbolDTO | null;
  der: NodoArbolDTO | null;
}

/** Pregunta o ingreso que el backend solicita al usuario. */
export interface DialogoDTO {
  fase: 'pregunta' | 'ingreso';
  valorPadre: string;
  lado: LadoHijo;
}

export interface BinaryTreePanelProps {
  onBack: () => void;

  /* Datos que entrega el backend */
  arbol?: NodoArbolDTO | null;
  dialogo?: DialogoDTO | null;
  tipoRecorrido?: TipoRecorrido | null;
  /** IDs de los nodos ya alcanzados por el recorrido, en orden de visita. El backend la va ampliando paso a paso. */
  nodosResaltados?: number[];
  animando?: boolean;
  mensajeEstado?: string;

  /* Eventos que el backend atiende */
  onCrearArbol?: (letraRaiz: string) => void;
  onResponderHijo?: (tieneHijo: boolean) => void;
  onConfirmarHijo?: (letra: string) => void;
  onCancelarHijo?: () => void;
  onRecorrido?: (tipo: TipoRecorrido) => void;
  onReiniciar?: () => void;
}

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

/** Azul → verde → verde aqua → celeste, en ciclo según el orden de visita. */
const PALETA_RESALTADO: ColorResaltado[] = [
  { nodo: '#2563eb', insignia: '#93c5fd' },
  { nodo: '#059669', insignia: '#6ee7b7' },
  { nodo: '#0d9488', insignia: '#5eead4' },
  { nodo: '#0ea5e9', insignia: '#7dd3fc' },
];

/** Disposición visual: columna = posición inorden, por eso los nodos nunca se encimen. */
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
  arbol = null,
  dialogo = null,
  tipoRecorrido = null,
  nodosResaltados = [],
  animando = false,
  mensajeEstado,
  onCrearArbol,
  onResponderHijo,
  onConfirmarHijo,
  onCancelarHijo,
  onRecorrido,
  onReiniciar,
}) => {
  const { playClickSound, playHoverSound } = useSoundEffects();
  const { showNotification } = useNotification();

  const [letraRaiz, setLetraRaiz] = useState<string>('');
  const [letraDialogo, setLetraDialogo] = useState<string>('');

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

  /* ---------- Entrada: solo letras A-Z mayúsculas ---------- */
  const filtrarEntrada = (texto: string, aplicar: (valor: string) => void): void => {
    if (texto === '' || REGEX_MAYUSCULA.test(texto)) {
      aplicar(texto);
    } else {
      showNotification('warning', 'Carácter no permitido', 'Solo se aceptan letras mayúsculas (A-Z).');
    }
  };

  const crearArbol = (): void => {
    if (!REGEX_MAYUSCULA.test(letraRaiz)) {
      showNotification('error', 'Raíz inválida', 'Ingrese una letra mayúscula (A-Z).');
      return;
    }
    playClickSound();
    onCrearArbol?.(letraRaiz);
  };

  const confirmarHijo = (): void => {
    if (!REGEX_MAYUSCULA.test(letraDialogo)) {
      showNotification('error', 'Nodo inválido', 'Ingrese una letra mayúscula (A-Z).');
      return;
    }
    playClickSound();
    onConfirmarHijo?.(letraDialogo);
    setLetraDialogo('');
  };

  const reiniciar = (): void => {
    playClickSound();
    setLetraRaiz('');
    setLetraDialogo('');
    onReiniciar?.();
  };

  /* ---------- Medidas del lienzo ---------- */
  const maxColumna: number = posiciones.reduce((m: number, p: PosicionNodo) => Math.max(m, p.columna), 0);
  const maxNivel: number = posiciones.reduce((m: number, p: PosicionNodo) => Math.max(m, p.nivel), 0);
  const anchoLienzo: number = maxColumna * SEPARACION_HORIZONTAL + MARGEN_LIENZO * 2;
  const altoLienzo: number = maxNivel * SEPARACION_VERTICAL + MARGEN_LIENZO * 2;
  const coordX = (p: PosicionNodo): number => MARGEN_LIENZO + p.columna * SEPARACION_HORIZONTAL;
  const coordY = (p: PosicionNodo): number => MARGEN_LIENZO + p.nivel * SEPARACION_VERTICAL;

  const textoRecorrido: string | null =
    tipoRecorrido && nodosResaltados.length > 0
      ? `${tipoRecorrido}: ${nodosResaltados.map((id: number) => posicionPorId.get(id)?.valor ?? '').join(', ')}`
      : null;
  const textoEstado: string =
    mensajeEstado ?? textoRecorrido ?? (arbol ? 'Elija un recorrido' : 'Ingrese la letra de la raíz');

  const claseBotonSuave: string =
    'px-4 py-1.5 rounded-lg font-tech-header font-semibold tracking-wider text-xs sm:text-sm border backdrop-blur-sm transition-all duration-200 ' +
    'disabled:opacity-30 disabled:cursor-not-allowed enabled:cursor-pointer enabled:hover:-translate-y-0.5';

  return (
    <div className="fixed inset-0 h-dvh w-full bg-[#03060d] text-white flex flex-col items-center overflow-hidden select-none font-tech-body">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600&family=Fira+Code:wght@400;500&display=swap');
          html, body { overflow: hidden; }
          .font-tech-header { font-family: 'Rajdhani', sans-serif; letter-spacing: 0.06em; }
          .font-tech-body { font-family: 'Plus Jakarta Sans', sans-serif; }
          .font-mono-tech { font-family: 'Fira Code', monospace; }
          .lienzo-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
          .lienzo-scroll::-webkit-scrollbar-track { background: transparent; }
          .lienzo-scroll::-webkit-scrollbar-thumb { background: rgba(52, 211, 153, 0.25); border-radius: 4px; }
        `}
      </style>

      {/* Destellos de fondo */}
      <div className="absolute top-[-12%] left-[-10%] w-[45%] h-[45%] bg-emerald-600/12 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-12%] right-[-10%] w-[45%] h-[45%] bg-cyan-600/12 rounded-full blur-[150px] pointer-events-none" />

      {/* TÍTULO CENTRADO */}
      <header className="relative z-10 shrink-0 w-full text-center pt-4 pb-2">
        <h1
          className="font-tech-header font-semibold uppercase text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-white to-cyan-300 drop-shadow-[0_0_18px_rgba(52,211,153,0.35)]"
          style={{ fontSize: 'clamp(1.25rem, 4.5vh, 2rem)', letterSpacing: '0.14em' }}
        >
          Árbol Binario
        </h1>
        <div className="mt-1.5 flex items-center justify-center gap-2">
          <span className="h-px w-16 bg-gradient-to-r from-transparent to-emerald-400/70" />
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 shadow-[0_0_8px_#34d399]" />
          <span className="h-px w-16 bg-gradient-to-l from-transparent to-cyan-400/70" />
        </div>
      </header>

      {/* CONTROLES CENTRADOS */}
      <section className="relative z-10 shrink-0 w-full max-w-xl px-4 flex flex-col items-center gap-2 pt-1">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <input
            type="text"
            value={letraRaiz}
            maxLength={1}
            disabled={bloqueado}
            placeholder="Raíz (A-Z)"
            onChange={(e: React.ChangeEvent<HTMLInputElement>): void => filtrarEntrada(e.target.value, setLetraRaiz)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>): void => {
              if (e.key === 'Enter' && !bloqueado) crearArbol();
            }}
            className="w-28 rounded-lg px-3 py-1.5 text-center bg-white/[0.03] border border-emerald-400/30 text-emerald-100 font-mono-tech text-sm placeholder:text-slate-500 placeholder:text-xs focus:outline-none focus:border-emerald-300/80 focus:shadow-[0_0_14px_rgba(52,211,153,0.25)] disabled:opacity-40 transition-all"
          />
          <button
            onClick={crearArbol}
            onMouseEnter={playHoverSound}
            disabled={bloqueado}
            className={`${claseBotonSuave} inline-flex items-center gap-1.5 bg-emerald-400/15 border-emerald-300/50 text-emerald-100 enabled:hover:bg-emerald-400/25 enabled:hover:shadow-[0_0_16px_rgba(52,211,153,0.3)]`}
          >
            <Play className="w-3 h-3" />
            Crear árbol
          </button>
          <button
            onClick={reiniciar}
            onMouseEnter={playHoverSound}
            className={`${claseBotonSuave} inline-flex items-center gap-1.5 bg-rose-400/10 border-rose-300/30 text-rose-200 enabled:hover:bg-rose-400/20 enabled:hover:shadow-[0_0_16px_rgba(244,63,94,0.25)]`}
          >
            <RotateCcw className="w-3 h-3" />
            Reiniciar
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {TIPOS_RECORRIDO.map((tipo: TipoRecorrido) => (
            <button
              key={tipo}
              onClick={(): void => {
                playClickSound();
                onRecorrido?.(tipo);
              }}
              onMouseEnter={playHoverSound}
              disabled={arbol === null || bloqueado}
              className={`${claseBotonSuave} min-w-[6.5rem] ${
                tipoRecorrido === tipo
                  ? 'bg-cyan-400/20 border-cyan-300/70 text-cyan-100 shadow-[0_0_14px_rgba(34,211,238,0.25)]'
                  : 'bg-white/[0.03] border-emerald-400/25 text-emerald-100/90 enabled:hover:bg-emerald-400/15 enabled:hover:border-emerald-300/60'
              }`}
            >
              {tipo}
            </button>
          ))}
        </div>
      </section>

      {/* LIENZO */}
      <main className="relative z-10 flex-1 min-h-0 w-full max-w-4xl px-4 py-3">
        <div className="lienzo-scroll w-full h-full flex overflow-auto rounded-2xl bg-white/[0.02] backdrop-blur-md border border-emerald-400/20 shadow-[0_0_40px_rgba(16,185,129,0.08)]">
          {arbol === null ? (
            <p className="w-full self-center text-center px-6 text-slate-500 text-xs sm:text-sm">              
                El árbol aparecerá aquí a medida que ingrese los nodos
            </p>
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
                    stroke="rgba(110, 231, 183, 0.35)"
                    strokeWidth={1.5}
                  />
                );
              })}

              {/* Nodos */}
              {posiciones.map((p: PosicionNodo) => {
                const orden: number | undefined = ordenPorId.get(p.id);
                const resaltado: boolean = orden !== undefined;
                const color: ColorResaltado | null = resaltado
                  ? PALETA_RESALTADO[(orden - 1) % PALETA_RESALTADO.length]
                  : null;
                const cx: number = coordX(p);
                const cy: number = coordY(p);

                return (
                  <g
                    key={`nodo-${p.id}`}
                    style={{
                      transformOrigin: `${cx}px ${cy}px`,
                      transform: `scale(${resaltado ? ESCALA_RESALTADO : 1})`,
                      transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                  >
                    <circle
                      cx={cx}
                      cy={cy}
                      r={RADIO_NODO}
                      strokeWidth={1.5}
                      style={{
                        fill: color ? color.nodo : '#0b2f2a',
                        stroke: color ? color.insignia : '#34d399',
                        filter: color ? `drop-shadow(0 0 7px ${color.nodo})` : 'drop-shadow(0 0 4px rgba(52,211,153,0.35))',
                        transition: 'fill 0.45s ease, stroke 0.45s ease, filter 0.45s ease',
                      }}
                    />
                    <text
                      x={cx}
                      y={cy}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={15}
                      fontWeight={600}
                      fill="#ffffff"
                      className="font-tech-header"
                    >
                      {p.valor}
                    </text>

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

      {/* ESTADO CENTRADO + ATRÁS */}
      <footer className="relative z-20 shrink-0 w-full max-w-4xl px-4 pb-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <span />
        <div className="max-w-[60vw] truncate text-center rounded-lg px-4 py-1.5 bg-emerald-400/[0.06] border border-emerald-300/20 text-emerald-100/90 text-xs font-mono-tech">
          {textoEstado}
        </div>
        <div className="flex justify-end">
          <button
            onClick={(): void => {
              playClickSound();
              onBack();
            }}
            onMouseEnter={playHoverSound}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600/90 via-indigo-600/90 to-purple-600/90 shadow-md shadow-indigo-600/30 hover:shadow-purple-500/50 hover:-translate-y-0.5 active:scale-95 transition-all duration-300 group cursor-pointer border border-indigo-300/25"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform duration-300" />
            <span className="font-tech-header tracking-wider">Atrás</span>
          </button>
        </div>
      </footer>

      {/* DIÁLOGO (solicitado por el backend) */}
      {dialogo !== null && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-[#03060d]/75 backdrop-blur-sm">
          <div className="w-full max-w-xs rounded-2xl border border-emerald-300/30 bg-[#0b1020]/95 p-5 text-center shadow-[0_0_50px_rgba(52,211,153,0.18)]">
            {dialogo.fase === 'pregunta' ? (
              <>
                <p className="text-slate-200 text-sm mb-4 leading-relaxed">
                  ¿El nodo <strong className="text-cyan-300 font-semibold">{dialogo.valorPadre}</strong> tiene un hijo por la{' '}
                  <strong className="text-emerald-300 font-semibold">{dialogo.lado === 'izq' ? 'izquierda' : 'derecha'}</strong>?
                </p>
                <div className="flex justify-center gap-2">
                  <button
                    onClick={(): void => {
                      playClickSound();
                      onResponderHijo?.(true);
                    }}
                    onMouseEnter={playHoverSound}
                    className={`${claseBotonSuave} w-20 bg-emerald-400/20 border-emerald-300/60 text-emerald-100 enabled:hover:bg-emerald-400/30`}
                  >
                    Sí
                  </button>
                  <button
                    onClick={(): void => {
                      playClickSound();
                      onResponderHijo?.(false);
                    }}
                    onMouseEnter={playHoverSound}
                    className={`${claseBotonSuave} w-20 bg-white/[0.04] border-white/20 text-slate-200 enabled:hover:bg-white/10`}
                  >
                    No
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-slate-200 text-sm mb-3">
                  Hijo {dialogo.lado === 'izq' ? 'izquierdo' : 'derecho'} de{' '}
                  <strong className="text-cyan-300 font-semibold">{dialogo.valorPadre}</strong>
                </p>
                <input
                  autoFocus
                  type="text"
                  value={letraDialogo}
                  maxLength={1}
                  placeholder="A-Z"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>): void =>
                    filtrarEntrada(e.target.value, setLetraDialogo)
                  }
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>): void => {
                    if (e.key === 'Enter') confirmarHijo();
                  }}
                  className="w-20 rounded-lg px-3 py-2 mb-4 bg-white/[0.04] border border-emerald-300/40 text-emerald-100 font-mono-tech text-xl text-center placeholder:text-slate-600 placeholder:text-sm focus:outline-none focus:border-emerald-300/80 focus:shadow-[0_0_14px_rgba(52,211,153,0.25)]"
                />
                <div className="flex justify-center gap-2">
                  <button
                    onClick={confirmarHijo}
                    onMouseEnter={playHoverSound}
                    className={`${claseBotonSuave} w-24 bg-emerald-400/20 border-emerald-300/60 text-emerald-100 enabled:hover:bg-emerald-400/30`}
                  >
                    Aceptar
                  </button>
                  <button
                    onClick={(): void => {
                      playClickSound();
                      setLetraDialogo('');
                      onCancelarHijo?.();
                    }}
                    onMouseEnter={playHoverSound}
                    className={`${claseBotonSuave} w-24 bg-white/[0.04] border-white/20 text-slate-200 enabled:hover:bg-white/10`}
                  >
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BinaryTreePanel;