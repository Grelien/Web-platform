import { useState } from 'react';
import { ChevronRight, Plus } from 'lucide-react';

interface SidebarProps {
  onAddDevice: () => void;
}

export function Sidebar({ onAddDevice }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleAddDeviceClick = (e: React.MouseEvent) => {
    console.log('Add Device button clicked');
    e.preventDefault();
    e.stopPropagation();
    
    // Close sidebar first
    setIsOpen(false);
    
    // Add a longer delay to ensure sidebar animation completes
    setTimeout(() => {
      console.log('Calling onAddDevice after timeout');
      onAddDevice();
    }, 200);
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