const BASE_URL = 'http://localhost:8080/api/cola-circular';

export interface ColaCircularEstado {
  cola: (string | null)[];
  frente: number;
  finalCola: number;
  cantidad: number;
  capacidad: number;
  mensaje: string;
  tipoMensaje: 'info' | 'ok' | 'warn';
  dioVuelta: boolean;
  elementoAfectado: string | null;
  indiceAfectado: number | null;
}

export const obtenerEstadoColaCircular = async (): Promise<ColaCircularEstado> => {
  const response = await fetch(`${BASE_URL}/estado`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Error HTTP: ${response.status}`);
  }

  return await response.json();
};

export const encolarTrabajo = async (estacion: string): Promise<ColaCircularEstado> => {
  const response = await fetch(`${BASE_URL}/encolar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estacion }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Error HTTP: ${response.status}`);
  }

  return await response.json();
};

export const desencolarTrabajo = async (): Promise<ColaCircularEstado> => {
  const response = await fetch(`${BASE_URL}/desencolar`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Error HTTP: ${response.status}`);
  }

  return await response.json();
};

export const reiniciarColaCircular = async (): Promise<ColaCircularEstado> => {
  const response = await fetch(`${BASE_URL}/reiniciar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Error HTTP: ${response.status}`);
  }

  return await response.json();
};
