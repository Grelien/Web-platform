import { useState, useCallback } from 'react';
import { IoTProvider } from './contexts/IoTContext';
import { NotificationProvider, Header, Dashboard, ScheduleManager, Sidebar, AddDeviceModal } from './components';
import './App.css';
import './components/Sidebar.css';
import './components/AddDeviceModal.css';

export default function App() {
  // Test logging - this should always appear
  console.log('🎯 APP COMPONENT LOADED - TEST LOG');
  
  const [currentView, setCurrentView] = useState<'dashboard' | 'schedules'>('dashboard');
  const [isAddDeviceModalOpen, setIsAddDeviceModalOpen] = useState(false);
  
  console.log('🔍 App render - isAddDeviceModalOpen:', isAddDeviceModalOpen);

  const handleAddDevice = async (deviceData: any) => {
    console.log('🔄 App.handleAddDevice called - will NOT call onClose internally');
    
    try {
      console.log('Adding new device:', deviceData);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('✅ Device added successfully in App component:', deviceData);
      // DO NOT call setIsAddDeviceModalOpen(false) here - let modal handle it
      return Promise.resolve();
    } catch (error) {
      console.error('❌ Error adding device in App component:', error);
      throw error; // Re-throw to let modal handle the error
    }
  };

  const handleOpenModal = useCallback(() => {
    console.log('🔧 App.handleOpenModal called - setting modal to true');
    setIsAddDeviceModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    console.log('🔧 App.handleCloseModal called - setting modal to false');
    setIsAddDeviceModalOpen(false);
  }, []);

  return (
    <NotificationProvider>
      <IoTProvider>
        <div className="app">
          <Sidebar onAddDevice={handleOpenModal} />
          <div className="container">
            <Header />
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
