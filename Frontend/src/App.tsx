import { useState } from 'react';
import { PresentationPanel } from './PresentationPanel';
import { RecursiveMenuPanel } from './RecursiveMenuPanel';
import { NotificationProvider } from './NotificationContext';
import { QueensPanelV2 } from './QueensPanelV2';
import { QuickSortPanel } from './QuickSortPanel';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<
    | 'presentation'
    | 'menu'
    | 'hanoi'
    | 'frog'
    | 'queens'
    | 'quicksort'
  >('presentation');

  return (
    <NotificationProvider>
      <main className="w-full h-screen overflow-hidden">
        {currentScreen === 'presentation' && (
          <PresentationPanel onNext={() => setCurrentScreen('menu')} />
        )}

        {currentScreen === 'menu' && (
          <RecursiveMenuPanel
            onBack={() => setCurrentScreen('presentation')}
            onSelectHanoi={() => setCurrentScreen('hanoi')}
            onSelectFrog={() => setCurrentScreen('frog')}
            onSelectQueens={() => setCurrentScreen('queens')}
            onSelectQuickSort={() => setCurrentScreen('quicksort')}
          />
        )}

        {/* Maquetación estática de vistas para los 4 ejercicios */}

        {currentScreen === 'hanoi' && (
          <div className="min-h-screen bg-[#0B0D1B] text-white p-8 flex flex-col justify-between">
            <h1 className="text-3xl font-bold text-cyan-400">Torres de Hanoi</h1>
            <p className="text-slate-400">Interfaz base lista para implementar lógica de animación.</p>
            <button
              onClick={() => setCurrentScreen('menu')}
              className="px-6 py-2 bg-indigo-600 rounded-xl w-fit"
            >
              Atrás
            </button>
          </div>
        )}

        {currentScreen === 'frog' && (
          <div className="min-h-screen bg-[#0B0D1B] text-white p-8 flex flex-col justify-between">
            <h1 className="text-3xl font-bold text-emerald-400">Salto de la Rana</h1>
            <p className="text-slate-400">Interfaz base lista para implementar lógica de animación.</p>
            <button
              onClick={() => setCurrentScreen('menu')}
              className="px-6 py-2 bg-indigo-600 rounded-xl w-fit"
            >
              Atrás
            </button>
          </div>
        )}

        {currentScreen === 'queens' && (
          <QueensPanelV2 onBack={() => setCurrentScreen('menu')} />
        )}

        {currentScreen === 'quicksort' && (
          <QuickSortPanel onBack={() => setCurrentScreen('menu')} />
        )}
      </main>
    </NotificationProvider>
  );
}