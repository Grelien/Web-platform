import { Thermometer, Droplets } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SensorCardProps {
  temperature: number | null;
  humidity: number | null;
  lastUpdated: Date;
  connected: boolean;
}

export function SensorCard({ temperature, humidity, lastUpdated, connected }: SensorCardProps) {
  const formatLastUpdated = () => {
    if (!temperature && !humidity) return 'No data yet';
    return `${formatDistanceToNow(lastUpdated)} ago`;
  };

  return (
    <div className="card">
      <h3 className="card-title">
        <div className={`status-indicator ${connected ? 'connected' : 'disconnected'}`} />
        Greenhouse Climate
      </h3>
      
      <div className="sensor-readings">
        <div className="sensor-reading">
          <div className="sensor-label">
            <Thermometer className="sensor-icon" />
            Temperature
          </div>
          <div className="sensor-value">
            {temperature !== null ? (
              <>
                {temperature}
                <span className="sensor-unit">°C</span>
              </>
            ) : (
              <>
                --
                <span className="sensor-unit">°C</span>
              </>
            )}
          </div>
        </div>
        
        <div className="sensor-reading">
          <div className="sensor-label">
            <Droplets className="sensor-icon" />
            Humidity
          </div>
          <div className="sensor-value">
            {humidity !== null ? (
              <>
                {humidity}
                <span className="sensor-unit">%</span>
              </>
            ) : (
              <>
                --
                <span className="sensor-unit">%</span>
              </>
            )}
          </div>
        </div>
      </div>
      
      <div className="sensor-footer">
        Last updated: <span className="sensor-timestamp">{formatLastUpdated()}</span>
      </div>
    </div>
  );
}
