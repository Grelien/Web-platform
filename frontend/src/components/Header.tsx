import { useIoT } from '../contexts/IoTContext';
import { useAuth } from '../hooks/useAuth';
import { Wifi, WifiOff, User } from 'lucide-react';

interface HeaderProps {
  onShowProfile?: () => void;
}

export function Header({ onShowProfile }: HeaderProps) {
  const { state } = useIoT();
  const { user } = useAuth();

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <div className="logo">
            <img src="/assets/logo.svg" alt="Grelien Logo" className="logo-image" />
          </div>
          <div className="header-text">
            <h1>Grelien Dashboard</h1>
            <p>Smart Agriculture Device Control & Monitoring</p>
          </div>
        </div>
        
        <div className="header-right">
          <div className="connection-status">
            <div className={`connection-indicator ${state.mqttConnected ? 'connected' : 'disconnected'}`}>
              {state.mqttConnected ? (
                <>
                  <Wifi className="connection-icon" />
                  <span>Connected to Device</span>
                </>
              ) : (
                <>
                  <WifiOff className="connection-icon" />
                  <span>Disconnected from Device</span>
                </>
              )}
            </div>
          </div>
          
          {user && onShowProfile && (
            <button 
              className="profile-button"
              onClick={onShowProfile}
              title="View Profile"
            >
              <User size={20} />
              <span>{user.firstName}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
