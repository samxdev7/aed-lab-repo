import { API_KEY, fetchRequest } from "../HTTPMethods";

const BASE_URL = API_KEY + '/arboles';

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

export interface ArbolesRespuestaDTO {
  arbol: NodoArbolDTO | null;
  dialogo: DialogoDTO | null;
  tipoRecorrido: TipoRecorrido | null;
  nodosResaltados: number[];
  animando: boolean;
  mensajeEstado: string;
}

export interface BinaryTreePanelProps {
  onBack: () => void;

  /* Datos que entrega el backend */
  arbol?: NodoArbolDTO | null;
  dialogo?: DialogoDTO | null;
  tipoRecorrido?: TipoRecorrido | null;
  /** IDs de los nodos ya alcanzados por el recorrido, en orden de visita. */
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

export const iniciarArbol = async (valor: string): Promise<ArbolesRespuestaDTO> => {
  return fetchRequest<ArbolesRespuestaDTO>(`${BASE_URL}/iniciar`, {
    method: 'POST',
    body: { valor },
  });
};

export const responderPregunta = async (tieneHijo: boolean): Promise<ArbolesRespuestaDTO> => {
  return fetchRequest<ArbolesRespuestaDTO>(`${BASE_URL}/responder-pregunta`, {
    method: 'POST',
    body: { tieneHijo },
  });
};

export const confirmarHijo = async (valor: string): Promise<ArbolesRespuestaDTO> => {
  return fetchRequest<ArbolesRespuestaDTO>(`${BASE_URL}/confirmar-hijo`, {
    method: 'POST',
    body: { valor },
  });
};

export const cancelarHijo = async (): Promise<ArbolesRespuestaDTO> => {
  return fetchRequest<ArbolesRespuestaDTO>(`${BASE_URL}/cancelar-hijo`, {
    method: 'POST',
  });
};

export const ejecutarRecorrido = async (tipo: TipoRecorrido): Promise<ArbolesRespuestaDTO> => {
  return fetchRequest<ArbolesRespuestaDTO>(`${BASE_URL}/recorrido/${tipo}`, {
    method: 'GET',
  });
};

export const reiniciarArbol = async (): Promise<ArbolesRespuestaDTO> => {
  return fetchRequest<ArbolesRespuestaDTO>(`${BASE_URL}/reiniciar`, {
    method: 'POST',
  });
};
