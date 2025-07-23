import { useState, useMemo, useCallback, memo } from 'react';
import { useIoT } from '../contexts/IoTContext';
import type { IrrigationEvent } from '../types';
import './IrrigationHistoryCard.css';
import { BarChart3, Zap, Settings, Droplets } from 'lucide-react';

type SectionType = 'all' | 'schedule' | 'manual';

interface HistoryModalProps {
  sectionType: SectionType;
  events: IrrigationEvent[];
  isVisible: boolean;
  onClose: () => void;
}

const HistoryModal = memo(function HistoryModal({ 
  sectionType, 
  events, 
  isVisible, 
  onClose 
}: HistoryModalProps) {
  const getSectionDetails = useCallback(() => {
    switch (sectionType) {
      case 'schedule':
        return {
          title: 'Scheduled Irrigation History',
          icon: '⏰',
          description: 'Automated irrigation events triggered by schedules'
        };
      case 'manual':
        return {
          title: 'Manual Irrigation History',
          icon: '👤',
          description: 'User-initiated irrigation events'
        };
      default:
        return {
          title: 'Complete Irrigation History',
          icon: '📊',
          description: 'All irrigation events (scheduled and manual)'
        };
    }
  }, [sectionType]);

  const formatTimestamp = useCallback((timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })
    };
  }, []);

  const getEventIcon = useCallback((source: string) => {
    switch (source) {
      case 'manual': return '👤';
      case 'schedule': return '⏰';
      default: return '📡';
    }
  }, []);

  const sectionDetails = getSectionDetails();

  return (
    <div className={`modal-overlay ${isVisible ? 'visible' : ''}`} onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <span>{sectionDetails.icon}</span>
            {sectionDetails.title}
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <p style={{ 
            color: 'var(--text-secondary)', 
            marginBottom: 'var(--spacing-lg)',
            fontSize: '0.9rem'
          }}>
            {sectionDetails.description} ({events.length} events)
          </p>

          {events.length === 0 ? (
            <div className="no-events">
              <div className="no-events-icon">{sectionDetails.icon}</div>
              <p>No {sectionType === 'all' ? '' : sectionType} events found</p>
              <span>
                {sectionType === 'schedule' 
                  ? 'Scheduled irrigation events will appear here when created'
                  : sectionType === 'manual'
                  ? 'Manual irrigation events will appear here when you control the motor'
                  : 'Irrigation events will appear here when motor control is used'
                }
              </span>
            </div>
          ) : (
            <div className="history-list">
              {events.map((event) => {
                const { date, time } = formatTimestamp(event.timestamp);
                const endTime = event.endTime ? 
                  new Date(event.endTime).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: true 
                  }) : null;
                
                const eventClass = `history-event ${sectionType}`;
                
                return (
                  <div key={event.id} className={eventClass}>
                    <div className="event-indicator">
                      <div 
                        className={`action-indicator ${
                          event.source === 'manual' ? 'manual' : 
                          event.source === 'schedule' ? 'schedule' : 
                          'completed'
                        }`}
                      >
                        {event.action === 'COMPLETED' ? '✓' : 
                         event.source === 'manual' ? '👤' : '⏰'}
                      </div>
                    </div>
                    
                    <div className="event-content">
                      <div className="event-date">{date}</div>
                      <div className="event-timing">
                        <span className="start-time">🕐 {time}</span>
                        {endTime && (
                          <span className="end-time">🕑 {endTime}</span>
                        )}
                        {event.duration && (
                          <span className="duration">⏱️ {event.duration}min</span>
                        )}
                      </div>
                      
                      <div className="event-source">
                        <span>{getEventIcon(event.source)}</span>
                        <span className="source-label">
                          {event.source.charAt(0).toUpperCase() + event.source.slice(1)}
                        </span>
                        {event.scheduleDetails && (
                          <span style={{ 
                            fontSize: '0.75rem', 
                            color: 'var(--text-muted)',
                            marginLeft: 'var(--spacing-xs)'
                          }}>
                            ({event.scheduleDetails.frequency}
                            {event.scheduleDetails.date && ` - ${new Date(event.scheduleDetails.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="event-time">
                      {event.sensorData && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {event.sensorData.temperature}°C<br/>
                          {event.sensorData.humidity}%
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export const IrrigationHistoryCard = memo(function IrrigationHistoryCard() {
  const { state } = useIoT();
  const [modalSection, setModalSection] = useState<SectionType | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Calculate stats for all sections with modern lucide icons
  const sectionStats = useMemo(() => {
    const allEvents = state.irrigationHistory;
    const manualEvents = allEvents.filter(e => e.source === 'manual');
    const scheduleEvents = allEvents.filter(e => e.source === 'schedule');
    
    return {
      all: {
        count: allEvents.length,
        icon: 'BarChart3', // Lucide icon for analytics/comprehensive data
        label: 'All events',
        //subtitle: 'All events',
        events: allEvents
      },
      schedule: {
        count: scheduleEvents.length,
        icon: 'Zap', // Lucide icon for automation/AI-driven systems
        label: 'Automated',
        //subtitle: 'Automated',
        events: scheduleEvents
      },
      manual: {
        count: manualEvents.length,
        icon: 'Settings', // Lucide icon for user control/manual interface
        label: 'User Control',
       // subtitle: 'Manual control',
        events: manualEvents
      }
    };
  }, [state.irrigationHistory]);

  // Section double-click handler
  const handleSectionDoubleClick = useCallback((section: SectionType) => {
    setModalSection(section);
    setIsModalVisible(true);
  }, []);

  // Modal close handler
  const handleCloseModal = useCallback(() => {
    setIsModalVisible(false);
    setTimeout(() => setModalSection(null), 300); // Delay to allow animation
  }, []);

  return (
    <>
      <div className="card irrigation-history-card">
        <div className="card-header">
          <div className="card-title">
            <Droplets className="card-icon" size={20} />
            <h3>Irrigation History</h3>
          </div>
        </div>

        {/* Three Section Cards - Main Interface */}
        <div className="history-sections">
          {(Object.keys(sectionStats) as SectionType[]).map((section) => {
            const stats = sectionStats[section];
            const IconComponent = stats.icon === 'BarChart3' ? BarChart3 : 
                               stats.icon === 'Zap' ? Zap : Settings;
            
            return (
              <div
                key={section}
                className={`section-card ${section}`}
                onDoubleClick={() => handleSectionDoubleClick(section)}
              >
                <div className="section-icon">
                  <IconComponent size={24} />
                </div>
                <div className="section-content">
                  <div className="section-label">{stats.label}</div>
                  <div className="section-count">{stats.count}</div>
                  <div className="section-subtitle">{stats.subtitle}</div>
                  <div className="section-hint">Double-click to view details</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* History Modal */}
      {modalSection && (
        <HistoryModal
          sectionType={modalSection}
          events={sectionStats[modalSection].events}
          isVisible={isModalVisible}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
});
