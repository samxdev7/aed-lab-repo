import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
}

interface NotificationContextProps {
  showNotification: (type: NotificationType, title: string, message: string) => void;
  notifications: Notification[];
  dismissNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const showNotification = useCallback((type: NotificationType, title: string, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      dismissNotification(id);
    }, 4500); // Auto-dismiss after 4.5 seconds
  }, [dismissNotification]);

  return (
    <NotificationContext.Provider value={{ showNotification, notifications, dismissNotification }}>
      {children}
      {/* Contenedor flotante para notificaciones */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
        {notifications.map((n) => (
          <Toast key={n.id} notification={n} onClose={() => dismissNotification(n.id)} />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

const Toast: React.FC<{ notification: Notification; onClose: () => void }> = ({ notification, onClose }) => {
  const { type, title, message } = notification;

  let bgClass: string;
  let borderClass: string;
  let textClass: string;
  let Icon: React.ComponentType<{ className?: string }>;

  switch (type) {
    case 'success':
      bgClass = 'bg-slate-950/85 backdrop-blur-md border border-emerald-500/20';
      borderClass = 'border-l-emerald-500';
      textClass = 'text-emerald-400';
      Icon = CheckCircle2;
      break;
    case 'error':
      bgClass = 'bg-slate-950/85 backdrop-blur-md border border-rose-500/20';
      borderClass = 'border-l-rose-500';
      textClass = 'text-rose-400';
      Icon = XCircle;
      break;
    case 'warning':
      bgClass = 'bg-slate-950/85 backdrop-blur-md border border-amber-500/20';
      borderClass = 'border-l-amber-500';
      textClass = 'text-amber-400';
      Icon = AlertTriangle;
      break;
    case 'info':
    default:
      bgClass = 'bg-slate-950/85 backdrop-blur-md border border-cyan-500/20';
      borderClass = 'border-l-cyan-500';
      textClass = 'text-cyan-400';
      Icon = Info;
      break;
  }

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-2xl transition-all duration-300 animate-slide-in border-l-4 ${bgClass} ${borderClass} w-full overflow-hidden`}
    >
      <div className={`mt-0.5 shrink-0 ${textClass}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold text-white tracking-wide">{title}</h4>
        <p className="text-xs text-slate-300 mt-1 leading-relaxed break-words">{message}</p>
      </div>
      <button
        onClick={onClose}
        className="shrink-0 text-slate-400 hover:text-white transition-colors duration-150 p-0.5 rounded-lg hover:bg-slate-800"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
