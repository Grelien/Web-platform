import { useState } from 'react';
import { Plus, TreePine, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface Device {
  id: string;
  farmName: string;
  deviceName: string;
  addedAt: string;
}

interface DevicePanelProps {
  devices: Device[];
  onRemoveDevice: (deviceId: string) => void;
  onAddDevice: () => void;
  maxDevices: number;
}

export function DevicePanel({ devices, onRemoveDevice, onAddDevice, maxDevices }: DevicePanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleRemoveDevice = (deviceId: string, farmName: string) => {
    if (window.confirm(`Remove device "${farmName}"?`)) {
      onRemoveDevice(deviceId);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isAtLimit = devices.length >= maxDevices;
  const remainingSlots = maxDevices - devices.length;

  return (
    <>
      {/* Device Panel Toggle Button */}
      <button
        className={`device-panel-toggle ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle device panel"
      >
        {isOpen ? <ChevronLeft className="toggle-icon" /> : <ChevronRight className="toggle-icon" />}
        <span className="device-count-indicator">{devices.length}</span>
      </button>

      {/* Device Panel Overlay */}
      {isOpen && (
        <div 
          className="device-panel-overlay"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Device Panel */}
      <div className={`device-panel ${isOpen ? 'open' : ''}`}>
        <div className="device-panel-header">
          <div className="header-content">
            <TreePine className="header-icon" />
            <div className="header-text">
              <h3>Farm Devices</h3>
              <span className="device-counter">
                {devices.length}/{maxDevices} devices
              </span>
            </div>
          </div>
        </div>

        <div className="device-panel-content">
          {devices.length === 0 ? (
            <div className="device-panel-empty">
              <TreePine className="empty-icon" size={48} />
              <h4>No Devices Added</h4>
              <p>Add your first farm device to start monitoring your agricultural operations.</p>
              <button className="btn btn--primary" onClick={onAddDevice}>
                <Plus size={20} />
                Add First Device
              </button>
            </div>
          ) : (
            <div className="device-cards-container">
              {devices.map((device) => (
                <div key={device.id} className="device-card">
                  <button 
                    className="device-remove-btn"
                    onClick={() => handleRemoveDevice(device.id, device.farmName)}
                    title="Remove device"
                  >
                    <X size={14} />
                  </button>
                  
                  <div className="device-card-icon">
                    <TreePine size={24} />
                  </div>
                  
                  <div className="device-card-content">
                    <h4 className="device-farm-name">{device.farmName}</h4>
                    <p className="device-name">{device.deviceName}</p>
                    <span className="device-date">Added {formatDate(device.addedAt)}</span>
                  </div>
                  
                  <div className="device-status">
                    <div className="status-indicator online"></div>
                    <span className="status-text">Online</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {remainingSlots > 0 && (
            <div className="slots-remaining">
              <span>{remainingSlots} slot{remainingSlots !== 1 ? 's' : ''} remaining</span>
            </div>
          )}
        </div>

        <div className="device-panel-footer">
          <button 
            className={`btn btn--primary add-device-btn ${isAtLimit ? 'disabled' : ''}`}
            onClick={onAddDevice}
            disabled={isAtLimit}
            type="button"
            title={isAtLimit ? 'Maximum devices reached' : 'Add new device'}
          >
            <Plus className="btn-icon" />
            <span>{isAtLimit ? 'Limit Reached' : 'Add Device'}</span>
          </button>
          
          {isAtLimit && (
            <div className="limit-notice">
              <small>Maximum devices reached. Remove a device to add new ones.</small>
            </div>
          )}
        </div>
      </div>
    </>
  );
}