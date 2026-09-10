import { useState } from 'react';
import { PresentationPanel } from './PresentationPanel';
import { ArrayMenuPanel } from './ArrayMenuPanel';
import { SortingMethodsPanel } from './SortingMethodsPanel';
import { BinarySearchPanel } from './BinarySearchPanel';
import { ShakerSortPanel } from './ShakerSortPanel';
import { BubbleSortPanel } from './BubbleSortPanel';
import { BubbleSortSignalPanel } from './BubbleSortSignalPanel';
import { InsertionSortPanel } from './InsertionSortPanel';
import { SelectionSortPanel } from './SelectionSortPanel';
import { ShellSortPanel } from './ShellSortPanel';
import { NotificationProvider } from './NotificationContext';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<
    | 'presentation'
    | 'menu'
    | 'ordered'
    | 'binarySearch'
    | 'sacudida'
    | 'burbuja'
    | 'burbujaSenal'
    | 'baraja'
    | 'seleccion'
    | 'shell'
  >('presentation');

  return (
    <NotificationProvider>
      <main className="w-full min-h-screen">
        {currentScreen === 'presentation' && (
          <PresentationPanel onNext={() => setCurrentScreen('menu')} />
        )}

        {currentScreen === 'menu' && (
          <ArrayMenuPanel
            onBack={() => setCurrentScreen('presentation')}
            onSelectOrdered={() => setCurrentScreen('ordered')}
            onSelectUnordered={() => setCurrentScreen('binarySearch')}
          />
        )}

        {currentScreen === 'ordered' && (
          <SortingMethodsPanel
            onBack={() => setCurrentScreen('menu')}
            onSelectAlgorithm={(algorithmId: string) => {
              if (algorithmId === 'sacudida') {
                setCurrentScreen('sacudida');
              } else if (algorithmId === 'burbuja') {
                setCurrentScreen('burbuja');
              } else if (algorithmId === 'burbujaSenal' || algorithmId === 'burbuja-senal') {
                setCurrentScreen('burbujaSenal');
              } else if (
                algorithmId === 'baraja' ||
                algorithmId === 'insercion' ||
                algorithmId === 'baraja-insercion'
              ) {
                setCurrentScreen('baraja');
              } else if (algorithmId === 'seleccion' || algorithmId === 'selection') {
                setCurrentScreen('seleccion');
              } else if (algorithmId === 'shell') {
                setCurrentScreen('shell');
              }
            }}
          />
        )}

        {currentScreen === 'sacudida' && (
          <ShakerSortPanel
            onBack={() => setCurrentScreen('ordered')}
          />
        )}

        {currentScreen === 'burbuja' && (
          <BubbleSortPanel
            onBack={() => setCurrentScreen('ordered')}
          />
        )}

        {currentScreen === 'burbujaSenal' && (
          <BubbleSortSignalPanel
            onBack={() => setCurrentScreen('ordered')}
          />
        )}

        {currentScreen === 'baraja' && (
          <InsertionSortPanel
            onBack={() => setCurrentScreen('ordered')}
          />
        )}

        {currentScreen === 'seleccion' && (
          <SelectionSortPanel
            onBack={() => setCurrentScreen('ordered')}
          />
        )}

        {currentScreen === 'shell' && (
          <ShellSortPanel
            onBack={() => setCurrentScreen('ordered')}
          />
        )}

        {currentScreen === 'binarySearch' && (
          <BinarySearchPanel
            onBack={() => setCurrentScreen('menu')}
          />
        )}

      </main>
    </NotificationProvider>
  );
}