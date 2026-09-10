import React from 'react';

interface ArrayMenuPanelProps {
  onBack: () => void;
  onSelectOrdered: () => void;
  onSelectUnordered: () => void;
}

export const ArrayMenuPanel: React.FC<ArrayMenuPanelProps> = ({
  onBack,
  onSelectOrdered,
  onSelectUnordered,
}) => {
  return (
    <div className="relative flex flex-col justify-between min-h-screen bg-[#0B0D1B] text-white p-8 md:p-12 overflow-hidden select-none">
      {/* Patrones de puntos decorativos en las esquinas */}
      <div className="absolute top-6 left-6 grid grid-cols-6 gap-1 opacity-20 pointer-events-none">
        {Array.from({ length: 24 }).map((_, i) => (
          <div key={i} className="w-1.5 h-1.5 bg-white rounded-full"></div>
        ))}
      </div>
      <div className="absolute top-6 right-6 grid grid-cols-6 gap-1 opacity-20 pointer-events-none">
        {Array.from({ length: 24 }).map((_, i) => (
          <div key={i} className="w-1.5 h-1.5 bg-white rounded-full"></div>
        ))}
      </div>

      {/* Encabezado limpio estilo foto principal */}
      <header className="flex flex-col items-center justify-center mt-2 mb-10 z-10 text-center">
        {/* Título blanco nítido sin sombras ni resplandores excesivos */}
        <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-5">
          Laboratorio #2: Métodos de Ordenación y Búsqueda
        </h1>

        {/* Subtítulo en morado con líneas y puntos exactos a la foto */}
        <div className="flex items-center justify-center gap-2 font-medium text-sm md:text-base">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 opacity-50"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
          <div className="h-[1px] w-10 md:w-20 bg-gradient-to-r from-transparent via-purple-400/60 to-purple-400"></div>
          
          <span className="px-3 font-semibold text-purple-300 tracking-wide text-base md:text-lg">
            Selecciona el tipo de método que deseas trabajar
          </span>

          <div className="h-[1px] w-10 md:w-20 bg-gradient-to-l from-transparent via-purple-400/60 to-purple-400"></div>
          <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 opacity-50"></span>
        </div>
      </header>

      {/* Tarjetas Centradas */}
      <main className="flex-1 flex flex-col md:flex-row items-center justify-center gap-8 max-w-4xl mx-auto w-full my-auto py-6 z-10 px-4">
        {/* Tarjeta Desordenados */}
        <button
          onClick={onSelectUnordered}
          className="relative w-full md:w-1/2 p-10 bg-[#121829] rounded-3xl border-2 border-cyan-500/60 shadow-[0_0_30px_rgba(6,182,212,0.35)] hover:shadow-[0_0_50px_rgba(6,182,212,0.6)] hover:border-cyan-400 transition-all duration-300 transform hover:-translate-y-2 flex flex-col items-center justify-center cursor-pointer group"
        >
          <div className="absolute top-5 right-5 w-4 h-4 bg-cyan-400 rounded-full shadow-[0_0_15px_#22D3EE]"></div>
          <div className="w-20 h-20 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-6 text-cyan-400 group-hover:scale-110 group-hover:bg-cyan-500/20 transition-all">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-cyan-200 tracking-wider">
            Búsqueda
          </h2>
        </button>

      {/* Tarjeta Ordenados */}
          <button
            onClick={onSelectOrdered}
            className="relative w-full md:w-1/2 p-10 bg-[#121829] rounded-3xl border-2 border-purple-500/60 shadow-[0_0_30px_rgba(168,85,247,0.35)] hover:shadow-[0_0_50px_rgba(168,85,247,0.6)] hover:border-purple-400 transition-all duration-300 transform hover:-translate-y-2 flex flex-col items-center justify-center cursor-pointer group"
          >
            <div className="absolute top-5 right-5 w-4 h-4 bg-purple-500 rounded-full shadow-[0_0_15px_#A855F7]"></div>
            <div className="w-20 h-20 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mb-6 text-purple-400 group-hover:scale-110 group-hover:bg-purple-500/20 transition-all">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4h13M3 8h10M3 12h7m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
            </div>
            <h2 className="text-3xl font-black text-purple-200 tracking-wider">
              Ordenamiento
            </h2>
          </button>
        </main>


      {/* Pie de página con botón Atrás */}
      <footer className="w-full flex justify-start items-center pt-8 mt-2 z-10">
        <button
          onClick={onBack}
          className="group flex items-center gap-3 px-7 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-base rounded-2xl shadow-[0_0_20px_rgba(79,70,229,0.5)] hover:shadow-[0_0_30px_rgba(79,70,229,0.8)] transition-all duration-300 transform hover:-translate-x-1 cursor-pointer"
        >
          <svg
            className="w-6 h-6 transition-transform duration-300 group-hover:-translate-x-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 12H5m7 7l-7-7 7-7" />
          </svg>
          <span>Atrás</span>
        </button>
      </footer>
    </div>
  );
};