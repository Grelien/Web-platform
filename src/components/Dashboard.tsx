import { useMemo, memo, useEffect, useState } from 'react';
import { useIoT } from '../contexts/IoTContext';
import { SensorCard, MotorControl, NextSchedule, IrrigationHistoryCard } from './index';

interface DashboardProps {
  onShowSchedules: () => void;
}

// Water droplet component for animation
const WaterDroplet = memo(function WaterDroplet({ 
  size, 
  position, 
  delay 
}: {
  size: 'small' | 'medium' | 'large';
  position: string;
  delay: number;
}) {
  return (
    <div 
      className={`water-droplet ${size} ${position}`}
      style={{ animationDelay: `${delay}s` }}
    />
  );
});

export const Dashboard = memo(function Dashboard({ onShowSchedules }: DashboardProps) {
  const { state } = useIoT();
  const [waterDroplets, setWaterDroplets] = useState<Array<{
    id: number;
    size: 'small' | 'medium' | 'large';
    position: string;
    delay: number;
  }>>([]);

  // Generate water droplets when motor is active
  useEffect(() => {
    if (state.motorState) {
      // Create initial set of droplets
      const droplets = [
        { id: 1, size: 'medium' as const, position: 'spawn-top-left', delay: 0 },
        { id: 2, size: 'small' as const, position: 'spawn-top-center', delay: 0.5 },
        { id: 3, size: 'large' as const, position: 'spawn-top-right', delay: 1 },
        { id: 4, size: 'medium' as const, position: 'spawn-middle-left', delay: 1.5 },
        { id: 5, size: 'small' as const, position: 'spawn-middle-right', delay: 2 },
        { id: 6, size: 'large' as const, position: 'spawn-center', delay: 2.5 },
      ];
      
      setWaterDroplets(droplets);

      // Continuously add new droplets while motor is active
      const interval = setInterval(() => {
        setWaterDroplets(prev => {
          const newDroplets = [
            ...prev,
            {
              id: Date.now() + Math.random(),
              size: ['small', 'medium', 'large'][Math.floor(Math.random() * 3)] as const,
              position: [
                'spawn-top-left',
                'spawn-top-center', 
                'spawn-top-right',
                'spawn-middle-left',
                'spawn-middle-right',
                'spawn-center'
              ][Math.floor(Math.random() * 6)],
              delay: 0
            }
          ];
          
          // Keep only last 20 droplets for performance
          return newDroplets.slice(-20);
        });
      }, 800); // Add new droplet every 800ms

      return () => clearInterval(interval);
    } else {
      // Clear droplets when motor stops
      setWaterDroplets([]);
    }
  }, [state.motorState]);

  // Memoize sensor props to prevent unnecessary re-renders
  const sensorProps = useMemo(() => ({
    temperature: state.sensorData.temperature,
    humidity: state.sensorData.humidity,
    lastUpdated: state.sensorData.lastUpdated,
    connected: state.mqttConnected
  }), [
    state.sensorData.temperature,
    state.sensorData.humidity,
    state.sensorData.lastUpdated,
    state.mqttConnected
  ]);

  // Memoize schedule props
  const scheduleProps = useMemo(() => ({
    schedules: state.schedules,
    onShowSchedules
  }), [state.schedules, onShowSchedules]);

  return (
    <div className="dashboard">
      <div className={`dashboard-grid ${state.motorState ? 'motor-active' : ''}`}>
        {/* Water Animation Container - Only when motor is active */}
        {state.motorState && (
          <div className="water-animation-container">
            {waterDroplets.map((droplet) => (
              <WaterDroplet
                key={droplet.id}
                size={droplet.size}
                position={droplet.position}
                delay={droplet.delay}
              />
            ))}
            
            {/* Water flow lines connecting cards */}
            <div 
              className="water-flow-line"
              style={{
                top: '30%',
                left: '10%',
                width: '35%',
                animationDelay: '0.5s'
              }}
            />
            <div 
              className="water-flow-line"
              style={{
                top: '30%',
                left: '55%',
                width: '35%',
                animationDelay: '1s'
              }}
            />
            <div 
              className="water-flow-line"
              style={{
                top: '65%',
                left: '20%',
                width: '60%',
                animationDelay: '1.5s'
              }}
            />
          </div>
        )}

        <div className="sensor-card">
          <SensorCard {...sensorProps} />
        </div>
        <div className="motor-control">
          <MotorControl motorState={state.motorState} />
        </div>
        <div className="next-schedule">
          <NextSchedule {...scheduleProps} />
        </div>
        <div className="irrigation-history-card">
          <IrrigationHistoryCard />
        </div>
      </div>
    </div>
  );
});


