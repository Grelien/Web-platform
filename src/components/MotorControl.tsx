import { useState, memo, useCallback, useMemo } from 'react';
import { useIoT } from '../contexts/IoTContext';
import { Power, Square } from 'lucide-react';

interface MotorControlProps {
  motorState: boolean;
}

export const MotorControl = memo(function MotorControl({ motorState }: MotorControlProps) {
  const { controlMotor } = useIoT();
  const [isLoading, setIsLoading] = useState(false);

  // Memoized motor control handler
  const handleMotorControl = useCallback(async (action: 'on' | 'off') => {
    setIsLoading(true);
    try {
      await controlMotor(action);
    } catch (error) {
      console.error('Motor control error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [controlMotor]);

  // Memoized status display
  const statusDisplay = useMemo(() => ({
    text: motorState ? 'ON' : 'OFF',
    className: `motor-status-value ${motorState ? 'on' : 'off'}`
  }), [motorState]);

  // Memoized button states
  const buttonStates = useMemo(() => ({
    onButton: {
      className: `motor-btn motor-btn--on ${isLoading ? 'loading' : ''}`,
      disabled: isLoading || motorState,
      onClick: () => handleMotorControl('on')
    },
    offButton: {
      className: `motor-btn motor-btn--off ${isLoading ? 'loading' : ''}`,
      disabled: isLoading || !motorState,
      onClick: () => handleMotorControl('off')
    }
  }), [isLoading, motorState, handleMotorControl]);

  return (
    <div className="card">
      <h3 className="card-title">
        <Power className="card-icon" />
        Motor Controller
      </h3>
      
      <div className="motor-status">
        <div className="motor-status-label">Status</div>
        <div className={statusDisplay.className}>
          {statusDisplay.text}
        </div>
      </div>
      
      <div className="motor-controls">
        <button 
          className={buttonStates.onButton.className}
          onClick={buttonStates.onButton.onClick}
          disabled={buttonStates.onButton.disabled}
        >
          <Power size={20} />
          TURN ON
        </button>
        
        <button 
          className={buttonStates.offButton.className}
          onClick={buttonStates.offButton.onClick}
          disabled={buttonStates.offButton.disabled}
        >
          <Square size={20} />
          TURN OFF
        </button>
      </div>
    </div>
  );
});
