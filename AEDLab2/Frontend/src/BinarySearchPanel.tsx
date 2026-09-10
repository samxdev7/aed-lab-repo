import React, { useState } from 'react';
import { ArrowLeft, Save, Search, CheckCircle2 } from 'lucide-react';
import { ejecutarBusqueda, ejecutarOrdenamiento, guardarTamano } from './services/algorithmService';
import { useNotification } from './NotificationContext';

interface BinarySearchPanelProps {
  onBack: () => void;
}

export const BinarySearchPanel: React.FC<BinarySearchPanelProps> = ({ onBack }) => {
  const { showNotification } = useNotification();
  const [tamano, setTamano] = useState<string>('');
  const [elementosInput, setElementosInput] = useState<string>('');
  const [arregloGuardado, setArregloGuardado] = useState<number[]>([]);

  const [objetivo, setObjetivo] = useState<string>('');
  
  const [resultado, setResultado] = useState<string | null>(null);
  const [cargando, setCargando] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Guardar Tamaño
  const handleGuardarTamano = async () => {
    if (!tamano.trim() || !/^\d+$/.test(tamano.trim())) {
      setError('Por favor ingresa un número entero válido y mayor a 0 para el tamaño.');
      return;
    }
    const num = parseInt(tamano, 10);
    if (num <= 0) {
      setError('Por favor ingresa un número entero válido y mayor a 0 para el tamaño.');
      return;
    }
    setError(null);
    try {
      const data = await guardarTamano(num);
      showNotification('success', 'Tamaño Guardado', data.message || 'Tamaño guardado correctamente en el backend');
    } catch (err: any) {
      setError(err.message || 'Error al guardar tamaño en el backend');
    }
  };

  // Guardar Elementos y Ordenar mediante el Backend de Java (sin usar .sort de JS)
  const handleGuardarElementos = async () => {
    if (!tamano.trim() || !/^\d+$/.test(tamano.trim())) {
      setError('Por favor ingresa un tamaño válido (número entero mayor a 0).');
      return;
    }
    const tamNum = parseInt(tamano, 10);
    if (tamNum <= 0) {
      setError('Por favor ingresa un tamaño válido (número entero mayor a 0).');
      return;
    }

    if (!elementosInput.trim()) {
      setError('El campo de elementos no puede estar vacío.');
      return;
    }

    const items = elementosInput.split(',').map((item) => item.trim()).filter((item) => item !== '');

    // Validar que TODOS los elementos sean números enteros estrictos (sin decimales ni texto)
    const soloEnteros = items.every((item) => /^-?\d+$/.test(item));

    if (!soloEnteros) {
      setError('Solo se permiten números enteros separados por comas (no se aceptan decimales ni letras).');
      return;
    }

    const valores = items.map((item) => parseInt(item, 10));

    if (valores.length !== tamNum) {
      setError(`Se esperaban ${tamNum} elementos según el tamaño ingresado, pero ingresaste ${valores.length}.`);
      return;
    }

    setCargando(true);
    setError(null);

    try {
      // Guardar el tamaño en el backend
      await guardarTamano(tamNum);
      
      // Ordenar el arreglo consumiendo el controlador de Java (Shell Sort / Opción 6)
      const resOrdenado = await ejecutarOrdenamiento({
        tam: tamNum,
        arreglo: valores,
        metodoDeOrdenamiento: 6,
      });

      setArregloGuardado(resOrdenado);
      showNotification('success', 'Arreglo Procesado', 'El arreglo ha sido ordenado y guardado utilizando el Backend en Java.');
    } catch (err: any) {
      setError(err.message || 'Error al procesar el arreglo en el backend.');
    } finally {
      setCargando(false);
    }
  };

  // Ejecutar Búsqueda contra Backend
  const handleBuscar = async () => {
    if (arregloGuardado.length === 0) {
      setError('Primero debes ingresar y guardar los elementos del arreglo.');
      return;
    }
    
    if (!objetivo.trim() || !/^-?\d+$/.test(objetivo.trim())) {
      setError('El elemento a buscar debe ser un número entero válido (sin decimales ni letras).');
      return;
    }

    const valBuscar = parseInt(objetivo.trim(), 10);

    setCargando(true);
    setError(null);

    try {
      const data = await ejecutarBusqueda({
        tam: arregloGuardado.length,
        arreglo: arregloGuardado,
        objetivo: valBuscar,
      });

      // Extraer indiceElementoEncontrado del objeto JSON devuelto por el Backend
      let pos: number = -1;
      if (typeof data === 'object' && data !== null) {
        if ('indiceElementoEncontrado' in data) {
          pos = (data as any).indiceElementoEncontrado;
        } else if ('posicion' in data) {
          pos = (data as any).posicion;
        }
        if ((data as any).arregloOrdenado && Array.isArray((data as any).arregloOrdenado)) {
          setArregloGuardado((data as any).arregloOrdenado);
        }
      } else if (typeof data === 'number') {
        pos = data;
      }

      if (pos !== -1 && pos !== undefined) {
        setResultado(`El elemento ${valBuscar} se encuentra en la posición (índice) ${pos} del arreglo.`);
      } else {
        setResultado(`El elemento ${valBuscar} no se encuentra en el arreglo.`);
      }
    } catch (err: any) {
      setError(err.message || 'Error al comunicar con el backend. Verifica que Spring Boot esté activo.');
    } finally {
      setCargando(false);
    }
  };


  return (
    <div className="min-h-screen bg-[#0a0d18] text-white flex flex-col justify-between p-8 font-sans">
      <header className="text-center mt-2">
        <h1 className="text-4xl font-extrabold tracking-tight mb-2">
          Método de Búsqueda Binaria
        </h1>
        <div className="flex items-center justify-center gap-3 text-cyan-400">
          <span className="h-[1px] w-12 bg-cyan-500/40"></span>
          <p className="text-sm font-medium text-slate-300">
            Laboratorio 2 - Algoritmos de Búsqueda
          </p>
          <span className="h-[1px] w-12 bg-cyan-500/40"></span>
        </div>
      </header>

      {error && (
        <div className="max-w-3xl mx-auto w-full bg-red-500/10 border border-red-500/40 text-red-400 p-3.5 rounded-xl text-center text-sm font-medium my-2 animate-fade-in">
          {error}
        </div>
      )}

      <main className="max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8 my-auto py-4">
        <div className="flex flex-col gap-6">
          <div className="bg-[#11162b] p-6 rounded-2xl border border-cyan-500/30 flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="text-base font-semibold text-slate-300 whitespace-nowrap">
                Tam. del Arreglo
              </label>
              <div className="flex gap-2 w-full sm:w-auto">
                <input
                  type="number"
                  step="1"
                  value={tamano}
                  onChange={(e) => setTamano(e.target.value)}
                  placeholder="Ej. 6"
                  className="w-full sm:w-64 bg-[#0a0d18] border border-cyan-500/30 rounded-xl px-4 py-3 text-lg text-white focus:outline-none focus:border-cyan-400 transition-colors"
                />
                <button
                  onClick={handleGuardarTamano}
                  className="p-3 bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500 hover:text-white rounded-xl transition-colors shrink-0"
                  title="Guardar Tamaño"
                >
                  <Save className="w-6 h-6" />
                </button>
              </div>

            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="text-base font-semibold text-slate-300 whitespace-nowrap">
                Elementos
              </label>
              <div className="flex gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  value={elementosInput}
                  onChange={(e) => setElementosInput(e.target.value)}
                  placeholder="Ej. 1, 3, 7, 9, 12, 15"
                  className="w-full sm:w-64 bg-[#0a0d18] border border-cyan-500/30 rounded-xl px-4 py-3 text-lg text-white focus:outline-none focus:border-cyan-400 transition-colors"
                />
                <button
                  onClick={handleGuardarElementos}
                  className="p-3 bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500 hover:text-white rounded-xl transition-colors shrink-0"
                  title="Guardar Elementos"
                >
                  <Save className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-[#11162b] p-6 rounded-2xl border border-cyan-500/30 min-h-[160px] flex flex-col justify-between">
            <div className="w-full overflow-x-auto pb-3 custom-scrollbar">
              <div className="flex items-center gap-2.5 min-w-max my-auto py-2 px-1">
                {arregloGuardado.length > 0 ? (
                  arregloGuardado.map((val, idx) => (
                    <span
                      key={idx}
                      className="px-4 py-2.5 bg-cyan-500/10 border border-cyan-500/40 rounded-xl text-cyan-300 font-mono text-xl font-bold shrink-0"
                    >
                      {val}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500 italic text-base mx-auto">
                    1 3 7 9 12 15
                  </span>
                )}
              </div>
            </div>
            <span className="text-sm font-bold text-slate-300 tracking-wider text-center mt-2">
              Array Ordenado
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-6 justify-between">
          <div className="bg-[#11162b] p-6 rounded-2xl border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <label className="text-base font-semibold text-slate-300 whitespace-nowrap">
              Elemento a Buscar
            </label>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <input
                type="number"
                step="1"
                value={objetivo}
                onChange={(e) => setObjetivo(e.target.value)}
                placeholder="X"
                className="w-full sm:w-28 bg-[#0a0d18] border border-cyan-500/30 rounded-xl px-4 py-3 text-center text-lg text-white focus:outline-none focus:border-cyan-400 font-bold transition-colors"
              />
              <button
                onClick={handleBuscar}
                disabled={cargando}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-base shrink-0"
              >
                <Search className="w-5 h-5" />
                {cargando ? '...' : 'Buscar'}
              </button>
            </div>
          </div>

          <div className="bg-[#11162b] p-8 rounded-2xl border border-cyan-500/30 flex-1 min-h-[180px] flex items-center justify-center text-center">
            {resultado ? (
              <div className="flex items-center gap-3 text-emerald-400 font-medium">
                <CheckCircle2 className="w-8 h-8 shrink-0" />
                <p className="text-xl font-semibold">{resultado}</p>
              </div>
            ) : (
              <p className="text-slate-400 text-base italic">
                El elemento X está en la posición Y.
              </p>
            )}
          </div>
        </div>
      </main>

      <footer className="flex justify-end w-full max-w-5xl mx-auto">
        <button
          onClick={onBack}
          className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:from-blue-500 hover:to-indigo-500 transition-all duration-200 shadow-lg hover:shadow-blue-500/25 active:scale-95 text-base"
        >
          <ArrowLeft className="w-5 h-5 transition-transform duration-200 group-hover:-translate-x-1" />
          Atrás
        </button>
      </footer>
    </div>
  );
};