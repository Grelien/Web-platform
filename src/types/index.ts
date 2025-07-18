export interface SensorData {
  temperature: number | null;
  humidity: number | null;
  lastUpdated: Date;
}

export interface Schedule {
  id: number;
  time: string;
  action: 'on' | 'off';
  duration: number;
  active: boolean;
  isDaily: boolean;
  lastExecuted?: string;
  createdAt: string;
}

export interface SystemState {
  mqttConnected: boolean;
  motorState: boolean;
  sensorData: SensorData;
  schedules: Schedule[];
  logs: LogEntry[];
}

export interface LogEntry {
  time: string;
  message: string;
}

export interface SSEMessage {
  type: 'initial' | 'sensorData' | 'motorStatus' | 'heartbeat' | 'statusUpdate';
  temperature?: number;
  humidity?: number;
  lastUpdated?: string;
  motorState?: boolean;
  mqttConnected?: boolean;
  deviceActive?: boolean;
  lastSensorDataTime?: string | null;
  timestamp?: string;
  sensorData?: SensorData;
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
