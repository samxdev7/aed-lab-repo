import React from 'react';

export interface StackPanelProps {
  onBack: () => void;
}

export const StackPanel: React.FC<StackPanelProps> = ({ onBack }) => {
  return (
    <div className="relative h-screen w-screen bg-[#090b16] text-white flex flex-col justify-between p-4 sm:p-6 select-none overflow-hidden font-sans">
      <header className="flex justify-start">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:shadow-lg hover:shadow-indigo-500/30 transition-all cursor-pointer text-sm"
        >
          ← Volver al Menú
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center">
        <h1 className="text-2xl sm:text-4xl font-extrabold uppercase tracking-wider text-cyan-300 mb-3 drop-shadow-[0_0_20px_rgba(34,211,238,0.4)]">
          Pilas
        </h1>
        <p className="text-base sm:text-xl text-slate-300 font-medium">
          Panel listo para ser usado
        </p>
      </main>

      <footer className="h-6" />
    </div>
  );
};

export default StackPanel;
