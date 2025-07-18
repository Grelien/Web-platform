import { useEffect, useState } from 'react';
import type { Notification } from '../types';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

interface NotificationContainerProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
}

export function NotificationContainer({ notifications, onRemove }: NotificationContainerProps) {
  return (
    <div className="notification-container">
      {notifications.map((notification) => (
        <NotificationItem 
          key={notification.id} 
          notification={notification} 
          onRemove={onRemove} 
        />
      ))}
    </div>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onRemove: (id: string) => void;
}

function NotificationItem({ notification, onRemove }: NotificationItemProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(() => onRemove(notification.id), 300);
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="notification-icon" />;
      case 'error':
        return <XCircle className="notification-icon" />;
      case 'warning':
        return <AlertTriangle className="notification-icon" />;
      case 'info':
      default:
        return <Info className="notification-icon" />;
    }
  };

  return (
    <div 
      className={`notification notification--${notification.type} ${
        isVisible ? 'notification--visible' : ''
      } ${isRemoving ? 'notification--removing' : ''}`}
    >
      <div className="notification-content">
        {getIcon()}
        <span className="notification-message">{notification.message}</span>
      </div>
      <button 
        onClick={handleRemove}
        className="notification-close"
        aria-label="Close notification"
      >
        <X size={16} />
      </button>
    </div>
  );
}
