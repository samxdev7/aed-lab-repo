import { apiRequest, API_KEY } from '../HTTPMethods';

// Unión de literales: los únicos tipos de mensaje que envía el backend
export type TipoMensajeCola = 'info' | 'ok' | 'warn';

// Unión con null: una casilla vacía llega como null
export type ContenidoCasilla = string | null;

type PunterosCola = { frente: number; finalCola: number; cantidad: number };
type MensajeCola = { mensaje: string; tipoMensaje: TipoMensajeCola };
type ElementoAfectado = { elementoAfectado: ContenidoCasilla; indiceAfectado: number | null };

// Intersección: reproduce el record ColaEstadoDto del backend juntando sus bloques
export type ColaEstado = { cola: ContenidoCasilla[] } & PunterosCola & MensajeCola & ElementoAfectado;

const URL_COLA: string = `${API_KEY}/cola`;

export const obtenerEstadoCola = (): Promise<ColaEstado> =>
  apiRequest<ColaEstado>(`${URL_COLA}/estado`);

export const encolarPersona = (nombrePersona: string): Promise<ColaEstado> =>
  apiRequest<ColaEstado>(`${URL_COLA}/encolar`, { method: 'POST', body: { persona: nombrePersona } });

export const desencolarPersona = (): Promise<ColaEstado> =>
  apiRequest<ColaEstado>(`${URL_COLA}/desencolar`, { method: 'DELETE' });

export const reiniciarCola = (): Promise<ColaEstado> =>
  apiRequest<ColaEstado>(`${URL_COLA}/reiniciar`, { method: 'POST' });

export const definirTamanoCola = (tamanoCola: number): Promise<ColaEstado> =>
  apiRequest<ColaEstado>(`${URL_COLA}/tamano`, { method: 'POST', body: { tamano: tamanoCola } });