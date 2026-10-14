import { useState } from 'react';
import { PresentationPanel } from './PresentationPanel';
import { RecursiveMenuPanel } from './RecursiveMenuPanel';
import { NotificationProvider } from './NotificationContext';
import { HanoiPanel } from './HanoiPanel';
import { SaltoRanaPanel } from './SaltoRanaPanel';
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

        {currentScreen === 'hanoi' && (
          <HanoiPanel onBack={() => setCurrentScreen('menu')} />
        )}

        {currentScreen === 'frog' && (
          <SaltoRanaPanel onBack={() => setCurrentScreen('menu')} />
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