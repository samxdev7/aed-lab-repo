import { useState } from 'react';
import { PresentationPanel } from './PresentationPanel';
import { LinearMenuPanel } from './LinearMenuPanel';
import { NotificationProvider } from './NotificationContext';
import { StackPanel } from './StackPanel';
import { CircularQueuePanel } from './CircularQueuePanel';
import { QueuePanel } from './QueuePanel';
import { PolishNotationPanel } from './PolishNotationPanel';
import { BinaryTreePanel } from './BinaryTreePanel';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<
    | 'presentation'
    | 'menu'
    | 'pilas'
    | 'colas-circulares'
    | 'colas'
    | 'notacion-polaca'
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
            onSelectPilas={() => setCurrentScreen('pilas')}
            onSelectColasCirculares={() => setCurrentScreen('colas-circulares')}
            onSelectColas={() => setCurrentScreen('colas')}
            onSelectNotacionPolaca={() => setCurrentScreen('notacion-polaca')}
            onSelectArboles={() => setCurrentScreen('arboles')}
          />
        )}

        {currentScreen === 'pilas' && (
          <StackPanel onBack={() => setCurrentScreen('menu')} />
        )}

        {currentScreen === 'colas-circulares' && (
          <CircularQueuePanel onBack={() => setCurrentScreen('menu')} />
        )}

        {currentScreen === 'colas' && (
          <QueuePanel onBack={() => setCurrentScreen('menu')} />
        )}

        {currentScreen === 'notacion-polaca' && (
          <PolishNotationPanel onBack={() => setCurrentScreen('menu')} />
        )}

        {currentScreen === 'arboles' && (
          <BinaryTreePanel onBack={() => setCurrentScreen('menu')} />
        )}
      </main>
    </NotificationProvider>
  );
}
