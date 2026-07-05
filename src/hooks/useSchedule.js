import { useState, useEffect } from 'react';
import { useWorkspaceScope } from '../application/session';

export const useSchedule = (setIsNewMeetingModalOpen) => {
  const scope = useWorkspaceScope();

  const [schedule, setSchedule] = useState(() => {
    return scope.storage.getItem(scope.workspaceId, 'schedule') || [];
  });

  useEffect(() => {
    const unsub = scope.eventBus.on('schedule.updated', (newSchedule) => {
      setSchedule(newSchedule);
    });
    return unsub;
  }, [scope.eventBus]);


  const handleAddMeeting = (newMeeting) => {
    const exists = schedule.some((s) => s.date === newMeeting.date && !s.completed);
    if (exists) {
      const proceed = window.confirm(
        "A meeting is already scheduled on this date. Do you still want to schedule another meeting?"
      );
      if (!proceed) return;
    }
    setSchedule([...schedule, newMeeting]);
    setIsNewMeetingModalOpen(false);
  };

  // Toggle Meeting Complete
  const handleToggleMeeting = (meetId) => {
    setSchedule(
      schedule.map((s) => {
        if (s.id === meetId) {
          return { ...s, completed: !s.completed };
        }
        return s;
      })
    );
  };

  // Delete Meeting
  const handleDeleteMeeting = (meetId) => {
    setSchedule(schedule.filter((s) => s.id !== meetId));
  };

  // Save edits from modal


  return {
    schedule,
    setSchedule,
    handleAddMeeting,
    handleToggleMeeting,
    handleDeleteMeeting
  };
};
