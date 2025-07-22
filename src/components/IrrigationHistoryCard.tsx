import { useState, useMemo, useCallback, memo } from 'react';
import { useIoT } from '../contexts/IoTContext';
import './IrrigationHistoryCard.css';

type FilterType = 'all' | 'manual' | 'schedule';

export const IrrigationHistoryCard = memo(function IrrigationHistoryCard() {
  const { state } = useIoT();
  const [filter, setFilter] = useState<FilterType>('all');
  const [displayCount, setDisplayCount] = useState(10);

  // Memoized filtered events for performance
  const filteredEvents = useMemo(() => {
    const allEvents = [...state.irrigationHistory];
    
    if (filter === 'all') return allEvents;
    return allEvents.filter(event => event.source === filter);
  }, [state.irrigationHistory, filter]);

  // Memoized display events
  const displayEvents = useMemo(() => 
    filteredEvents.slice(0, displayCount), 
    [filteredEvents, displayCount]
  );

  // Optimized timestamp formatting with memoization
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

  // Optimized source handlers
  const getSourceIcon = useCallback((source: string) => {
    switch (source) {
      case 'manual': return '👤';
      case 'schedule': return '⏰';
      default: return '📡';
    }
  }, []);

  const getSourceLabel = useCallback((source: string) => {
    switch (source) {
      case 'manual': return 'Manual';
      case 'schedule': return 'Schedule';
      default: return source;
    }
  }, []);

  const loadMoreEvents = useCallback(() => {
    setDisplayCount(prev => prev + 10);
  }, []);

  const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilter(e.target.value as FilterType);
    setDisplayCount(10); // Reset count when filter changes
  }, []);

  return (
    <div className="card irrigation-history-card">
      <div className="card-controls">
        <select 
          value={filter} 
          onChange={handleFilterChange}
          className="filter-select-mini"
        >
          <option value="all">All Events</option>
          <option value="manual">Manual</option>
          <option value="schedule">Scheduled</option>
        </select>
      </div>

      <div className="history-list-container">
        {displayEvents.length === 0 ? (
          <div className="no-events">
            <div className="no-events-icon">📋</div>
            <p>No irrigation events yet</p>
            <span>Events will appear here when motor control is used</span>
          </div>
        ) : (
          <div className="history-list">
            {displayEvents.map((event) => {
              const { date, time } = formatTimestamp(event.timestamp);
              const endTime = event.endTime ? 
                new Date(event.endTime).toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: true 
                }) : null;
              
              return (
              <div key={event.id} className="history-event">
                <div className="event-indicator">
                  <div 
                    className="action-indicator completed"
                    style={{ backgroundColor: '#10b981' }}
                  >
                    ✓
                  </div>
                </div>
                
                <div className="event-content">
                  <div className="event-main-info">
                    <div className="event-date">{date}</div>
                    <div className="event-timing">
                      <span className="start-time">🕐 Start: {time}</span>
                      {endTime && (
                        <span className="end-time">🕑 End: {endTime}</span>
                      )}
                      <span className="duration">⏱️ Duration: {event.duration} min</span>
                    </div>
                  </div>
                  
                  <div className="event-secondary-info">
                    <div className="event-source-mini">
                      <span className="source-icon">{getSourceIcon(event.source)}</span>
                      <span className="source-label">{getSourceLabel(event.source)}</span>
                      {event.scheduleDetails && (
                        <span className="schedule-info">
                          ({event.scheduleDetails.frequency}
                          {event.scheduleDetails.date && ` - ${new Date(event.scheduleDetails.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              );
            })}
            
            {filteredEvents.length > displayCount && (
              <button 
                onClick={loadMoreEvents}
                className="load-more-btn"
              >
                Load More ({filteredEvents.length - displayCount} remaining)
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
