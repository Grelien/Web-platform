import { useMemo, memo } from 'react';
import { useIoT } from '../contexts/IoTContext';
import { SensorCard, MotorControl, NextSchedule, IrrigationHistoryCard } from './index';

interface DashboardProps {
  onShowSchedules: () => void;
}

export const Dashboard = memo(function Dashboard({ onShowSchedules }: DashboardProps) {
  const { state } = useIoT();

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
      <div className="dashboard-grid">
        <SensorCard {...sensorProps} />
        <MotorControl motorState={state.motorState} />
        <NextSchedule {...scheduleProps} />
        <IrrigationHistoryCard />
      </div>
    </div>
  );
});


