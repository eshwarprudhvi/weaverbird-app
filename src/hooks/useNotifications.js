import { LocalNotifications } from "@capacitor/local-notifications";

export const useNotifications = () => {
  const scheduleAllUpcomingMeetings = async (meetingsList) => {
    try {
      const perm = await LocalNotifications.checkPermissions();
      if (perm.display !== "granted") {
        await LocalNotifications.requestPermissions();
      }

      // Cancel existing ones first to avoid duplicate notifications
      for (const m of meetingsList) {
        const numericId = Math.floor(parseInt(m.id.replace("s_", "")) % 2147483647) || 0;
        if (numericId > 0) {
          try {
            await LocalNotifications.cancel({
              notifications: [{ id: numericId }]
            });
            // eslint-disable-next-line no-unused-vars, no-empty
          } catch (e) { }
        }
      }

      const todayStr = new Date().toISOString().split("T")[0];
      const incompleteUpcoming = meetingsList.filter(m => !m.completed);

      for (const meeting of incompleteUpcoming) {
        const targetDate = new Date(meeting.date + "T09:00:00");
        let scheduleTime = targetDate;

        if (meeting.date === todayStr) {
          // If the meeting is today, trigger it 5 seconds in the future for immediate alert
          scheduleTime = new Date(Date.now() + 5000);
        } else if (targetDate.getTime() < Date.now()) {
          // Skip if the meeting date is in the past
          continue;
        }

        const numericId = Math.floor(parseInt(meeting.id.replace("s_", "")) % 2147483647) || Math.floor(Date.now() % 2147483647);
        await LocalNotifications.schedule({
          notifications: [
            {
              id: numericId,
              title: "WeaverBird Meeting Today",
              body: `Reminder: "${meeting.title}" is scheduled for today!`,
              schedule: { at: scheduleTime },
              extra: { tab: "schedule" }
            }
          ]
        });
      }
    } catch (err) {
      console.warn("Could not schedule upcoming meetings:", err);
    }
  };

  return { scheduleAllUpcomingMeetings };
};
