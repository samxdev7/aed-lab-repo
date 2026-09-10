import React from 'react';
import { Circle } from 'lucide-react';

import { GenericSortingPanel } from './GenericSortingPanel';

interface BubbleSortPanelProps {
  onBack: () => void;
}

export const BubbleSortPanel: React.FC<BubbleSortPanelProps> = ({ onBack }) => {
  return (
    <GenericSortingPanel
      onBack={onBack}
      metodoDeOrdenamiento={1}
      categoryTitle="Métodos de Ordenación"
      methodTitle="Método de Ordenación Burbuja"
      methodSubtitle="Bubble Sort Algorithm"
      successMessage="El arreglo fue ordenado exitosamente con el método de Burbuja."
      icon={Circle}
      colorScheme="purple"
    />
  );
};