import { API_KEY, apiRequest } from '../HTTPMethods';

export type TipoMensajePila = 'info' | 'ok' | 'warn';

type EstadoBasePila = {
  elementos: string[]; // Pila[0..Tope]: de la base (0) hasta el tope
  tope: number;        // Tope: -1 significa pila vacía
  max: number;         // Max: capacidad del arreglo
  mensaje: string;
  tipoMensaje: TipoMensajePila;
};

// Consultar el estado y reiniciar no afectan ningún elemento//
export type PilaEstado = EstadoBasePila & { elementoAfectado: string | null };

// Push y Pop siempre devuelven el Dato que insertaron o sacaron//
export type PilaEstadoConElemento = EstadoBasePila & { elementoAfectado: string };

type PilaPeticion = { centroComercial: string };

const URL_PILA: string = `${API_KEY}/pila`;

export const obtenerEstadoPila = (): Promise<PilaEstado> =>
  apiRequest<PilaEstado>(`${URL_PILA}/estado`);

export const pushCentroComercial = (centroComercial: string): Promise<PilaEstadoConElemento> => {
  const peticion: PilaPeticion = { centroComercial };
  return apiRequest<PilaEstadoConElemento>(`${URL_PILA}/push`, { method: 'POST', body: peticion });
};

export const popCentroComercial = (): Promise<PilaEstadoConElemento> =>
  apiRequest<PilaEstadoConElemento>(`${URL_PILA}/pop`, { method: 'DELETE' });

export const reiniciarPila = (): Promise<PilaEstado> =>
  apiRequest<PilaEstado>(`${URL_PILA}/reiniciar`, { method: 'POST' });