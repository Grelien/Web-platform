export interface SensorData {
  temperature: number | null;
  humidity: number | null;
  lastUpdated: Date;
}

export interface IrrigationEvent {
  id: string;
  timestamp: string;
  endTime: string;
  action: 'COMPLETED';
  source: 'manual' | 'schedule';
  duration: number; // in minutes
  scheduleId?: number | null;
  scheduleDetails?: {
    frequency: 'daily' | 'weekly';
    date?: string | null;
    time: string;
  };
}

export interface Schedule {
  id: number;
  time: string;
  date?: string; // Optional date field for one-time schedules
  action: 'on' | 'off';
  duration: number;
  frequency: 'daily' | 'weekly'; // Schedule frequency
  active: boolean;
  lastExecuted?: string;
  createdAt: string;
}

export interface SystemState {
  mqttConnected: boolean;
  motorState: boolean;
  sensorData: SensorData;
  schedules: Schedule[];
  logs: LogEntry[];
  irrigationHistory: IrrigationEvent[];
}

export interface LogEntry {
  time: string;
  message: string;
}

export interface SSEMessage {
  type: 'initial' | 'sensorData' | 'motorStatus' | 'heartbeat' | 'statusUpdate' | 'irrigationEvent';
  temperature?: number;
  humidity?: number;
  lastUpdated?: string;
  motorState?: boolean;
  mqttConnected?: boolean;
  deviceActive?: boolean;
  lastSensorDataTime?: string | null;
  timestamp?: string;
  sensorData?: SensorData;
  irrigationHistory?: IrrigationEvent[];
  event?: IrrigationEvent;
}

export interface MotorControlRequest {
  action: 'on' | 'off';
}

export interface ScheduleCreateRequest {
  time: string;
  action: 'on' | 'off';
  duration: number;
  isDaily?: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ConnectionStatus {
  connected: boolean;
  lastActivity: Date;
  reconnecting: boolean;
}

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
}
