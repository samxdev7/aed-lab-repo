const BASE_URL = 'http://localhost:8080/api/notacion-polaca';

export interface PasoNotacionPolaca {
  numeroPaso: number;
  operador: string;
  subExpresion: string;
  subExpresionConvertida: string;
}

export interface FotogramaNotacionPolaca {
  tipo: 'push' | 'pop' | 'step';
  operador: string;
  pila: string[];
  paso: PasoNotacionPolaca | null;
}

export interface NotacionPolacaRespuesta {
  expresionOriginal: string;
  expresionResultado: string;
  modalidad: string;
  totalPasos: number;
  pasos: PasoNotacionPolaca[];
  fotogramas: FotogramaNotacionPolaca[];
}

export const convertirNotacionPolaca = async (
  expresion: string,
  modalidad: 'prefijo' | 'postfijo'
): Promise<NotacionPolacaRespuesta> => {
  const response = await fetch(`${BASE_URL}/convertir`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ expresion, modalidad }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Error HTTP: ${response.status}`);
  }

  return await response.json();
};
