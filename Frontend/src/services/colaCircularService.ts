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

const extraerMensajeError = async (response: Response): Promise<string> => {
  try {
    const errorJson = await response.json();
    if (errorJson && errorJson.message) {
      return errorJson.message;
    }
  } catch {
    try {
      const text = await response.text();
      if (text) return text;
    } catch { /* ignore */ }
  }
  return `Error HTTP: ${response.status}`;
};

export const obtenerEstadoColaCircular = async (): Promise<ColaCircularEstado> => {
  const response = await fetch(`${BASE_URL}/estado`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const errorMsg = await extraerMensajeError(response);
    throw new Error(errorMsg);
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
    const errorMsg = await extraerMensajeError(response);
    throw new Error(errorMsg);
  }

  return await response.json();
};

export const desencolarTrabajo = async (): Promise<ColaCircularEstado> => {
  const response = await fetch(`${BASE_URL}/desencolar`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const errorMsg = await extraerMensajeError(response);
    throw new Error(errorMsg);
  }

  return await response.json();
};

export const reiniciarColaCircular = async (): Promise<ColaCircularEstado> => {
  const response = await fetch(`${BASE_URL}/reiniciar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const errorMsg = await extraerMensajeError(response);
    throw new Error(errorMsg);
  }

  return await response.json();
};
