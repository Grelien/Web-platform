import { useMemo } from 'react';
import type { Schedule } from '../types';
import { Clock, Calendar } from 'lucide-react';

interface NextScheduleProps {
  schedules: Schedule[];
  onShowSchedules: () => void;
}

export function NextSchedule({ schedules, onShowSchedules }: NextScheduleProps) {
  const nextSchedule = useMemo(() => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const today = now.toDateString();
    
    // Filter active schedules
    const activeSchedules = schedules.filter(schedule => {
      if (schedule.isDaily) return true;
      return schedule.active;
    });
    
    // Sort schedules by time
    const sortedSchedules = [...activeSchedules].sort((a, b) => {
      const timeA = parseInt(a.time.split(':')[0]) * 60 + parseInt(a.time.split(':')[1]);
      const timeB = parseInt(b.time.split(':')[0]) * 60 + parseInt(b.time.split(':')[1]);
      return timeA - timeB;
    });

    // Find next schedule
    for (const schedule of sortedSchedules) {
      const scheduleTime = parseInt(schedule.time.split(':')[0]) * 60 + parseInt(schedule.time.split(':')[1]);
      
      // For daily schedules, check if already executed today
      if (schedule.isDaily && schedule.lastExecuted === today && scheduleTime <= currentTime) {
        continue;
      }
      
      if (scheduleTime > currentTime) {
        return schedule;
      }
    }

    // If no schedule found for today, take the first one for tomorrow
    if (sortedSchedules.length > 0) {
      const dailySchedules = sortedSchedules.filter(s => s.isDaily);
      return dailySchedules.length > 0 ? dailySchedules[0] : sortedSchedules[0];
    }

    return null;
  }, [schedules]);

  return (
    <div className="card">
      <h3 className="card-title">
        <Clock className="card-icon" />
        Next Schedule
      </h3>
      
      <div className="next-schedule-content">
        {nextSchedule ? (
          <>
            <div className="next-schedule-time">{nextSchedule.time}</div>
            <div className="next-schedule-action">
              {nextSchedule.isDaily ? (
                <div className="schedule-type">
                  <Calendar size={16} />
                  Daily watering
                </div>
              ) : (
                <div className="schedule-type">Watering</div>
              )}
              <div className="schedule-duration">for {nextSchedule.duration} minutes</div>
            </div>
          </>
        ) : (
          <>
            <div className="next-schedule-time">No schedules</div>
            <div className="next-schedule-action">Create your first schedule</div>
          </>
        )}
        
        <button className="btn btn--primary" onClick={onShowSchedules}>
          Manage Schedules
        </button>
      </div>
    </div>
  );
}
