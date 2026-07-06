import { useState, useEffect } from 'react';
import { useWorkspaceScope } from '../application/session';
import { meetingRepository } from '../repositories/MeetingRepository';

export const useMeetings = (setIsNewMeetingModalOpen) => {
  const scope = useWorkspaceScope();

  const [meetings, setMeetings] = useState(() => {
    return scope.storage.getItem(scope.workspaceId, 'meetings') || [];
  });

  const logMeetingsTransition = (reason, prev, next) => {
    const prevIds = prev.map(m => m.id);
    const nextIds = next.map(m => m.id);
    const added = nextIds.filter(id => !prevIds.includes(id));
    const removed = prevIds.filter(id => !nextIds.includes(id));
    console.log(`[React] setMeetings called | Reason: ${reason} | Timestamp: ${new Date().toISOString()} | Workspace: ${scope.workspaceId} | Count: ${next.length} | Prev: ${JSON.stringify(prevIds)} | New: ${JSON.stringify(nextIds)} | Added: ${JSON.stringify(added)} | Removed: ${JSON.stringify(removed)}`);
  };

  useEffect(() => {
    const stored = scope.storage.getItem(scope.workspaceId, 'meetings') || [];
    setMeetings((prev) => {
      if (JSON.stringify(prev) === JSON.stringify(stored)) return prev;
      logMeetingsTransition("workspace_switch/mount_sync", prev, stored);
      return stored;
    });
  }, [scope.workspaceId, scope.storage]);

  useEffect(() => {
    const unsub = scope.eventBus.on('meetings.updated', (newMeetings) => {
      setMeetings((prev) => {
        const next = newMeetings || [];
        if (JSON.stringify(prev) === JSON.stringify(next)) return prev;
        logMeetingsTransition("eventbus_meetings.updated", prev, next);
        return next;
      });
    });
    return unsub;
  }, [scope.eventBus]);

  const updateMeetingsState = (updaterFn) => {
    setMeetings((prev) => {
      const next = typeof updaterFn === 'function' ? updaterFn(prev) : updaterFn;
      if (JSON.stringify(prev) === JSON.stringify(next)) return prev;
      logMeetingsTransition("optimistic_or_rollback_update", prev, next);
      if (scope.workspaceId) {
        scope.storage.setItem(scope.workspaceId, 'meetings', next);
      }
      return next;
    });
  };

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

    updateMeetingsState((prev) => [...prev, meetingWithTempId]);
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
      updateMeetingsState((prev) => prev.filter((m) => m.id !== tempId));
    }
  };

  const handleToggleMeeting = async (meetId) => {
    const oldMeet = meetings.find((m) => m.id === meetId);
    if (!oldMeet) return;

    updateMeetingsState((prev) =>
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
      updateMeetingsState((prev) =>
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
    const oldMeet = meetings.find((m) => m.id === meetId || m.tempId === meetId);
    if (!oldMeet) return;

    console.log(`[Delete] User clicked delete | meetingId: ${meetId} | workspaceId: ${scope.workspaceId} | count: ${meetings.length} | timestamp: ${new Date().toISOString()}`);

    const deletedIds = scope.storage.getItem(scope.workspaceId, 'deletedMeetingIds') || [];
    const idsToAdd = [oldMeet.id];
    if (oldMeet.tempId && oldMeet.tempId !== oldMeet.id) {
      idsToAdd.push(oldMeet.tempId);
    }
    if (meetId !== oldMeet.id && !idsToAdd.includes(meetId)) {
      idsToAdd.push(meetId);
    }
    const newDeletedIds = Array.from(new Set([...deletedIds, ...idsToAdd]));
    if (scope.workspaceId) {
      scope.storage.setItem(scope.workspaceId, 'deletedMeetingIds', newDeletedIds);
    }

    updateMeetingsState((prev) => prev.filter((m) => m.id !== oldMeet.id && m.tempId !== oldMeet.id && m.id !== meetId));

    try {
      await meetingRepository.delete(scope.workspaceId, meetId);
    } catch (err) {
      console.error("Failed to delete meeting:", err);
      if (oldMeet) {
        if (scope.workspaceId) {
          const currentDeleted = scope.storage.getItem(scope.workspaceId, 'deletedMeetingIds') || [];
          const restoredDeleted = currentDeleted.filter(id => !idsToAdd.includes(id));
          scope.storage.setItem(scope.workspaceId, 'deletedMeetingIds', restoredDeleted);
        }
        updateMeetingsState((prev) => [...prev, oldMeet]);
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
