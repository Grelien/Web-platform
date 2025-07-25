import { useIoT } from '../contexts/IoTContext';
import { Wifi, WifiOff } from 'lucide-react';

export function Header() {
  const { state } = useIoT();

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
      </div>
    </header>
  );
}
