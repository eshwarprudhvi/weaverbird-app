
export const useSharing = (props) => {
  const { activeProject, formatDisplayDateStr, getPriorityWeight } = props;
  // Auto-destructure will be injected here

  const handleShareMaterials = () => {
    if (!activeProject) return;
    const materials = activeProject.materials || [];
    if (materials.length === 0) {
      alert("No materials to share!");
      return;
    }

    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yy = String(today.getFullYear()).slice(-2);
    const dateStr = `${dd}/${mm}/${yy}`;

    let text = `*${companyName || "WeaverBird"} ${companySubtitle || "Interior Studio"}*\n`;
    text += `*Date:* ${dateStr}\n`;
    text += `*Project:* ${activeProject.name}\n`;
    if (activeProject.completionDate) {
      text += `*Target Deadline:* ${formatDisplayDateStr(
        activeProject.completionDate
      )}\n`;
    }

    const pending = materials.filter(m => !m.completed);
    const completed = materials.filter(m => m.completed);

    if (pending.length > 0) {
      text += `\n*Pending Materials:*\n`;
      pending.forEach((m) => {
        text += `- ${m.name}\n`;
      });
    }

    if (completed.length > 0) {
      text += `\n*Completed Materials:*\n`;
      completed.forEach((m) => {
        text += `- ${m.name} (Completed)\n`;
      });
    }

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(
      text.trim()
    )}`;
    window.open(url, "_blank");
  };

  const handleShareTasks = () => {
    if (!activeProject) return;
    const tasks = activeProject.tasks || [];
    if (tasks.length === 0) {
      alert("No tasks to share!");
      return;
    }

    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yy = String(today.getFullYear()).slice(-2);
    const dateStr = `${dd}/${mm}/${yy}`;

    let text = `*${companyName || "WeaverBird"} ${companySubtitle || "Interior Studio"}*\n`;
    text += `*Date:* ${dateStr}\n`;
    text += `*Project:* ${activeProject.name}\n`;
    if (activeProject.completionDate) {
      text += `*Target Deadline:* ${formatDisplayDateStr(
        activeProject.completionDate
      )}\n`;
    }

    const pending = tasks.filter(t => !t.completed);
    const completed = tasks.filter(t => t.completed);

    if (pending.length > 0) {
      text += `\n*Pending Tasks (Sorted by Priority):*\n`;
      const sorted = [...pending].sort(
        (a, b) => getPriorityWeight(b.priority) - getPriorityWeight(a.priority)
      );
      sorted.forEach((t) => {
        const priorityStr = (t.priority || "medium").toUpperCase();
        const emoji =
          t.priority === "high" ? "🔴" : t.priority === "low" ? "🔵" : "🟠";
        text += `${emoji} [${priorityStr}] ${t.name}\n`;
      });
    }

    if (completed.length > 0) {
      text += `\n*Completed Tasks:*\n`;
      completed.forEach((t) => {
        text += `✅ ${t.name} (Completed)\n`;
      });
    }

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(
      text.trim()
    )}`;
    window.open(url, "_blank");
  };

  const handleShareProjectOverview = () => {
    if (!activeProject) return;
    const materials = activeProject.materials || [];
    const tasks = activeProject.tasks || [];

    if (materials.length === 0 && tasks.length === 0) {
      alert("No materials or tasks to share!");
      return;
    }

    const rooms = activeProject.rooms || [];
    const roomsMap = new Map();
    rooms.forEach(r => roomsMap.set(r.id, r.name));
    roomsMap.set('general', 'General / Unassigned');

    const materialsByRoom = {};
    materials.forEach(m => {
      const roomId = m.roomId || 'general';
      if (!materialsByRoom[roomId]) materialsByRoom[roomId] = [];
      materialsByRoom[roomId].push(m);
    });

    const tasksByRoom = {};
    tasks.forEach(t => {
      const roomId = t.roomId || 'general';
      if (!tasksByRoom[roomId]) tasksByRoom[roomId] = [];
      tasksByRoom[roomId].push(t);
    });

    const allRoomIds = [...new Set([...Object.keys(materialsByRoom), ...Object.keys(tasksByRoom)])];

    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yy = String(today.getFullYear()).slice(-2);
    const dateStr = `${dd}/${mm}/${yy}`;

    let text = `*${companyName || "WeaverBird"} ${companySubtitle || "Interior Studio"}*\n`;
    text += `*Date:* ${dateStr}\n`;
    text += `*Project:* ${activeProject.name}\n`;
    if (activeProject.completionDate) {
      text += `*Target Deadline:* ${formatDisplayDateStr(activeProject.completionDate)}\n`;
    }

    allRoomIds.forEach(roomId => {
      const roomName = roomsMap.get(roomId) || 'Unknown Room';
      text += `\n--- *${roomName.toUpperCase()}* ---\n`;

      const rMaterials = materialsByRoom[roomId] || [];
      const pendingM = rMaterials.filter(m => !m.completed);
      const completedM = rMaterials.filter(m => m.completed);

      if (pendingM.length > 0) {
        text += `*Pending Materials:*\n`;
        pendingM.forEach(m => { text += `- ${m.name}\n`; });
      }
      if (completedM.length > 0) {
        text += `*Completed Materials:*\n`;
        completedM.forEach(m => { text += `- ${m.name} (Completed)\n`; });
      }

      const rTasks = tasksByRoom[roomId] || [];
      const pendingT = rTasks.filter(t => !t.completed);
      const completedT = rTasks.filter(t => t.completed);

      if (pendingT.length > 0) {
        text += `*Pending Work:*\n`;
        const sorted = [...pendingT].sort((a, b) => getPriorityWeight(b.priority) - getPriorityWeight(a.priority));
        sorted.forEach(t => {
          const emoji = t.priority === "high" ? "🔴" : t.priority === "low" ? "🔵" : "🟠";
          const priorityStr = (t.priority || "medium").toUpperCase();
          text += `${emoji} [${priorityStr}] ${t.name}\n`;
        });
      }
      if (completedT.length > 0) {
        text += `*Completed Work:*\n`;
        completedT.forEach(t => {
          text += `✅ ${t.name} (Completed)\n`;
        });
      }
    });

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text.trim())}`;
    window.open(url, "_blank");
  };

  const handleShareRoom = (e, room) => {
    e.stopPropagation();
    if (!activeProject) return;

    const materials = activeProject.materials?.filter(m => (room.id === 'general' ? (!m.roomId || m.roomId === 'general') : m.roomId === room.id)) || [];
    const tasks = activeProject.tasks?.filter(t => (room.id === 'general' ? (!t.roomId || t.roomId === 'general') : t.roomId === room.id)) || [];

    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yy = String(today.getFullYear()).slice(-2);
    const dateStr = `${dd}/${mm}/${yy}`;

    let text = `*${companyName || "WeaverBird"} ${companySubtitle || "Interior Studio"}*\n`;
    text += `*Date:* ${dateStr}\n`;
    text += `*Project:* ${activeProject.name}\n`;
    text += `*Room:* ${room.name}\n\n`;

    if (materials.length === 0 && tasks.length === 0) {
      text += `No materials or tasks defined in this room.\n`;
    } else {
      const pendingMaterials = materials.filter(m => !m.completed);
      const completedMaterials = materials.filter(m => m.completed);
      const pendingTasks = tasks.filter(t => !t.completed);
      const completedTasks = tasks.filter(t => t.completed);

      if (pendingMaterials.length > 0) {
        text += `*Pending Materials:*\n`;
        pendingMaterials.forEach((m) => {
          text += `- ${m.name}\n`;
        });
        text += `\n`;
      }

      if (completedMaterials.length > 0) {
        text += `*Completed Materials:*\n`;
        completedMaterials.forEach((m) => {
          text += `- ${m.name} (Completed)\n`;
        });
        text += `\n`;
      }

      if (pendingTasks.length > 0) {
        text += `*Pending Work:*\n`;
        pendingTasks.forEach((t) => {
          text += `- ${t.name}\n`;
        });
        text += `\n`;
      }

      if (completedTasks.length > 0) {
        text += `*Completed Work:*\n`;
        completedTasks.forEach((t) => {
          text += `- ${t.name} (Completed)\n`;
        });
      }
    }

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text.trim())}`;
    window.open(url, "_blank");
  };

  return {
    handleShareMaterials,
    handleShareTasks,
    handleShareProjectOverview,
    handleShareRoom,
  };
};
