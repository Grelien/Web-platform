import { useIoT } from '../contexts/IoTContext';
import { SensorCard, MotorControl, NextSchedule } from './index';



interface DashboardProps {
  onShowSchedules: () => void;
}

export function Dashboard({ onShowSchedules }: DashboardProps) {
  const { state } = useIoT();

  return (
    <div className="dashboard">
      <div className="dashboard-grid">
        <SensorCard 
          temperature={state.sensorData.temperature}
          humidity={state.sensorData.humidity}
          lastUpdated={state.sensorData.lastUpdated}
          connected={state.mqttConnected}
        />
        <MotorControl 
          motorState={state.motorState}
        />
        <NextSchedule 
          schedules={state.schedules}
          onShowSchedules={onShowSchedules}
        />
      </div>
    </div>
  );
}
