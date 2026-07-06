import { useState, useEffect } from 'react';
import { useWorkspaceScope } from '../application/session';
import { meetingRepository } from '../repositories/MeetingRepository';

export const useMeetings = (setIsNewMeetingModalOpen) => {
  const scope = useWorkspaceScope();

  const [meetings, setMeetings] = useState(() => {
    return scope.storage.getItem(scope.workspaceId, 'meetings') || [];
  });

  useEffect(() => {
    const unsub = scope.eventBus.on('meetings.updated', (newMeetings) => {
      setMeetings(newMeetings || []);
    });
    return unsub;
  }, [scope.eventBus]);

  const handleAddMeeting = async (newMeeting) => {
    const exists = meetings.some((s) => s.date === newMeeting.date && !s.completed);
    if (exists) {
      const proceed = window.confirm(
        "A meeting is already scheduled on this date. Do you still want to schedule another meeting?"
      );
      if (!proceed) return;
    }

    const tempId = newMeeting.id || `temp_${Date.now()}`;
    const meetingWithTempId = {
      ...newMeeting,
      id: tempId,
      completed: false
    };

    setMeetings((prev) => [...prev, meetingWithTempId]);
    if (setIsNewMeetingModalOpen) {
      setIsNewMeetingModalOpen(false);
    }

    try {
      await meetingRepository.create(scope.workspaceId, {
        tempId,
        title: newMeeting.title,
        date: newMeeting.date,
        completed: false
      });
    } catch (err) {
      console.error("Failed to add meeting:", err);
      setMeetings((prev) => prev.filter((m) => m.id !== tempId));
    }
  };

  const handleToggleMeeting = async (meetId) => {
    const oldMeet = meetings.find((m) => m.id === meetId);
    if (!oldMeet) return;

    setMeetings((prev) =>
      prev.map((m) => {
        if (m.id === meetId) {
          return { ...m, completed: !m.completed };
        }
        return m;
      })
    );

    try {
      await meetingRepository.update(scope.workspaceId, meetId, {
        completed: !oldMeet.completed
      });
    } catch (err) {
      console.error("Failed to toggle meeting completion:", err);
      setMeetings((prev) =>
        prev.map((m) => {
          if (m.id === meetId) {
            return { ...m, completed: oldMeet.completed };
          }
          return m;
        })
      );
    }
  };

  const handleDeleteMeeting = async (meetId) => {
    const oldMeet = meetings.find((m) => m.id === meetId);
    if (!oldMeet) return;

    setMeetings((prev) => prev.filter((m) => m.id !== meetId));

    try {
      await meetingRepository.delete(scope.workspaceId, meetId);
    } catch (err) {
      console.error("Failed to delete meeting:", err);
      if (oldMeet) {
        setMeetings((prev) => [...prev, oldMeet]);
      }
    }
  };

  return {
    meetings,
    setMeetings,
    handleAddMeeting,
    handleToggleMeeting,
    handleDeleteMeeting
  };
};
