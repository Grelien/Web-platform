import { memo, useMemo } from 'react';
import { Thermometer, Droplets } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SensorCardProps {
  temperature: number | null;
  humidity: number | null;
  lastUpdated: Date;
  connected: boolean;
}

export const SensorCard = memo(function SensorCard({ 
  temperature, 
  humidity, 
  lastUpdated, 
  connected 
}: SensorCardProps) {
  // Memoize the last updated text calculation
  const lastUpdatedText = useMemo(() => {
    if (!temperature && !humidity) return 'No data yet';
    return `${formatDistanceToNow(lastUpdated)} ago`;
  }, [temperature, humidity, lastUpdated]);

  // Removed unused temperatureDisplay

  // Removed unused humidityDisplay

  // Memoize status indicator class
  const statusClass = useMemo(() => 
    `status-indicator ${connected ? 'connected' : 'disconnected'}`,
    [connected]
  );

  return (
    <div className="card">
      <h3 className="card-title">
        <div className={statusClass} />
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
                {temperature.toFixed(1)}
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
                {humidity.toFixed(1)}
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
        Last updated: <span className="sensor-timestamp">{lastUpdatedText}</span>
      </div>
    </div>
  );
});
