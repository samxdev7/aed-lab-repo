const BASE_URL = 'http://localhost:8080/api/salto-rana';

export type TipoDeFichaRana = 'V' | 'C';

export interface MovimientoRana {
  numeroMovimiento: number;
  posicionOrigen: number;
  posicionDestino: number;
  tipoFicha: TipoDeFichaRana;
  estadoResultante: string;
}

export interface SaltoRanaRespuesta {
  estadoInicial: string;
  estadoFinal: string;
  totalMovimientos: number;
  movimientos: MovimientoRana[];
}

export const resolverSaltoDeRana = async (ranasPorLado: number): Promise<SaltoRanaRespuesta> => {
  const response = await fetch(`${BASE_URL}/resolver?ranasPorLado=${ranasPorLado}`);

  if (!response.ok) {
    if (response.status === 400) throw new Error(await response.text());
    if (response.status === 404) throw new Error('404: Servicio no encontrado (Salto de Rana)');
    if (response.status === 500) throw new Error('500: Error interno del servidor');
    throw new Error(`Error HTTP: ${response.status}`);
  }

  return await response.json();
};