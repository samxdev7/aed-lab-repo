import React from 'react';
import { Shield } from 'lucide-react';

import { GenericSortingPanel } from './GenericSortingPanel';

interface BubbleSortSignalPanelProps {
  onBack: () => void;
}

export const BubbleSortSignalPanel: React.FC<BubbleSortSignalPanelProps> = ({ onBack }) => {
  return (
    <GenericSortingPanel
      onBack={onBack}
      metodoDeOrdenamiento={2}
      categoryTitle="Métodos de Ordenación"
      methodTitle="Método de Ordenación Burbuja Señal"
      methodSubtitle="Bubble Sort with Flag Algorithm"
      successMessage="El arreglo fue ordenado exitosamente con el método de Burbuja Señal."
      icon={Shield}
      colorScheme="purple"
    />
  );
};