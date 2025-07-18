import { useState } from 'react';
import { useIoT } from '../contexts/IoTContext';
import { Power, Square } from 'lucide-react';

interface MotorControlProps {
  motorState: boolean;
}

export function MotorControl({ motorState }: MotorControlProps) {
  const { controlMotor } = useIoT();
  const [isLoading, setIsLoading] = useState(false);

  const handleMotorControl = async (action: 'on' | 'off') => {
    setIsLoading(true);
    try {
      await controlMotor(action);
    } catch (error) {
      console.error('Motor control error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card">
      <h3 className="card-title">
        <Power className="card-icon" />
        Motor Controller
      </h3>
      
      <div className="motor-status">
        <div className="motor-status-label">Status</div>
        <div className={`motor-status-value ${motorState ? 'on' : 'off'}`}>
          {motorState ? 'ON' : 'OFF'}
        </div>
      </div>
      
      <div className="motor-controls">
        <button 
          className={`motor-btn motor-btn--on ${isLoading ? 'loading' : ''}`}
          onClick={() => handleMotorControl('on')}
          disabled={isLoading || motorState}
        >
          <Power size={20} />
          TURN ON
        </button>
        
        <button 
          className={`motor-btn motor-btn--off ${isLoading ? 'loading' : ''}`}
          onClick={() => handleMotorControl('off')}
          disabled={isLoading || !motorState}
        >
          <Square size={20} />
          TURN OFF
        </button>
      </div>
    </div>
  );
}
