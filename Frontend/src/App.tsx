import { useState } from 'react';
import { PresentationPanel } from './PresentationPanel';
import { NotificationProvider } from './NotificationContext';
import { HanoiPanel } from './HanoiPanel';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<
    | 'presentation'
    | 'hanoi'
  >('presentation');

  return (
    <NotificationProvider>
      <main className="w-full h-screen overflow-hidden bg-slate-950">
        {/* PANTALLA 1: PRESENTACIÓN TEMPORAL */}
        {currentScreen === 'presentation' && (
          <PresentationPanel onNext={() => setCurrentScreen('hanoi')} />
        )}

        {/* PANTALLA 2: TORRES DE HANOI */}
        {currentScreen === 'hanoi' && (
          <HanoiPanel onBack={() => setCurrentScreen('presentation')} />
        )}
      </main>
    </NotificationProvider>
  );
}