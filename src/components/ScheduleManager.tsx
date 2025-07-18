import { useState } from 'react';
import { useIoT } from '../contexts/IoTContext';
import { ArrowLeft, Plus, Trash2, Clock, RefreshCw } from 'lucide-react';
import type { Schedule } from '../types';

interface ScheduleManagerProps {
  onBackToDashboard: () => void;
}

export function ScheduleManager({ onBackToDashboard }: ScheduleManagerProps) {
  const { state, addSchedule, deleteSchedule } = useIoT();
  const [formData, setFormData] = useState({
    time: '',
    duration: '',
    isDaily: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.time || !formData.duration) {
      return;
    }

    const duration = parseInt(formData.duration);
    if (duration < 1) {
      return;
    }

    setIsSubmitting(true);
    try {
      await addSchedule({
        time: formData.time,
        action: 'on', // Always water when schedule starts
        duration,
        active: true,
        isDaily: formData.isDaily
      });
      
      // Reset form
      setFormData({
        time: '',
        duration: '',
        isDaily: false
      });
    } catch (error) {
      console.error('Failed to add schedule:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSchedule = async (id: number) => {
    try {
      await deleteSchedule(id);
    } catch (error) {
      console.error('Failed to delete schedule:', error);
    }
  };

  return (
    <div className="schedule-manager">
      <div className="schedule-manager-header">
        <button className="btn btn--secondary" onClick={onBackToDashboard}>
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>
      </div>

      <div className="schedule-grid">
        {/* Add New Schedule */}
        <div className="card">
          <h3 className="card-title">
            <Plus className="card-icon" />
            Add New Schedule
          </h3>
          
          <p className="schedule-description">
            Create automatic watering schedules. Motor will turn ON at the specified time and run for the set duration.
          </p>
          
          <form onSubmit={handleSubmit} className="schedule-form">
            <div className="form-group">
              <label htmlFor="scheduleTime">
                <Clock size={16} />
                Start Time
              </label>
              <input
                type="time"
                id="scheduleTime"
                value={formData.time}
                onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="scheduleDuration">
                <Clock size={16} />
                Duration (minutes)
              </label>
              <input
                type="number"
                id="scheduleDuration"
                min="1"
                max="1440"
                placeholder="Enter duration (e.g., 30)"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                required
              />
              <small>Motor will automatically turn OFF after this duration</small>
            </div>
            
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.isDaily}
                  onChange={(e) => setFormData(prev => ({ ...prev, isDaily: e.target.checked }))}
                />
                <div className="checkbox-content">
                  <div className="checkbox-title">
                    <RefreshCw size={16} />
                    Daily Schedule
                  </div>
                  <div className="checkbox-description">
                    Repeat this schedule every day automatically
                  </div>
                </div>
              </label>
            </div>
            
            <button 
              type="submit" 
              className={`btn btn--primary ${isSubmitting ? 'loading' : ''}`}
              disabled={isSubmitting}
            >
              Create Schedule
            </button>
          </form>
        </div>

        {/* Active Schedules */}
        <div className="card">
          <h3 className="card-title">
            <Clock className="card-icon" />
            Active Schedules
          </h3>
          
          <p className="schedule-description">
            All your automated watering schedules. Motor will start automatically at scheduled times.
          </p>
          
          <div className="schedule-list">
            {state.schedules.length === 0 ? (
              <div className="empty-state">
                <Clock size={48} />
                <p>No schedules yet</p>
                <small>Create your first automatic watering schedule</small>
              </div>
            ) : (
              state.schedules
                .sort((a, b) => {
                  // Sort: daily first, then by time
                  if (a.isDaily && !b.isDaily) return -1;
                  if (!a.isDaily && b.isDaily) return 1;
                  
                  const timeA = parseInt(a.time.split(':')[0]) * 60 + parseInt(a.time.split(':')[1]);
                  const timeB = parseInt(b.time.split(':')[0]) * 60 + parseInt(b.time.split(':')[1]);
                  return timeA - timeB;
                })
                .map((schedule) => (
                  <ScheduleItem 
                    key={schedule.id} 
                    schedule={schedule} 
                    onDelete={handleDeleteSchedule} 
                  />
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ScheduleItemProps {
  schedule: Schedule;
  onDelete: (id: number) => void;
}

function ScheduleItem({ schedule, onDelete }: ScheduleItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(schedule.id);
    } catch (error) {
      setIsDeleting(false);
    }
  };

  return (
    <div className="schedule-item">
      <div className="schedule-item-content">
        <div className="schedule-item-icon">
          {schedule.isDaily ? <RefreshCw size={20} /> : <Clock size={20} />}
        </div>
        <div className="schedule-item-info">
          <div className="schedule-item-header">
            <div className="schedule-time">{schedule.time}</div>
            {schedule.isDaily && <span className="schedule-badge">DAILY</span>}
          </div>
          <div className="schedule-details">
            {schedule.isDaily ? 'Daily • Auto watering' : 'One-time • Auto watering'} • {schedule.duration} minutes
          </div>
        </div>
      </div>
      <button 
        className={`delete-btn ${isDeleting ? 'loading' : ''}`}
        onClick={handleDelete}
        disabled={isDeleting}
        aria-label="Delete schedule"
      >
        <Trash2 size={16} />
        Remove
      </button>
    </div>
  );
}
