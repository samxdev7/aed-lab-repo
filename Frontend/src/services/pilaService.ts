import { API_KEY, apiRequest } from '../HTTPMethods';

export type TipoMensajePila = 'info' | 'ok' | 'warn';

type EstadoBasePila = {
  elementos: string[]; // Pila[0..Tope]: de la base (0) hasta el tope
  tope: number;        // Tope: -1 significa pila vacía
  max: number;         // Max: tamaño del arreglo (0 = todavía no se ha definido)
  mensaje: string;
  tipoMensaje: TipoMensajePila;
};

// Consultar el estado y definir el tamaño no afectan ningún elemento
export type PilaEstado = EstadoBasePila & { elementoAfectado: string | null };

// Push y Pop siempre devuelven el Dato que insertaron o sacaron
export type PilaEstadoConElemento = EstadoBasePila & { elementoAfectado: string };

type PilaPeticion = { centroComercial: string };
type PilaTamanoPeticion = { max: number };

const URL_PILA: string = `${API_KEY}/pila`;

export const obtenerEstadoPila = (): Promise<PilaEstado> =>
  apiRequest<PilaEstado>(`${URL_PILA}/estado`);

export const definirTamanoPila = (max: number): Promise<PilaEstado> => {
  const peticion: PilaTamanoPeticion = { max };
  return apiRequest<PilaEstado>(`${URL_PILA}/tamano`, { method: 'POST', body: peticion });
};

export const pushCentroComercial = (centroComercial: string): Promise<PilaEstadoConElemento> => {
  const peticion: PilaPeticion = { centroComercial };
  return apiRequest<PilaEstadoConElemento>(`${URL_PILA}/push`, { method: 'POST', body: peticion });
};

export const popCentroComercial = (): Promise<PilaEstadoConElemento> =>
  apiRequest<PilaEstadoConElemento>(`${URL_PILA}/pop`, { method: 'DELETE' });