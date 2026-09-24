import { useState } from 'react';
import { PresentationPanel } from './PresentationPanel';
import { SaltoRanaPanel } from './SaltoRanaPanel';
import { NotificationProvider } from './NotificationContext';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<
    | 'presentation'
    | 'saltoRana'
  >('presentation');

  return (
    <NotificationProvider>
      <main className="w-full min-h-screen">
        {currentScreen === 'presentation' && (
          <PresentationPanel onNext={() => setCurrentScreen('saltoRana')} />
        )}

        {currentScreen === 'saltoRana' && (
          <SaltoRanaPanel onBack={() => setCurrentScreen('presentation')} />
        )}

      </main>
    </NotificationProvider>
  );
}