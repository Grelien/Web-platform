import { useState } from 'react';
import { X, Plus } from 'lucide-react';

interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (deviceData: DeviceFormData) => void;
}

interface DeviceFormData {
  farmName: string;
  deviceName: string;
}

export function AddDeviceModal({ isOpen, onClose, onSubmit }: AddDeviceModalProps) {
  const [formData, setFormData] = useState<DeviceFormData>({
    farmName: '',
    deviceName: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.farmName || !formData.deviceName) {
      alert('Please fill in both Farm Name and Device Name');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await onSubmit(formData);
      
      setFormData({
        farmName: '',
        deviceName: ''
      });
      
      onClose();
    } catch (error) {
      console.error('Error adding device:', error);
      alert('Error adding device. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Simple modal implementation based on working IrrigationHistoryCard modal
  return (
    <div className={`modal-overlay ${isOpen ? 'visible' : ''}`} onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Plus size={20} />
            Add New Device
          </div>
          <button className="modal-close" onClick={onClose} disabled={isSubmitting}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit} className="device-form">
            <div className="form-group">
              <label htmlFor="farmName">
                Farm Name
              </label>
              <input
                type="text"
                id="farmName"
                name="farmName"
                value={formData.farmName}
                onChange={handleInputChange}
                placeholder="Enter farm name (e.g., Green Valley Farm)"
                required
              />
              <small>Name of the farm where the device will be installed</small>
            </div>

            <div className="form-group">
              <label htmlFor="deviceName">
                Device Name
              </label>
              <input
                type="text"
                id="deviceName"
                name="deviceName"
                value={formData.deviceName}
                onChange={handleInputChange}
                placeholder="Enter device name (e.g., Sensor Unit 1)"
                required
              />
              <small>Friendly name for the device</small>
            </div>

            <div className="modal-actions">
              <button 
                type="button" 
                className="btn btn--secondary"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className={`btn btn--primary ${isSubmitting ? 'loading' : ''}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Adding Device...' : 'Add Device'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}