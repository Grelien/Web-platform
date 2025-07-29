import { useState } from 'react';
import { ChevronRight, Plus, Settings, Home, Monitor } from 'lucide-react';

interface SidebarProps {
  onAddDevice: () => void;
}

export function Sidebar({ onAddDevice }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleAddDeviceClick = (e: React.MouseEvent) => {
    console.log('Add Device button clicked');
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(false); // Close sidebar before opening modal
    setTimeout(() => {
      console.log('Calling onAddDevice after timeout');
      onAddDevice(); // Slight delay to ensure sidebar closes first
    }, 100);
  };

  return (
    <>
      {/* Sidebar Toggle Button */}
      <button
        className={`sidebar-toggle ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle sidebar"
      >
        <ChevronRight className="sidebar-toggle-icon" />
      </button>

      {/* Sidebar Overlay */}
      {isOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h3>Device Manager</h3>
        </div>

        <nav className="sidebar-nav">
          <a href="#" className="sidebar-nav-item active">
            <Home className="sidebar-nav-icon" />
            <span>Dashboard</span>
          </a>
          
          <a href="#" className="sidebar-nav-item">
            <Monitor className="sidebar-nav-icon" />
            <span>Devices</span>
          </a>
          
          <a href="#" className="sidebar-nav-item">
            <Settings className="sidebar-nav-icon" />
            <span>Settings</span>
          </a>
        </nav>

        <div className="sidebar-actions">
          <button 
            className="btn btn--primary add-device-btn"
            onClick={handleAddDeviceClick}
            type="button"
          >
            <Plus className="btn-icon" />
            <span>Add Device</span>
          </button>
        </div>
      </aside>
    </>
  );
}