import React from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { guardarTamano } from './services/algorithmService';
import { useNotification } from './NotificationContext';
export type ColorScheme = 'cyan' | 'purple' | 'red';

// eslint-disable-next-line react-refresh/only-export-components
export const getColorStyles = (colorScheme: ColorScheme = 'cyan') => {
  switch (colorScheme) {
    case 'purple':
      return {
        text: 'text-purple-400',
        textLight: 'text-purple-300',
        bgLight: 'bg-purple-500/10',
        border: 'border-purple-500/30',
        borderFocus: 'focus:border-purple-400',
        borderFocusInput: 'focus:border-purple-400 border-purple-500/30',
        buttonBg: 'bg-purple-600 hover:bg-purple-500',
        buttonActive: 'active:bg-purple-700',
        buttonDisabled: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
        buttonEnabled: 'bg-purple-500 text-white border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.4)]',
        buttonHover: 'hover:bg-purple-500 hover:text-white',
        accentCheck: 'accent-purple-400',
        gradient: 'from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/25',
        shadowGlow: 'shadow-[0_0_15px_rgba(168,85,247,0.3)]',
      };
    case 'red':
      return {
        text: 'text-red-400',
        textLight: 'text-red-300',
        bgLight: 'bg-red-500/10',
        border: 'border-red-500/30',
        borderFocus: 'focus:border-red-400',
        borderFocusInput: 'focus:border-red-400 border-red-500/30',
        buttonBg: 'bg-red-600 hover:bg-red-500',
        buttonActive: 'active:bg-red-700',
        buttonDisabled: 'bg-red-500/20 text-red-300 border-red-500/40',
        buttonEnabled: 'bg-red-500 text-white border-red-400 shadow-[0_0_10px_rgba(239,68,68,0.4)]',
        buttonHover: 'hover:bg-red-500 hover:text-white',
        accentCheck: 'accent-red-400',
        gradient: 'from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-red-500/25',
        shadowGlow: 'shadow-[0_0_15px_rgba(239,68,68,0.3)]',
      };
    case 'cyan':
    default:
      return {
        text: 'text-cyan-400',
        textLight: 'text-cyan-300',
        bgLight: 'bg-cyan-500/10',
        border: 'border-cyan-500/30',
        borderFocus: 'focus:border-cyan-400',
        borderFocusInput: 'focus:border-cyan-400 border-cyan-500/30',
        buttonBg: 'bg-cyan-600 hover:bg-cyan-500',
        buttonActive: 'active:bg-cyan-700',
        buttonDisabled: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
        buttonEnabled: 'bg-cyan-500 text-white border-cyan-400 shadow-[0_0_10px_rgba(56,189,248,0.4)]',
        buttonHover: 'hover:bg-cyan-500 hover:text-white',
        accentCheck: 'accent-cyan-400',
        gradient: 'from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-cyan-500/25',
        shadowGlow: 'shadow-[0_0_15px_rgba(56,189,248,0.3)]',
      };
  }
};

interface PanelHeaderProps {
  category: string;
  title: string;
  subtitle: string;
  colorScheme?: ColorScheme;
}

export const PanelHeader: React.FC<PanelHeaderProps> = ({
  category,
  title,
  subtitle,
  colorScheme = 'cyan',
}) => {
  const styles = getColorStyles(colorScheme);
  return (
    <header className="text-center mt-2">
      <span className={`text-xs uppercase tracking-widest ${styles.text} font-bold ${styles.bgLight} px-3 py-1 rounded-full border ${styles.border}`}>
        {category}
      </span>
      <h1 className="text-3xl font-extrabold tracking-tight mt-2 mb-1">
        {title}
      </h1>
      <p className="text-sm font-medium text-slate-400">
        {subtitle}
      </p>
    </header>
  );
};

interface ArraySizeConfigProps {
  arraySize: string;
  setArraySize: (size: string) => void;
  isSizeSet: boolean;
  setIsSizeSet: (set: boolean) => void;
  colorScheme?: ColorScheme;
}

export const ArraySizeConfig: React.FC<ArraySizeConfigProps> = ({
  arraySize,
  setArraySize,
  isSizeSet,
  setIsSizeSet,
  colorScheme = 'cyan',
}) => {
  const styles = getColorStyles(colorScheme);
  const { showNotification } = useNotification();
  return (
    <div className={`bg-[#11162b] border ${styles.border} rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4`}>
      <div className="flex items-center gap-3">
        <span className={`${styles.text} font-semibold text-sm`}>
          Ingresar Tamaño del Arreglo:
        </span>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            value={arraySize}
            onChange={(e) => {
              const val = Number(e.target.value);
              if (val < 1 && e.target.value !== '') setArraySize('1');
              else setArraySize(e.target.value);
              setIsSizeSet(false);
            }}
            className={`w-20 bg-[#0a0d18] border ${styles.border} rounded-xl px-3 py-1.5 text-center text-white font-bold text-lg focus:outline-none ${styles.borderFocus} transition-all`}
            placeholder="1"
          />
          <button
            onClick={async () => {
              if (Number(arraySize) > 0) {
                try {
                  const data = await guardarTamano(Number(arraySize));
                  showNotification('success', 'Tamaño Guardado', data.message);
                  setIsSizeSet(true);
                } catch (err: any) {
                  showNotification('error', 'Error al guardar tamaño', err.message);
                }
              }
            }}
            disabled={!arraySize || Number(arraySize) <= 0}
            className={`p-2 rounded-xl border transition-all flex items-center justify-center ${
              isSizeSet ? styles.buttonEnabled : `${styles.buttonDisabled} ${styles.buttonHover}`
            }`}
            title="Establecer Tamaño"
          >
            <Check className="w-5 h-5" />
          </button>
        </div>
      </div>

      {isSizeSet && (
        <span className={`text-xs ${styles.textLight} ${styles.bgLight} px-3 py-1.5 rounded-lg border ${styles.border}`}>
          Tamaño definido: <strong className="text-white">{arraySize}</strong> elementos
        </span>
      )}
    </div>
  );
};

interface PanelFooterProps {
  onBack: () => void;
  label?: string;
  colorScheme?: ColorScheme;
}

export const PanelFooter: React.FC<PanelFooterProps> = ({
  onBack,
  label = 'Salir',
  colorScheme = 'cyan',
}) => {
  const styles = getColorStyles(colorScheme);
  return (
    <footer className="flex justify-end w-full max-w-4xl mx-auto mt-2">
      <button
        onClick={onBack}
        className={`group flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r ${styles.gradient} text-white font-semibold transition-all duration-200 shadow-lg active:scale-95`}
      >
        <ArrowLeft className="w-5 h-5 transition-transform duration-200 group-hover:-translate-x-1" />
        {label}
      </button>
    </footer>
  );
};

interface OperationSelectorProps<T extends string> {
  selectedAction: T;
  setSelectedAction: (action: T) => void;
  actions: Array<{
    id: T;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }>;
  colorScheme?: ColorScheme;
  onActionChange?: (action: T) => void;
}

export const OperationSelector = <T extends string>({
  selectedAction,
  setSelectedAction,
  actions,
  colorScheme = 'cyan',
  onActionChange,
}: OperationSelectorProps<T>) => {
  const styles = getColorStyles(colorScheme);
  return (
    <div className={`bg-[#11162b] border ${styles.border} rounded-2xl p-4`}>
      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-3">
        Selecciona una Operación
      </label>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          const isSelected = selectedAction === action.id;
          return (
            <button
              key={action.id}
              onClick={() => {
                setSelectedAction(action.id);
                if (onActionChange) onActionChange(action.id);
              }}
              className={`flex items-center gap-2 p-3 rounded-xl text-xs font-semibold border transition-all duration-200 justify-center ${
                isSelected
                  ? `${styles.buttonBg} text-white border-transparent ${styles.shadowGlow} scale-[1.02]`
                  : `bg-[#0a0d18] text-slate-300 ${styles.border} hover:border-slate-500 hover:text-white`
              }`}
            >
              <input
                type="radio"
                name="operation"
                checked={isSelected}
                onChange={() => {}}
                className={`${styles.accentCheck} cursor-pointer`}
              />
              <Icon className="w-4 h-4" />
              <span>{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

interface FormInputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  type?: string;
  min?: string | number;
  max?: string | number;
  step?: string | number;
  colorScheme?: ColorScheme;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  min,
  max,
  step,
  colorScheme = 'cyan',
}) => {
  const styles = getColorStyles(colorScheme);
  return (
    <div>
      <label className="text-xs text-slate-400">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        className={`w-full bg-[#0a0d18] border ${styles.border} rounded-xl px-3 py-2 text-sm text-white focus:outline-none ${styles.borderFocus}`}
      />
    </div>
  );
};
