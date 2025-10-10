import { useState, useCallback, useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { IoTProvider } from './contexts/IoTContext';
import { useAuth } from './hooks/useAuth';
import { NotificationProvider, Header, Dashboard, ScheduleManager, DevicePanel, AddDeviceModal } from './components';
import { AuthContainer } from './components/AuthContainer';
import { UserProfile } from './components/UserProfile';
import './App.css';
import './components/DevicePanel.css';
import './components/AddDeviceModal.css';

const API_BASE_URL = 'http://localhost:3000/api';

interface Device {
  _id: string;
  farmName: string;
  deviceName: string;
  createdAt: string;
  userId: string;
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  const [currentView, setCurrentView] = useState<'dashboard' | 'schedules'>('dashboard');
  const [isAddDeviceModalOpen, setIsAddDeviceModalOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);

  const MAX_DEVICES = 10;

  console.log('🔍 App render - devices count:', devices.length);

  // Fetch devices when user logs in
  useEffect(() => {
    if (isAuthenticated) {
      fetchDevices();
    } else {
      // Clear devices when user logs out
      setDevices([]);
    }
  }, [isAuthenticated]);

  const fetchDevices = async () => {
    setIsLoadingDevices(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/farms`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const { data } = await response.json();
        setDevices(data);
        console.log('✅ Devices fetched:', data.length);
      } else {
        console.error('Failed to fetch devices');
      }
    } catch (error) {
      console.error('❌ Error fetching devices:', error);
    } finally {
      setIsLoadingDevices(false);
    }
  };

  const handleAddDevice = async (deviceData: { farmName: string; deviceName: string }) => {
    console.log('🔄 App.handleAddDevice called');

    // Check device limit
    if (devices.length >= MAX_DEVICES) {
      throw new Error(`Maximum of ${MAX_DEVICES} devices allowed`);
    }

    try {
      console.log('Adding new device:', deviceData);

      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/farms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(deviceData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add device');
      }

      const { data } = await response.json();

      // Add device to state
      setDevices(prev => [...prev, data]);

      console.log('✅ Device added successfully:', data);
      return Promise.resolve();
    } catch (error) {
      console.error('❌ Error adding device:', error);
      throw error;
    }
  };

  const handleRemoveDevice = useCallback(async (deviceId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/farms/${deviceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to remove device');
      }

      setDevices(prev => prev.filter(device => device._id !== deviceId));
      console.log('🗑️ Device removed:', deviceId);
    } catch (error) {
      console.error('❌ Error removing device:', error);
      throw error;
    }
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
            devices={devices.map(d => ({
              id: d._id,
              farmName: d.farmName,
              deviceName: d.deviceName,
              addedAt: d.createdAt
            }))}
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
