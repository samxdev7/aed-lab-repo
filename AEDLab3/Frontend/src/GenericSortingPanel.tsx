import React, { useState } from 'react';
import { useNotification } from './NotificationContext';
import { PanelHeader, ArraySizeConfig, PanelFooter } from './CommonComponents';
import type { ColorScheme } from './CommonComponents';
import { ejecutarOrdenamiento } from './services/algorithmService';

export interface GenericSortingPanelProps {
  onBack: () => void;
  metodoDeOrdenamiento: number;
  categoryTitle: string;
  methodTitle: string;
  methodSubtitle: string;
  successMessage: string;
  icon: React.ElementType;
  colorScheme?: ColorScheme;
}

export const GenericSortingPanel: React.FC<GenericSortingPanelProps> = ({
  onBack,
  metodoDeOrdenamiento,
  categoryTitle,
  methodTitle,
  methodSubtitle,
  successMessage,
  icon: Icon,
  colorScheme = 'purple',
}) => {
  const { showNotification } = useNotification();

  // Estados de control
  const [arraySize, setArraySize] = useState<string>('6');
  const [isSizeSet, setIsSizeSet] = useState<boolean>(true);
  const [rawInput, setRawInput] = useState<string>('');
  const [originalArray, setOriginalArray] = useState<number[]>([]);
  const [sortedArray, setSortedArray] = useState<number[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Ejecución del algoritmo vía backend
  const handleSort = () => {
    if (!rawInput.trim()) {
      showNotification('warning', 'Entrada vacía', 'Por favor ingrese números separados por comas.');
      return;
    }

    const items = rawInput
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item !== '');

    const soloEnteros = items.every((item) => /^-?\d+$/.test(item));
    if (!soloEnteros) {
      showNotification('error', 'Formato inválido', 'Asegúrese de ingresar únicamente números enteros (sin decimales ni letras).');
      return;
    }

    const parsedArray = items.map((item) => parseInt(item, 10));

    const limit = Number(arraySize);
    if (!arraySize || isNaN(limit) || limit <= 0 || !Number.isInteger(limit)) {
      showNotification('error', 'Tamaño inválido', 'El tamaño del arreglo debe ser un entero positivo.');
      return;
    }

    if (parsedArray.length > limit) {
      showNotification(
        'warning',
        'Límite excedido',
        `El arreglo contiene más elementos (${parsedArray.length}) que el tamaño definido (${limit}).`
      );
      return;
    }


    setOriginalArray(parsedArray);
    setLoading(true);

    ejecutarOrdenamiento({
      tam: limit,
      arreglo: parsedArray,
      metodoDeOrdenamiento
    })
      .then((res) => {
        setSortedArray(res);
        showNotification('success', 'Ordenamiento completado', successMessage);
      })
      .catch((err: any) => {
        console.error(err);
        showNotification('error', 'Error de Backend', err.message || 'No se pudo ordenar el arreglo.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="min-h-screen bg-[#0a0d18] text-white flex flex-col justify-between p-8 font-sans">
      {/* Header */}
      <PanelHeader
        category={categoryTitle}
        title={methodTitle}
        subtitle={methodSubtitle}
        colorScheme={colorScheme}
      />

      <main className="max-w-4xl mx-auto w-full flex flex-col gap-6 my-auto py-4">
        {/* Tamaño del Arreglo */}
        <ArraySizeConfig
          arraySize={arraySize}
          setArraySize={setArraySize}
          isSizeSet={isSizeSet}
          setIsSizeSet={setIsSizeSet}
          colorScheme={colorScheme}
        />

        {/* Input y Acción */}
        <div className="bg-[#11162b] border border-purple-500/30 rounded-2xl p-6">
          <label className="block text-xs text-slate-400 mb-2 text-center font-medium">
            Elementos (separados por comas):
          </label>
          <div className="flex gap-4 items-center">
            <input
              type="text"
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              placeholder="Ej: 5, 6, 7, 9, 1, 23"
              className="flex-1 bg-[#0a0d18] border border-purple-500/30 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-400 transition-colors"
            />
            <button
              onClick={handleSort}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)] active:scale-95 flex items-center gap-2 text-sm shrink-0"
            >
              <Icon className="w-4 h-4 fill-current" />
              {loading ? 'Ordenando...' : 'Ordenar'}
            </button>
          </div>
        </div>

        {/* Visualización de Resultados */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Arreglo Desordenado */}
          <div className="bg-[#11162b] border border-purple-500/30 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[160px]">
            <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
              <Icon className="w-4 h-4 text-purple-400 fill-current" /> Array Desordenado
            </h3>
            <div className="flex flex-wrap gap-2 justify-center">
              {originalArray.length > 0 ? (
                originalArray.map((num, idx) => (
                  <div
                    key={idx}
                    className="w-12 h-12 rounded-xl bg-purple-900/30 border border-purple-500/40 flex items-center justify-center font-bold text-lg text-purple-200 shadow-inner"
                  >
                    {num}
                  </div>
                ))
              ) : (
                <span className="text-xs text-slate-500">Sin elementos</span>
              )}
            </div>
          </div>

          {/* Arreglo Ordenado */}
          <div className="bg-[#11162b] border border-purple-500/30 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[160px]">
            <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
              <Icon className="w-4 h-4 text-purple-400 fill-current" /> Array Ordenado
            </h3>
            {sortedArray ? (
              <div className="flex flex-wrap gap-2 justify-center">
                {sortedArray.map((num, idx) => (
                  <div
                    key={idx}
                    className="w-12 h-12 rounded-xl bg-purple-600/40 border border-purple-400 flex items-center justify-center font-bold text-lg text-white shadow-[0_0_10px_rgba(168,85,247,0.3)]"
                  >
                    {num}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">Haga clic en "Ordenar"</p>
            )}
          </div>
        </div>
      </main>

      {/* Botón Salir / Atrás */}
      <PanelFooter onBack={onBack} label="Atrás" colorScheme={colorScheme} />
    </div>
  );
};

export default GenericSortingPanel;