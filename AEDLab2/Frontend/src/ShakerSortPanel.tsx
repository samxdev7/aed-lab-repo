import React from 'react';
import { Zap } from 'lucide-react';

import { GenericSortingPanel } from './GenericSortingPanel';

interface ShakerSortPanelProps {
  onBack: () => void;
}

export const ShakerSortPanel: React.FC<ShakerSortPanelProps> = ({ onBack }) => {
  return (
    <GenericSortingPanel
      onBack={onBack}
      metodoDeOrdenamiento={4}
      categoryTitle="Métodos de Ordenación"
      methodTitle="Método de Ordenación Sacudida"
      methodSubtitle="Cocktail / Shaker Sort Algorithm"
      successMessage="Array ordenado con éxito mediante Sacudida."
      icon={Zap}
      colorScheme="purple"
    />
  );
};