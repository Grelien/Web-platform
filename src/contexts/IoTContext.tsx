import { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { SystemState, SSEMessage, Schedule, LogEntry, SensorData } from '../types';

interface IoTContextType {
  state: SystemState;
  controlMotor: (action: 'on' | 'off') => Promise<void>;
  addSchedule: (scheduleData: Omit<Schedule, 'id' | 'createdAt'>) => Promise<void>;
  deleteSchedule: (id: number) => Promise<void>;
  connectionStatus: {
    connected: boolean;
    reconnecting: boolean;
    error: string | null;
  };
}
import { useSSEConnection } from '../hooks/useSSEConnection';
import { useNotifications } from '../hooks/useNotifications';


const initialState: SystemState = {
  mqttConnected: false,
  motorState: false,
  sensorData: {
    temperature: null,
    humidity: null,
    lastUpdated: new Date(0)
  },
  schedules: [],
  logs: []
};

type IoTAction =
  | { type: 'SET_SENSOR_DATA'; payload: SensorData }
  | { type: 'SET_MOTOR_STATE'; payload: boolean }
  | { type: 'SET_MQTT_CONNECTION'; payload: boolean }
  | { type: 'SET_SCHEDULES'; payload: Schedule[] }
  | { type: 'ADD_SCHEDULE'; payload: Schedule }
  | { type: 'REMOVE_SCHEDULE'; payload: number }
  | { type: 'ADD_LOG'; payload: LogEntry };

function iotReducer(state: SystemState = initialState, action: IoTAction): SystemState {
  console.log('Reducer action:', action.type, action.payload); // Debug log
  switch (action.type) {
    case 'SET_SENSOR_DATA':
      console.log('Setting sensor data:', action.payload); // Debug log
      return {
        ...state,
        sensorData: action.payload
      };
    case 'SET_MOTOR_STATE':
      return {
        ...state,
        motorState: action.payload
      };
    case 'SET_MQTT_CONNECTION':
      return {
        ...state,
        mqttConnected: action.payload
      };
    case 'SET_SCHEDULES':
      return {
        ...state,
        schedules: action.payload
      };
    case 'ADD_SCHEDULE':
      return {
        ...state,
        schedules: [...state.schedules, action.payload]
      };
    case 'REMOVE_SCHEDULE':
      return {
        ...state,
        schedules: state.schedules.filter(s => s.id !== action.payload)
      };
    case 'ADD_LOG':
      return {
        ...state,
        logs: [...state.logs, action.payload]
      };
    default:
      return state;
  }
}

const IoTContext = createContext<IoTContextType | undefined>(undefined);

export function IoTProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(iotReducer, initialState);
  const { addNotification } = useNotifications();

  function handleSSEMessage(message: SSEMessage) {
    console.log('SSE Message received:', message); // Debug log
    switch (message.type) {
      case 'initial': {
        console.log('Processing initial message:', message.sensorData); // Debug log
        if (message.sensorData) {
          dispatch({
            type: 'SET_SENSOR_DATA',
            payload: {
              temperature: typeof message.sensorData.temperature === 'number' ? message.sensorData.temperature : null,
              humidity: typeof message.sensorData.humidity === 'number' ? message.sensorData.humidity : null,
              lastUpdated: message.sensorData.lastUpdated ? new Date(message.sensorData.lastUpdated) : new Date()
            }
          });
        }
        if (message.motorState !== undefined) {
          dispatch({ type: 'SET_MOTOR_STATE', payload: message.motorState });
        }
        if (message.mqttConnected !== undefined) {
          dispatch({ type: 'SET_MQTT_CONNECTION', payload: message.mqttConnected });
        }
        break;
      }
      case 'sensorData': {
        console.log('Processing sensorData message:', message); // Debug log
        dispatch({
          type: 'SET_SENSOR_DATA',
          payload: {
            temperature: typeof message.temperature === 'number' ? message.temperature : null,
            humidity: typeof message.humidity === 'number' ? message.humidity : null,
            lastUpdated: message.lastUpdated ? new Date(message.lastUpdated) : new Date()
          }
        });
        dispatch({
          type: 'ADD_LOG',
          payload: {
            time: new Date().toISOString(),
            message: `Sensor data updated: ${message.temperature ?? '--'}°C, ${message.humidity ?? '--'}%`
          }
        });
        break;
      }
      case 'motorStatus': {
        if (message.motorState !== undefined) {
          dispatch({ type: 'SET_MOTOR_STATE', payload: message.motorState });
          dispatch({
            type: 'ADD_LOG',
            payload: {
              time: new Date().toISOString(),
              message: `Motor status: ${message.motorState ? 'ON' : 'OFF'}`
            }
          });
        }
        break;
      }
      case 'statusUpdate': {
        console.log('Processing statusUpdate message:', message); // Debug log
        if (message.mqttConnected !== undefined) {
          dispatch({ type: 'SET_MQTT_CONNECTION', payload: message.mqttConnected });
          dispatch({
            type: 'ADD_LOG',
            payload: {
              time: new Date().toISOString(),
              message: `Device ${message.mqttConnected ? 'connected' : 'disconnected'}`
            }
          });
        }
        break;
      }

      case 'heartbeat': {
        // Just maintain connection
        break;
      }
      default:
        break;
    }
  }

  const { connectionStatus } = useSSEConnection({
    onMessage: handleSSEMessage,
    onConnectionChange: (connected: boolean) => {
      // Don't update mqttConnected here - it should only be set by device status messages
      console.log('SSE connection status changed:', connected);
    }
  });

  async function controlMotor(action: 'on' | 'off'): Promise<void> {
    try {
      const response = await fetch('/api/motor/control', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      const result = await response.json();
      
      if (result.success) {
        dispatch({ type: 'SET_MOTOR_STATE', payload: action === 'on' });
        addNotification({
          type: 'success',
          message: `Motor turned ${action.toUpperCase()}`
        });
        dispatch({
          type: 'ADD_LOG',
          payload: {
            time: new Date().toISOString(),
            message: `Manual motor control: ${action.toUpperCase()}`
          }
        });
      } else {
        throw new Error(result.error || 'Failed to control motor');
      }
    } catch (error) {
      addNotification({
        type: 'error',
        message: `Failed to control motor: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      throw error;
    }
  }

  async function addSchedule(scheduleData: Omit<Schedule, 'id' | 'createdAt'>): Promise<void> {
    try {
      const response = await fetch('/api/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          time: scheduleData.time,
          action: scheduleData.action,
          duration: scheduleData.duration,
          isDaily: scheduleData.isDaily
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        dispatch({ type: 'ADD_SCHEDULE', payload: result.data });
        addNotification({
          type: 'success',
          message: `${scheduleData.isDaily ? 'Daily' : 'One-time'} schedule created successfully!`
        });
        dispatch({
          type: 'ADD_LOG',
          payload: {
            time: new Date().toISOString(),
            message: `Schedule added: ${scheduleData.action.toUpperCase()} at ${scheduleData.time}`
          }
        });
      } else {
        throw new Error(result.error || 'Failed to create schedule');
      }
    } catch (error) {
      addNotification({
        type: 'error',
        message: `Failed to create schedule: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      throw error;
    }
  }

  async function deleteSchedule(id: number): Promise<void> {
    try {
      const response = await fetch(`/api/schedules/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      
      if (result.success) {
        dispatch({ type: 'REMOVE_SCHEDULE', payload: id });
        addNotification({
          type: 'success',
          message: 'Schedule deleted successfully!'
        });
        dispatch({
          type: 'ADD_LOG',
          payload: {
            time: new Date().toISOString(),
            message: `Schedule deleted (ID: ${id})`
          }
        });
      } else {
        throw new Error(result.error || 'Failed to delete schedule');
      }
    } catch (error) {
      addNotification({
        type: 'error',
        message: `Failed to delete schedule: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      throw error;
    }
  }

  // Load initial schedules
  useEffect(() => {
    async function loadSchedules() {
      try {
        const response = await fetch('/api/schedules');
        const result = await response.json();
        
        if (result.success) {
          dispatch({ type: 'SET_SCHEDULES', payload: result.data });
        }
      } catch (error) {
        console.error('Failed to load schedules:', error);
      }
    }

    loadSchedules();
  }, []);

  const contextValue: IoTContextType = {
    state,
    controlMotor,
    addSchedule,
    deleteSchedule,
    connectionStatus
  };

  return (
    <IoTContext.Provider value={contextValue}>
      {children}
    </IoTContext.Provider>
  );
}

export function useIoT(): IoTContextType {
  const context = useContext(IoTContext);
  if (context === undefined) {
    throw new Error('useIoT must be used within an IoTProvider');
  }
  return context;
}
