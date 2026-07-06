
import { meetingRepository } from '../repositories/MeetingRepository';
import { catalogRepository } from '../repositories/CatalogRepository';
import { projectRepository } from '../repositories/ProjectRepository';
import { useWorkspaceScope } from '../application/session';

export const useProjectItems = (props) => {
  const { newMaterialInput, activeProjectId, setProjects, projects, activeRoomId, setNewMaterialInput, activeProject, setCustomConfirm, newWorkInput, newTaskPriority, setNewWorkInput, setNewTaskPriority, setDraggedTaskId, draggedTaskId, editItemModal, meetings, setMeetings, setMaterialCatalog, materialCatalog, setEditItemModal } = props;
  const scope = useWorkspaceScope();

  const updateProjectInRepository = (projId, updatedData) => {
    if (!scope || !scope.workspaceId || !projId) return;
    projectRepository.update(scope.workspaceId, projId, updatedData)
      .catch(err => console.error(`Failed to update project ${projId} in repository:`, err));
  };

  const handleAddMaterial = (e) => {
    e.preventDefault();
    if (!newMaterialInput.trim() || !activeProjectId) return;

    const targetProj = (Array.isArray(projects) ? projects : []).find(p => p.id === activeProjectId);
    if (!targetProj) return;

    const newMaterial = {
      id: "m_" + Date.now(),
      name: newMaterialInput.trim(),
      completed: false,
      roomId: activeRoomId,
    };
    const updatedMaterials = [newMaterial, ...(targetProj.materials || [])];
    const nowStr = new Date().toISOString();

    setProjects(prev =>
      (Array.isArray(prev) ? prev : []).map((p) =>
        p.id === activeProjectId
          ? { ...p, materials: updatedMaterials, updatedAt: nowStr }
          : p
      )
    );
    setNewMaterialInput("");
    updateProjectInRepository(activeProjectId, { materials: updatedMaterials, updatedAt: nowStr });
  };

  const handleToggleMaterial = (matId) => {
    const targetProj = (Array.isArray(projects) ? projects : []).find(p => p.id === activeProjectId);
    if (!targetProj) return;

    const updatedMaterials = (targetProj.materials || []).map((m) =>
      m.id === matId ? { ...m, completed: !m.completed } : m
    );
    const nowStr = new Date().toISOString();

    setProjects(prev =>
      (Array.isArray(prev) ? prev : []).map((p) =>
        p.id === activeProjectId
          ? { ...p, materials: updatedMaterials, updatedAt: nowStr }
          : p
      )
    );
    updateProjectInRepository(activeProjectId, { materials: updatedMaterials, updatedAt: nowStr });
  };

  const handleDeleteMaterial = (matId) => {
    const targetProj = (Array.isArray(projects) ? projects : []).find(p => p.id === activeProjectId);
    if (!targetProj) return;

    const updatedMaterials = (targetProj.materials || []).filter((m) => m.id !== matId);
    const nowStr = new Date().toISOString();

    setProjects(prev =>
      (Array.isArray(prev) ? prev : []).map((p) =>
        p.id === activeProjectId
          ? { ...p, materials: updatedMaterials, updatedAt: nowStr }
          : p
      )
    );
    updateProjectInRepository(activeProjectId, { materials: updatedMaterials, updatedAt: nowStr });
  };

  const handleClearCompletedMaterials = () => {
    if (!activeProjectId) return;
    const targetProj = (Array.isArray(projects) ? projects : []).find(p => p.id === activeProjectId);
    if (!targetProj) return;
    
    let roomName = "this room";
    if (activeRoomId === "general") {
      roomName = "General / Unassigned";
    } else if (activeRoomId) {
      const room = targetProj.rooms?.find(r => r.id === activeRoomId);
      if (room) roomName = room.name;
    }
    
    setCustomConfirm({
      title: "Clear Completed Materials",
      message: `Are you sure you want to clear all completed materials in ${roomName}?`,
      onConfirm: () => {
        const updatedMaterials = (targetProj.materials || []).filter((m) => {
          const belongsToActiveRoom = activeRoomId === "general"
            ? (!m.roomId || m.roomId === "general")
            : m.roomId === activeRoomId;
          return !m.completed || !belongsToActiveRoom;
        });
        const nowStr = new Date().toISOString();

        setProjects(prev =>
          (Array.isArray(prev) ? prev : []).map((p) =>
            p.id === activeProjectId
              ? { ...p, materials: updatedMaterials, updatedAt: nowStr }
              : p
          )
        );
        updateProjectInRepository(activeProjectId, { materials: updatedMaterials, updatedAt: nowStr });
      }
    });
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newWorkInput.trim() || !activeProjectId) return;

    const targetProj = (Array.isArray(projects) ? projects : []).find(p => p.id === activeProjectId);
    if (!targetProj) return;

    const newTask = {
      id: "t_" + Date.now(),
      name: newWorkInput.trim(),
      completed: false,
      priority: newTaskPriority, // Use state priority
      roomId: activeRoomId,
    };
    const updatedTasks = [newTask, ...(targetProj.tasks || [])];
    const nowStr = new Date().toISOString();

    setProjects(prev =>
      (Array.isArray(prev) ? prev : []).map((p) =>
        p.id === activeProjectId
          ? { ...p, tasks: updatedTasks, updatedAt: nowStr }
          : p
      )
    );
    setNewWorkInput("");
    setNewTaskPriority("medium"); // Reset to default
    updateProjectInRepository(activeProjectId, { tasks: updatedTasks, updatedAt: nowStr });
  };

  const handleToggleTask = (taskId, projId = activeProjectId) => {
    const targetProj = Array.isArray(projects) ? projects.find((p) => p.id === projId) : null;
    if (!targetProj) return;

    const task = (targetProj.tasks || []).find((t) => t.id === taskId);
    if (task && !task.completed) {
      const uncompletedDeps = (task.dependencies || [])
        .map((depId) => (targetProj.tasks || []).find((t) => t.id === depId))
        .filter((t) => t && !t.completed);

      if (uncompletedDeps.length > 0) {
        const depNames = uncompletedDeps.map((t) => `"${t.name}"`).join(", ");
        alert(
          `Cannot complete this task. It depends on preceding tasks: ${depNames} which are not yet completed.`
        );
        return;
      }
    }

    const updatedTasks = (targetProj.tasks || []).map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    const nowStr = new Date().toISOString();

    setProjects(prev =>
      (Array.isArray(prev) ? prev : []).map((p) =>
        p.id === projId
          ? { ...p, tasks: updatedTasks, updatedAt: nowStr }
          : p
      )
    );
    updateProjectInRepository(projId, { tasks: updatedTasks, updatedAt: nowStr });
  };

  const handleDeleteTask = (taskId) => {
    const targetProj = (Array.isArray(projects) ? projects : []).find(p => p.id === activeProjectId);
    if (!targetProj) return;

    const updatedTasks = (targetProj.tasks || []).filter((t) => t.id !== taskId);
    const nowStr = new Date().toISOString();

    setProjects(prev =>
      (Array.isArray(prev) ? prev : []).map((p) =>
        p.id === activeProjectId
          ? { ...p, tasks: updatedTasks, updatedAt: nowStr }
          : p
      )
    );
    updateProjectInRepository(activeProjectId, { tasks: updatedTasks, updatedAt: nowStr });
  };

  const handleClearCompletedTasks = () => {
    if (!activeProjectId) return;
    const targetProj = (Array.isArray(projects) ? projects : []).find(p => p.id === activeProjectId);
    if (!targetProj) return;
    
    let roomName = "this room";
    if (activeRoomId === "general") {
      roomName = "General / Unassigned";
    } else if (activeRoomId) {
      const room = targetProj.rooms?.find(r => r.id === activeRoomId);
      if (room) roomName = room.name;
    }
    
    setCustomConfirm({
      title: "Clear Completed Tasks",
      message: `Are you sure you want to clear all completed tasks in ${roomName}?`,
      onConfirm: () => {
        const updatedTasks = (targetProj.tasks || []).filter((t) => {
          const belongsToActiveRoom = activeRoomId === "general"
            ? (!t.roomId || t.roomId === "general")
            : t.roomId === activeRoomId;
          return !t.completed || !belongsToActiveRoom;
        });
        const nowStr = new Date().toISOString();

        setProjects(prev =>
          (Array.isArray(prev) ? prev : []).map((p) =>
            p.id === activeProjectId
              ? { ...p, tasks: updatedTasks, updatedAt: nowStr }
              : p
          )
        );
        updateProjectInRepository(activeProjectId, { tasks: updatedTasks, updatedAt: nowStr });
      }
    });
  };

  const handleTaskDragStart = (e, id) => {
    setDraggedTaskId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleTaskDragOver = (e) => {
    e.preventDefault();
  };

  const handleTaskDrop = (e, targetId) => {
    e.preventDefault();
    if (!draggedTaskId || draggedTaskId === targetId) return;

    const targetProj = (Array.isArray(projects) ? projects : []).find(p => p.id === activeProjectId);
    if (!targetProj) return;

    const tasks = [...(targetProj.tasks || [])];
    const draggedIndex = tasks.findIndex((t) => t.id === draggedTaskId);
    const targetIndex = tasks.findIndex((t) => t.id === targetId);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      const [draggedTask] = tasks.splice(draggedIndex, 1);
      tasks.splice(targetIndex, 0, draggedTask);
    }
    const nowStr = new Date().toISOString();

    setProjects((prevProjects) =>
      (Array.isArray(prevProjects) ? prevProjects : []).map((proj) =>
        proj.id === activeProjectId
          ? { ...proj, tasks, updatedAt: nowStr }
          : proj
      )
    );
    setDraggedTaskId(null);
    updateProjectInRepository(activeProjectId, { tasks, updatedAt: nowStr });
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    // eslint-disable-next-line no-unused-vars
    const { type, projectId, itemId, name, description, time, day, status } =
      editItemModal;

    const targetProj = (Array.isArray(projects) ? projects : []).find(p => p.id === (type === "project" ? itemId : projectId));

    if (type === "project") {
      const { completionDate } = editItemModal;
      const nowStr = new Date().toISOString();
      setProjects(prev =>
        (Array.isArray(prev) ? prev : []).map((p) => {
          if (p.id === itemId) {
            return {
              ...p,
              name,
              status,
              completionDate: completionDate || "",
              updatedAt: nowStr,
            };
          }
          return p;
        })
      );
      updateProjectInRepository(itemId, {
        name,
        status,
        completionDate: completionDate || "",
        updatedAt: nowStr,
      });
    } else if (type === "room") {
      if (!targetProj) return;
      const updatedRooms = (targetProj.rooms || []).map((r) =>
        r.id === itemId ? { ...r, name: name.trim() } : r
      );
      const nowStr = new Date().toISOString();
      setProjects(prev =>
        (Array.isArray(prev) ? prev : []).map((p) => {
          if (p.id === projectId) {
            return { ...p, rooms: updatedRooms, updatedAt: nowStr };
          }
          return p;
        })
      );
      updateProjectInRepository(projectId, { rooms: updatedRooms, updatedAt: nowStr });
    } else if (type === "new_room") {
      if (name && name.trim()) {
        if (!targetProj) return;
        const newRoom = { id: "room_" + Date.now(), name: name.trim() };
        const updatedRooms = [...(targetProj.rooms || []), newRoom];
        const nowStr = new Date().toISOString();
        setProjects(prev =>
          (Array.isArray(prev) ? prev : []).map((p) => {
            if (p.id === projectId) {
              return { ...p, rooms: updatedRooms, updatedAt: nowStr };
            }
            return p;
          })
        );
        updateProjectInRepository(projectId, { rooms: updatedRooms, updatedAt: nowStr });
      }
    } else if (type === "material") {
      if (!targetProj) return;
      const updatedMaterials = (targetProj.materials || []).map((m) =>
        m.id === itemId ? { ...m, name } : m
      );
      const nowStr = new Date().toISOString();
      setProjects(prev =>
        (Array.isArray(prev) ? prev : []).map((p) => {
          if (p.id === projectId) {
            return { ...p, materials: updatedMaterials, updatedAt: nowStr };
          }
          return p;
        })
      );
      updateProjectInRepository(projectId, { materials: updatedMaterials, updatedAt: nowStr });
    } else if (type === "task") {
      if (!targetProj) return;
      const { priority, dependencies } = editItemModal;
      const updatedTasks = (targetProj.tasks || []).map((t) =>
        t.id === itemId
          ? {
            ...t,
            name,
            priority: priority || "medium",
            dependencies: dependencies || [],
          }
          : t
      );
      const nowStr = new Date().toISOString();
      setProjects(prev =>
        (Array.isArray(prev) ? prev : []).map((p) => {
          if (p.id === projectId) {
            return { ...p, tasks: updatedTasks, updatedAt: nowStr };
          }
          return p;
        })
      );
      updateProjectInRepository(projectId, { tasks: updatedTasks, updatedAt: nowStr });
    } else if (type === "meeting") {
      const { date } = editItemModal;
      const exists = meetings.some(
        (s) => s.date === date && s.id !== itemId && !s.completed
      );
      if (exists) {
        const proceed = window.confirm(
          "A meeting is already scheduled on this date. Do you still want to schedule another meeting?"
        );
        if (!proceed) return;
      }
      
      const oldMeetings = [...meetings];
      setMeetings(
        meetings.map((s) => {
          if (s.id === itemId) {
            return { ...s, title: name, date };
          }
          return s;
        })
      );

      meetingRepository.update(scope.workspaceId, itemId, { title: name, date }).catch(err => {
        console.error("Failed to update meeting:", err);
        setMeetings(oldMeetings);
      });
    } else if (type === "catalog_material") {
      const { price } = editItemModal;
      const oldCatalog = [...materialCatalog];
      setMaterialCatalog(
        materialCatalog.map((item) =>
          item.id === itemId ? { ...item, name: name.trim(), price: price.trim() } : item
        )
      );

      catalogRepository.update(scope.workspaceId, itemId, { name: name.trim(), price: price.trim() }).catch(err => {
        console.error("Failed to update catalog item:", err);
        setMaterialCatalog(oldCatalog);
      });
    }

    setEditItemModal(null);
  };

  return {
    handleAddMaterial,
    handleToggleMaterial,
    handleDeleteMaterial,
    handleClearCompletedMaterials,
    handleAddTask,
    handleToggleTask,
    handleDeleteTask,
    handleClearCompletedTasks,
    handleTaskDragStart,
    handleTaskDragOver,
    handleTaskDrop,
    handleSaveEdit,
  };
};
