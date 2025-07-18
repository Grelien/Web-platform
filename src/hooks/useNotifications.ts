import { useState, useCallback } from 'react';
import type { Notification } from '../types';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2);
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration ?? 4000
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto remove notification after duration
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const addSuccessNotification = useCallback((message: string, duration?: number) => {
    return addNotification({ type: 'success', message, duration });
  }, [addNotification]);

  const addErrorNotification = useCallback((message: string, duration?: number) => {
    return addNotification({ type: 'error', message, duration });
  }, [addNotification]);

  const addInfoNotification = useCallback((message: string, duration?: number) => {
    return addNotification({ type: 'info', message, duration });
  }, [addNotification]);

  const addWarningNotification = useCallback((message: string, duration?: number) => {
    return addNotification({ type: 'warning', message, duration });
  }, [addNotification]);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    addSuccessNotification,
    addErrorNotification,
    addInfoNotification,
    addWarningNotification
  };
}
