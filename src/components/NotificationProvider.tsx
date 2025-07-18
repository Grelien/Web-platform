import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationContainer } from './notifications';

interface NotificationContextType {
  addNotification: (notification: { type: 'success' | 'error' | 'info' | 'warning'; message: string; duration?: number }) => string;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const notificationHook = useNotifications();

  return (
    <NotificationContext.Provider value={notificationHook}>
      {children}
      <NotificationContainer notifications={notificationHook.notifications} onRemove={notificationHook.removeNotification} />
    </NotificationContext.Provider>
  );
}

export function useNotificationContext(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
}
