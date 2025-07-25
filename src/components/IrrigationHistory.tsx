import { useState, useEffect } from 'react';
import { useIoT } from '../contexts/IoTContext';
import type { IrrigationEvent } from '../types';
import './IrrigationHistory.css';

interface IrrigationHistoryProps {
  onBackToDashboard?: () => void;
  embedded?: boolean;
}

export default function IrrigationHistory({ onBackToDashboard, embedded = false }: IrrigationHistoryProps) {
  const { state } = useIoT();
  const [fullHistory, setFullHistory] = useState<IrrigationEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<'all' | 'manual' | 'schedule'>('all');

  // Load full history from API
  const loadHistory = async (page: number = 1) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/irrigation-history?limit=20&page=${page}`);
      const data = await response.json();
      
      if (data.success) {
        setFullHistory(data.data.history);
        setTotalPages(data.data.totalPages);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Failed to load irrigation history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory(1);
  }, []);

  // Combine recent events from state with loaded history
  const allEvents = [...state.irrigationHistory, ...fullHistory];
  const uniqueEvents = allEvents.filter((event, index, arr) => 
    arr.findIndex(e => e.id === event.id) === index
  );

  // Filter events
  const filteredEvents = uniqueEvents.filter(event => {
    if (filter === 'all') return true;
    if (filter === 'manual') return event.source === 'manual';
    if (filter === 'schedule') return event.source === 'schedule';
    return true;
  });

  // Limit events when embedded in dashboard
  const displayEvents = embedded ? filteredEvents.slice(0, 5) : filteredEvents;

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'manual': return '🎮';
      case 'schedule': return '⏰';
      default: return '📡';
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'manual': return 'Manual Control';
      case 'schedule': return 'Scheduled';
      default: return source;
    }
  };

  const getActionColor = (action: string) => {
    return action === 'ON' ? '#10b981' : '#ef4444';
  };

  return (
    <div className={`irrigation-history ${embedded ? 'embedded' : ''}`}>
      {!embedded && (
        <div className="irrigation-history-header">
          <button className="back-button" onClick={onBackToDashboard}>
            <span style={{ fontSize: '1rem' }}>←</span> Back to Dashboard
          </button>
          <h2>
            <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>💧</span>
            Irrigation History
          </h2>
        </div>
      )}

      {!embedded && (
        <div className="filter-controls">
          <label>
            <span style={{ fontSize: '1rem', marginRight: '0.5rem' }}>🔍</span>
            Filter by source:
          </label>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="filter-select"
          >
            <option value="all">📈 All Events</option>
            <option value="manual">🎮 Manual Control</option>
            <option value="schedule">⏰ Scheduled</option>
          </select>
        </div>
      )}

      {!embedded && (
        <div className="history-stats">
          <div className="stat-card">
            <span className="stat-icon">📊</span>
            <span className="stat-label">Total Sessions</span>
            <span className="stat-value">{filteredEvents.length}</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">✅</span>
            <span className="stat-label">Completed</span>
            <span className="stat-value" style={{ color: '#10b981' }}>
              {filteredEvents.filter(e => e.action === 'COMPLETED').length}
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">⏱️</span>
            <span className="stat-label">Total Duration</span>
            <span className="stat-value" style={{ color: '#3b82f6' }}>
              {filteredEvents.reduce((sum, e) => sum + e.duration, 0)} min
            </span>
          </div>
        </div>
      )}

      {loading && (
        <div className="loading">
          <span style={{ fontSize: '1.2rem', marginRight: '0.5rem' }}>⌛</span>
          Loading irrigation history...
        </div>
      )}

      <div className="history-list">
        {displayEvents.length === 0 ? (
          <div className="no-events">
            <span style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block' }}>💧</span>
            <p>No irrigation events found.</p>
          </div>
        ) : (
          displayEvents.map((event) => (
            <div key={event.id} className="history-item">
              <div className="event-header">
                <div className="event-action" style={{ color: getActionColor(event.action) }}>
                  <span className="action-dot" style={{ backgroundColor: getActionColor(event.action) }}></span>
                  Motor {event.action}
                </div>
                <div className="event-timestamp">{formatTimestamp(event.timestamp)}</div>
              </div>
              
              <div className="event-details">
                <div className="event-source">
                  <span className="source-icon">{getSourceIcon(event.source)}</span>
                  <span className="source-label">{getSourceLabel(event.source)}</span>
                  {event.duration && (
                    <span className="duration">
                      <span style={{ fontSize: '0.9rem', marginRight: '0.25rem' }}>⏱️</span>
                      ({event.duration} min)
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && !embedded && (
        <div className="pagination">
          <button 
            onClick={() => loadHistory(currentPage - 1)}
            disabled={currentPage <= 1 || loading}
            className="pagination-button"
          >
            <span style={{ fontSize: '1rem', marginRight: '0.5rem' }}>⬅️</span>
            Previous
          </button>
          
          <span className="pagination-info">
            <span style={{ fontSize: '1rem', marginRight: '0.5rem' }}>📄</span>
            Page {currentPage} of {totalPages}
          </span>
          
          <button 
            onClick={() => loadHistory(currentPage + 1)}
            disabled={currentPage >= totalPages || loading}
            className="pagination-button"
          >
            Next
            <span style={{ fontSize: '1rem', marginLeft: '0.5rem' }}>➡️</span>
          </button>
        </div>
      )}
    </div>
  );
}
