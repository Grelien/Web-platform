import { useState, useCallback } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { IoTProvider } from './contexts/IoTContext';
import { useAuth } from './hooks/useAuth';
import { NotificationProvider, Header, Dashboard, ScheduleManager, DevicePanel, AddDeviceModal } from './components';
import { AuthContainer } from './components/AuthContainer';
import { UserProfile } from './components/UserProfile';
import './App.css';
import './components/DevicePanel.css';
import './components/AddDeviceModal.css';

interface Device {
  id: string;
  farmName: string;
  deviceName: string;
  addedAt: string;
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  
  const [currentView, setCurrentView] = useState<'dashboard' | 'schedules'>('dashboard');
  const [isAddDeviceModalOpen, setIsAddDeviceModalOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  
  const MAX_DEVICES = 10;
  
  console.log('🔍 App render - devices count:', devices.length);

  const handleAddDevice = async (deviceData: { farmName: string; deviceName: string }) => {
    console.log('🔄 App.handleAddDevice called');
    
    // Check device limit
    if (devices.length >= MAX_DEVICES) {
      throw new Error(`Maximum of ${MAX_DEVICES} devices allowed`);
    }
    
    try {
      console.log('Adding new device:', deviceData);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create new device with unique ID
      const newDevice: Device = {
        id: `device_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        farmName: deviceData.farmName,
        deviceName: deviceData.deviceName,
        addedAt: new Date().toISOString()
      };
      
      // Add device to state
      setDevices(prev => [...prev, newDevice]);
      
      console.log('✅ Device added successfully:', newDevice);
      return Promise.resolve();
    } catch (error) {
      console.error('❌ Error adding device:', error);
      throw error;
    }
  };

  const handleRemoveDevice = useCallback((deviceId: string) => {
    setDevices(prev => prev.filter(device => device.id !== deviceId));
    console.log('🗑️ Device removed:', deviceId);
  }, []);

  const handleOpenModal = useCallback(() => {
    if (devices.length >= MAX_DEVICES) {
      alert(`Maximum of ${MAX_DEVICES} devices allowed. Please remove a device before adding a new one.`);
      return;
    }
    console.log('🔧 App.handleOpenModal called');
    setIsAddDeviceModalOpen(true);
  }, [devices.length]);

  const handleCloseModal = useCallback(() => {
    console.log('🔧 App.handleCloseModal called');
    setIsAddDeviceModalOpen(false);
  }, []);

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Show authentication if not logged in
  if (!isAuthenticated) {
    return <AuthContainer />;
  }

  // Show main app if authenticated
  return (
    <NotificationProvider>
      <IoTProvider>
        <div className="app">
          {showProfile && <UserProfile />}
          
          <DevicePanel 
            devices={devices}
            onRemoveDevice={handleRemoveDevice}
            onAddDevice={handleOpenModal}
            maxDevices={MAX_DEVICES}
          />
          
          <div className="container">
            <Header onShowProfile={() => setShowProfile(!showProfile)} />
            <main className="main-content">
              {currentView === 'dashboard' ? (
                <Dashboard onShowSchedules={() => setCurrentView('schedules')} />
              ) : (
                <ScheduleManager onBackToDashboard={() => setCurrentView('dashboard')} />
              )}
            </main>
          </div>
          
          <AddDeviceModal
            isOpen={isAddDeviceModalOpen}
            onClose={handleCloseModal}
            onSubmit={handleAddDevice}
          />
        </div>
      </IoTProvider>
    </NotificationProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
