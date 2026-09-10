import React from 'react';
import { ArrowUpDown } from 'lucide-react';

import { GenericSortingPanel } from './GenericSortingPanel';

interface SelectionSortPanelProps {
  onBack: () => void;
}

export const SelectionSortPanel: React.FC<SelectionSortPanelProps> = ({ onBack }) => {
  return (
    <GenericSortingPanel
      onBack={onBack}
      metodoDeOrdenamiento={5}
      categoryTitle="MÉTODOS DE ORDENACIÓN"
      methodTitle="Método de Selección"
      methodSubtitle="Selection Sort Algorithm"
      successMessage="El arreglo fue ordenado exitosamente con el método de Selección."
      icon={ArrowUpDown}
      colorScheme="purple"
    />
  );
};

export default SelectionSortPanel;