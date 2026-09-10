import React from 'react';
import { ArrowLeft, ArrowUpDown, Circle, Layers, ShieldCheck, Sparkles, Zap } from 'lucide-react';

interface SortingMethodsPanelProps {
  onBack: () => void;
  onSelectAlgorithm: (algorithmId: string) => void;
}

export const SortingMethodsPanel: React.FC<SortingMethodsPanelProps> = ({
  onBack,
  onSelectAlgorithm,
}) => {
  const methods = [
    { id: 'burbuja', name: 'Burbuja', desc: 'Ordenación de burbujas', icon: Circle },
    { id: 'burbuja-senal', name: 'Burbuja Señal', desc: 'Ordenación de burbujas con bandera', icon: ShieldCheck },
    { id: 'baraja', name: 'Baraja', desc: 'Clasificación por inserción', icon: Layers },
    { id: 'sacudida', name: 'Sacudida', desc: 'Tipo de cocteleros / cócteles', icon: Zap },
    { id: 'seleccion', name: 'Selección', desc: 'Clasificación de selección', icon: ArrowUpDown },
    { id: 'shell', name: 'Shell', desc: 'Clasificación de conchas', icon: Sparkles },
  ];

  return (
    <div className="min-h-screen bg-[#0a0d18] text-white flex flex-col justify-between p-8 font-sans">
      {/* Encabezado */}
      <header className="text-center mt-4">
        <h1 className="text-4xl font-extrabold tracking-tight mb-3">
          Métodos de Ordenación
        </h1>
        <div className="flex items-center justify-center gap-3 text-purple-400">
          <span className="h-[1px] w-12 bg-purple-500/40"></span>
          <p className="text-sm font-medium text-slate-300">
            Laboratorio 2 - Selecciona el algoritmo a ejecutar
          </p>
          <span className="h-[1px] w-12 bg-purple-500/40"></span>
        </div>
      </header>

      {/* Grid de Métodos */}
      <main className="max-w-4xl mx-auto w-full my-auto py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {methods.map((method) => {
            const Icon = method.icon;
            return (
              <button
                key={method.id}
                onClick={() => onSelectAlgorithm(method.id)}
                className="group relative flex items-center justify-between p-6 rounded-2xl bg-[#11162b] border border-purple-500/30 hover:border-purple-400 transition-all duration-300 hover:shadow-[0_0_20px_rgba(168,85,247,0.25)] hover:-translate-y-0.5 text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3.5 rounded-xl bg-purple-500/10 text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300 shrink-0">
                    <Icon className="w-6 h-6 fill-current" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">
                      {method.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{method.desc}</p>
                  </div>
                </div>
                <div className="w-3 h-3 rounded-full bg-purple-500/40 group-hover:bg-purple-400 group-hover:shadow-[0_0_8px_#c084fc] transition-all shrink-0" />
              </button>
            );
          })}
        </div>
      </main>

      {/* Botón Atrás */}
      <footer className="flex justify-end w-full max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold hover:from-purple-500 hover:to-indigo-500 transition-all duration-200 shadow-lg hover:shadow-purple-500/25 active:scale-95 text-base"
        >
          <ArrowLeft className="w-5 h-5 transition-transform duration-200 group-hover:-translate-x-1" />
          Atrás
        </button>
      </footer>
    </div>
  );
};