import React from 'react';
import joksanImg from './assets/Joksan.jpg';
import gabrielaImg from './assets/Gabriela.jpg';
import samuelImg from './assets/Samuel.jpg';

interface PresentationPanelProps {
  onNext: () => void;
}

export const PresentationPanel: React.FC<PresentationPanelProps> = ({ onNext }) => {
  const members = [
    {
      name: "Joksan David Escobar Velásquez",
      carnet: "2025-1468U",
      image: joksanImg,
      // Tarjeta Violeta Intensa
      cardBg: "bg-gradient-to-b from-purple-200 via-purple-100 to-purple-50",
      borderColor: "border-purple-300 hover:border-purple-500",
      dotColor: "bg-purple-600 shadow-[0_0_10px_rgba(147,51,234,0.8)]",
      avatarBg: "bg-purple-300/60 border-purple-400/70 text-purple-700 group-hover:bg-purple-300 group-hover:shadow-[0_0_25px_rgba(168,85,247,0.7)]",
      hoverGlow: "hover:shadow-[0_12px_40px_rgba(168,85,247,0.4)]",
      textColor: "text-slate-900",
      carnetColor: "text-purple-700 font-bold",
      lineColor: "bg-purple-400",
    },
    {
      name: "Gabriela Abigail Ruiz Rodríguez",
      carnet: "2025-0240U",
      image: gabrielaImg,
      // Tarjeta Ámbar / Amarilla Intensa
      cardBg: "bg-gradient-to-b from-amber-200 via-amber-100 to-amber-50",
      borderColor: "border-amber-300 hover:border-amber-500",
      dotColor: "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]",
      avatarBg: "bg-amber-300/60 border-amber-400/70 text-amber-800 group-hover:bg-amber-300 group-hover:shadow-[0_0_25px_rgba(245,158,11,0.7)]",
      hoverGlow: "hover:shadow-[0_12px_40px_rgba(245,158,11,0.4)]",
      textColor: "text-slate-900",
      carnetColor: "text-amber-800 font-bold",
      lineColor: "bg-amber-400",
    },
    {
      name: "Samuel Enrique Rueda Ruiz",
      carnet: "2025-2104U",
      image: samuelImg,
      // Tarjeta Azul Intensa
      cardBg: "bg-gradient-to-b from-sky-200 via-sky-100 to-sky-50",
      borderColor: "border-sky-300 hover:border-sky-500",
      dotColor: "bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.8)]",
      avatarBg: "bg-sky-300/60 border-sky-400/70 text-blue-700 group-hover:bg-sky-300 group-hover:shadow-[0_0_25px_rgba(59,130,246,0.7)]",
      hoverGlow: "hover:shadow-[0_12px_40px_rgba(59,130,246,0.4)]",
      textColor: "text-slate-900",
      carnetColor: "text-blue-700 font-bold",
      lineColor: "bg-blue-400",
    },
  ];

  return (
    <div className="relative min-h-screen bg-[#0d0e26] text-white flex flex-col justify-between p-6 sm:p-10 overflow-hidden select-none">
      
      {/* Luces Ambientales de Fondo */}
      <div className="absolute -bottom-24 -left-24 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[140px] pointer-events-none" />
      
      {/* Puntos de Matriz Laterales */}
      <div 
        className="absolute top-20 left-8 w-24 h-24 opacity-20 pointer-events-none hidden md:block"
        style={{
          backgroundImage: `radial-gradient(#ffffff 2px, transparent 2px)`,
          backgroundSize: '12px 12px'
        }}
      />
      <div 
        className="absolute top-48 right-8 w-24 h-24 opacity-20 pointer-events-none hidden md:block"
        style={{
          backgroundImage: `radial-gradient(#ffffff 2px, transparent 2px)`,
          backgroundSize: '12px 12px'
        }}
      />

      {/* Encabezado Principal */}
      <header className="relative z-10 text-center mt-2 space-y-4">
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white drop-shadow-md">
          Universidad Nacional de Ingeniería
        </h1>

        {/* Subtítulo decorativo */}
        <div className="flex items-center justify-center gap-3 text-purple-200/90 text-base sm:text-xl font-medium">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-300/60" />
            <span className="h-[1px] w-12 sm:w-24 bg-gradient-to-r from-transparent to-purple-300/60" />
            <span className="w-2 h-2 rounded-full bg-purple-300" />
          </div>
          
          <span>Algoritmización y Estructuras de Datos</span>

          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-300" />
            <span className="h-[1px] w-12 sm:w-24 bg-gradient-to-l from-transparent to-purple-300/60" />
            <span className="w-1.5 h-1.5 rounded-full bg-purple-300/60" />
          </div>
        </div>

        {/* Cápsula de Carrera */}
        <div className="inline-block pt-1">
          <div className="px-6 py-2 rounded-full bg-slate-100/90 text-slate-900 font-semibold text-sm sm:text-base shadow-lg backdrop-blur-md border border-white/50">
            Carrera: <span className="font-bold text-indigo-900">Ingeniería en Computación</span>
          </div>
        </div>
      </header>

      {/* Tarjetas de Integrantes */}
      <main className="relative z-10 max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-8 my-auto py-6">
        {members.map((member, index) => (
          <div
            key={index}
            className={`group relative ${member.cardBg} border-2 ${member.borderColor} rounded-3xl p-7 flex flex-col items-center text-center shadow-xl ${member.hoverGlow} hover:-translate-y-2 transition-all duration-300 cursor-pointer`}
          >
            {/* Punto de acento con brillo */}
            <span className={`absolute top-5 right-5 w-3.5 h-3.5 rounded-full ${member.dotColor} transition-transform group-hover:scale-125 duration-300`} />

            {/* Círculo de Foto / Avatar con Resplandor de Neón */}
            <div className={`relative w-28 h-28 rounded-full ${member.avatarBg} border-2 flex flex-col items-center justify-center mb-6 shadow-inner transition-all duration-300 overflow-hidden`}>
              {member.image ? (
                <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
              ) : (
                <svg className="w-12 h-12 stroke-current opacity-90 transition-transform group-hover:scale-110 duration-300" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
            </div>

            {/* Nombre del Integrante */}
            <h3 className={`font-extrabold text-lg ${member.textColor} leading-snug min-h-[3rem] flex items-center justify-center`}>
              {member.name}
            </h3>
            
            {/* Línea Separadora */}
            <span className={`w-10 h-1.5 rounded-full ${member.lineColor} my-3 transition-all group-hover:w-16 duration-300`} />

            {/* Carnet */}
            <span className={`text-sm ${member.carnetColor} tracking-wide`}>
              {member.carnet}
            </span>
          </div>
        ))}
      </main>

      {/* Botón Siguiente */}
      <footer className="relative z-10 flex justify-end p-2">
        <button
          onClick={onNext}
          className="relative inline-flex items-center gap-3 px-8 py-3.5 rounded-2xl font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 bg-[length:200%_auto] hover:bg-right shadow-lg shadow-blue-600/40 hover:shadow-indigo-500/60 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-300 group cursor-pointer"
        >
          <span>Siguiente</span>
          <svg 
            className="w-5 h-5 transform group-hover:translate-x-1.5 transition-transform duration-300" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </footer>
    </div>
  );
};