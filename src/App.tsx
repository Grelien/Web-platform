import { useState } from 'react';
import { IoTProvider } from './contexts/IoTContext';
import { NotificationProvider, Header, Dashboard, ScheduleManager } from './components';
import './App.css';

export default function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'schedules'>('dashboard');

  return (
    <NotificationProvider>
      <IoTProvider>
        <div className="app">
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
        </div>
      </IoTProvider>
    </NotificationProvider>
  );
}
