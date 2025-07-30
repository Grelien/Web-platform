import { useState, useEffect } from 'react';
import { X, Plus, MapPin, Monitor, Wifi, Battery } from 'lucide-react';

interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (deviceData: DeviceFormData) => void;
}

interface DeviceFormData {
  deviceId: string;
  deviceName: string;
  location: string;
  deviceType: string;
  description: string;
  ipAddress: string;
  mqttTopic: string;
}

export function AddDeviceModal({ isOpen, onClose, onSubmit }: AddDeviceModalProps) {
  const [formData, setFormData] = useState<DeviceFormData>({
    deviceId: '',
    deviceName: '',
    location: '',
    deviceType: 'sensor',
    description: '',
    ipAddress: '',
    mqttTopic: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);


  // Handle ESC key press
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, isSubmitting, onClose]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Validate required fields
    if (!formData.deviceId || !formData.deviceName || !formData.location) {
      alert('Please fill in all required fields (Device ID, Device Name, and Location)');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await onSubmit(formData);
      
      // Reset form only after successful submission
      setFormData({
        deviceId: '',
        deviceName: '',
        location: '',
        deviceType: 'sensor',
        description: '',
        ipAddress: '',
        mqttTopic: ''
      });
      
      // Close modal only after successful submission
      onClose();
    } catch (error) {
      console.error('Error adding device:', error);
      alert('Error adding device. Please try again.');
      // Don't close modal on error - keep it open for user to retry
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateDeviceId = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    const deviceId = `agri_device_${timestamp}_${random}`;
    setFormData(prev => ({ ...prev, deviceId }));
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    console.log('Overlay clicked', e.target, e.currentTarget, e.target === e.currentTarget);
    
    // Prevent closing modal by clicking overlay while submitting
    if (isSubmitting) {
      console.log('Ignoring overlay click - currently submitting');
      return;
    }
    
    // Only close if clicking the overlay itself, not its children
    if (e.target === e.currentTarget) {
      console.log('Closing modal via overlay click');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <Plus className="modal-title-icon" />
            Add New Device
          </h2>
          <button className="modal-close-btn" onClick={onClose}>
            <X className="modal-close-icon" />
          </button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit} className="device-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="deviceId">
                  <Monitor className="form-icon" />
                  Device ID
                </label>
                <div className="input-with-button">
                  <input
                    type="text"
                    id="deviceId"
                    name="deviceId"
                    value={formData.deviceId}
                    onChange={handleInputChange}
                    placeholder="e.g., agri_device_001"
                    required
                  />
                  <button 
                    type="button" 
                    className="btn btn--secondary generate-btn"
                    onClick={generateDeviceId}
                  >
                    Generate
                  </button>
                </div>
                <small>Unique identifier for the device</small>
              </div>

              <div className="form-group">
                <label htmlFor="deviceName">
                  <Monitor className="form-icon" />
                  Device Name
                </label>
                <input
                  type="text"
                  id="deviceName"
                  name="deviceName"
                  value={formData.deviceName}
                  onChange={handleInputChange}
                  placeholder="e.g., Smart Farm Device #1"
                  required
                />
                <small>Friendly name for the device</small>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="location">
                  <MapPin className="form-icon" />
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g., Farm Sector A, Greenhouse 1"
                  required
                />
                <small>Physical location of the device</small>
              </div>

              <div className="form-group">
                <label htmlFor="deviceType">
                  <Battery className="form-icon" />
                  Device Type
                </label>
                <select
                  id="deviceType"
                  name="deviceType"
                  value={formData.deviceType}
                  onChange={handleInputChange}
                  required
                >
                  <option value="sensor">Sensor Node</option>
                  <option value="actuator">Actuator</option>
                  <option value="gateway">Gateway</option>
                  <option value="irrigation">Irrigation Controller</option>
                  <option value="monitoring">Monitoring Station</option>
                </select>
                <small>Type of IoT device</small>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Brief description of the device and its purpose..."
                rows={3}
                className="form-textarea"
              />
              <small>Optional description of the device</small>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="ipAddress">
                  <Wifi className="form-icon" />
                  IP Address
                </label>
                <input
                  type="text"
                  id="ipAddress"
                  name="ipAddress"
                  value={formData.ipAddress}
                  onChange={handleInputChange}
                  placeholder="e.g., 192.168.1.100"
                  pattern="^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$"
                />
                <small>Network IP address (optional)</small>
              </div>

              <div className="form-group">
                <label htmlFor="mqttTopic">
                  <Wifi className="form-icon" />
                  MQTT Topic Prefix
                </label>
                <input
                  type="text"
                  id="mqttTopic"
                  name="mqttTopic"
                  value={formData.mqttTopic}
                  onChange={handleInputChange}
                  placeholder="e.g., agri/sensors"
                />
                <small>MQTT topic prefix for this device</small>
              </div>
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