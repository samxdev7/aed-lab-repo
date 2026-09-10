const BASE_URL = 'http://localhost:8080/api/algoritmo';

export interface OrdenamientoDTO {
  tam: number;
  arreglo: number[];
  metodoDeOrdenamiento: number; // 1: Burbuja, 2: Burbuja c/señal, 3: Baraja, 4: Sacudida, 5: Selección, 6: Shell
}

export interface BusquedaDTO {
  tam: number;
  arreglo: number[];
  objetivo: number;
}

export const ejecutarOrdenamiento = async (datos: OrdenamientoDTO) => {
  const response = await fetch(`${BASE_URL}/ordenamiento`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  });
  if (!response.ok) {
    if (response.status === 404) throw new Error('404: Servicio no encontrado (Ordenamiento)');
    if (response.status === 500) throw new Error('500: Error interno del servidor');
    throw new Error(`Error HTTP: ${response.status}`);
  }
  return await response.json();
};

export const ejecutarBusqueda = async (datos: BusquedaDTO) => {
  const response = await fetch(`${BASE_URL}/busqueda`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  });
  if (!response.ok) {
    if (response.status === 404) throw new Error('404: Servicio no encontrado (Búsqueda)');
    if (response.status === 500) throw new Error('500: Error interno del servidor');
    throw new Error(`Error HTTP: ${response.status}`);
  }
  return await response.json();
};

export const guardarTamano = async (tamano: number) => {
  const response = await fetch(`${BASE_URL}/tamano`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tamano })
  });
  if (!response.ok) {
    if (response.status === 404) throw new Error('404: Servicio no encontrado');
    if (response.status === 500) throw new Error('500: Error interno del servidor');
    throw new Error(`Error HTTP: ${response.status}`);
  }
  return await response.json();
};