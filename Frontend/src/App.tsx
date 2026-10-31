import { useState } from 'react';
import { PresentationPanel } from './PresentationPanel';
import { LinearMenuPanel } from './LinearMenuPanel';
import { NotificationProvider } from './NotificationContext';
import { BinaryTreePanel } from './BinaryTreePanel';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<
    | 'presentation'
    | 'menu'
    | 'arboles'
  >('presentation');

  return (
    <NotificationProvider>
      <main className="w-full h-screen overflow-hidden">
        {currentScreen === 'presentation' && (
          <PresentationPanel onNext={() => setCurrentScreen('menu')} />
        )}

        {currentScreen === 'menu' && (
          <LinearMenuPanel
            onBack={() => setCurrentScreen('presentation')}
            onSelectArboles={() => setCurrentScreen('arboles')}
          />
        )}

        {currentScreen === 'arboles' && (
          <BinaryTreePanel onBack={() => setCurrentScreen('menu')} />
        )}
      </main>
    </NotificationProvider>
  );
}

