import { useState } from 'react';
import { IoTProvider } from './contexts/IoTContext';
import { NotificationProvider, Header, Dashboard, ScheduleManager, Sidebar, AddDeviceModal } from './components';
import './App.css';
import './components/Sidebar.css';
import './components/AddDeviceModal.css';

export default function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'schedules'>('dashboard');
  const [isAddDeviceModalOpen, setIsAddDeviceModalOpen] = useState(false);
  
  console.log('App render - isAddDeviceModalOpen:', isAddDeviceModalOpen);


  const handleAddDevice = async (deviceData: any) => {
    try {
      // TODO: Implement device registration logic
      console.log('Adding new device:', deviceData);
      // You can add API call here to register the device
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Success - modal will close automatically
      console.log('Device added successfully:', deviceData);
      return Promise.resolve(); // Explicitly return resolved promise
    } catch (error) {
      console.error('Error adding device:', error);
      // Handle error - maybe show notification
      throw error; // Re-throw to prevent modal from closing
    }
  };

  return (
    <NotificationProvider>
      <IoTProvider>
        <div className="app">
          <Sidebar onAddDevice={() => {
            console.log('onAddDevice called - setting modal to true');
            setIsAddDeviceModalOpen(true);
          }} />
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
            onClose={() => {
              console.log('Modal onClose called - setting modal to false');
              setIsAddDeviceModalOpen(false);
            }}
            onSubmit={handleAddDevice}
          />
        </div>
      </IoTProvider>
    </NotificationProvider>
  );
}
