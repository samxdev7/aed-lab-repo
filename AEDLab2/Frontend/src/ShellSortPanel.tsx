import React from 'react';
import { Sparkles } from 'lucide-react';

import { GenericSortingPanel } from './GenericSortingPanel';

interface ShellSortPanelProps {
  onBack: () => void;
}

export const ShellSortPanel: React.FC<ShellSortPanelProps> = ({ onBack }) => {
  return (
    <GenericSortingPanel
      onBack={onBack}
      metodoDeOrdenamiento={6}
      categoryTitle="MÉTODOS DE ORDENACIÓN"
      methodTitle="Método Shell"
      methodSubtitle="Shell Sort Algorithm"
      successMessage="El arreglo fue ordenado exitosamente con el método Shell."
      icon={Sparkles}
      colorScheme="purple"
    />
  );
};

export default ShellSortPanel;