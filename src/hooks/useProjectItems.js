
export const useProjectItems = (props) => {
  const { newMaterialInput, activeProjectId, setProjects, projects, activeRoomId, setNewMaterialInput, activeProject, setCustomConfirm, newWorkInput, newTaskPriority, setNewWorkInput, setNewTaskPriority, setDraggedTaskId, draggedTaskId, editItemModal, schedule, setSchedule, setMaterialCatalog, materialCatalog, setEditItemModal } = props;
  // Auto-destructure will be injected here

  const handleAddMaterial = (e) => {
    e.preventDefault();
    if (!newMaterialInput.trim() || !activeProjectId) return;

    setProjects(
      projects.map((p) => {
        if (p.id === activeProjectId) {
          const newMaterial = {
            id: "m_" + Date.now(),
            name: newMaterialInput.trim(),
            completed: false,
            roomId: activeRoomId,
          };
          return {
            ...p,
            materials: [newMaterial, ...(p.materials || [])],
          };
        }
        return p;
      })
    );

    setNewMaterialInput("");
  };

  const handleToggleMaterial = (matId) => {
    setProjects(
      projects.map((p) => {
        if (p.id === activeProjectId) {
          return {
            ...p,
            materials: p.materials.map((m) => {
              if (m.id === matId) {
                return { ...m, completed: !m.completed };
              }
              return m;
            }),
          };
        }
        return p;
      })
    );
  };

  const handleDeleteMaterial = (matId) => {
    setProjects(
      projects.map((p) => {
        if (p.id === activeProjectId) {
          return {
            ...p,
            materials: p.materials.filter((m) => m.id !== matId),
          };
        }
        return p;
      })
    );
  };

  const handleClearCompletedMaterials = () => {
    if (!activeProjectId) return;
    
    let roomName = "this room";
    if (activeRoomId === "general") {
      roomName = "General / Unassigned";
    } else if (activeRoomId) {
      const room = activeProject?.rooms?.find(r => r.id === activeRoomId);
      if (room) roomName = room.name;
    }
    
    setCustomConfirm({
      title: "Clear Completed Materials",
      message: `Are you sure you want to clear all completed materials in ${roomName}?`,
      onConfirm: () => {
        setProjects(
          projects.map((p) => {
            if (p.id === activeProjectId) {
              return {
                ...p,
                materials: (p.materials || []).filter((m) => {
                  const belongsToActiveRoom = activeRoomId === "general"
                    ? (!m.roomId || m.roomId === "general")
                    : m.roomId === activeRoomId;
                  return !m.completed || !belongsToActiveRoom;
                }),
              };
            }
            return p;
          })
        );
      }
    });
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newWorkInput.trim() || !activeProjectId) return;

    setProjects(
      projects.map((p) => {
        if (p.id === activeProjectId) {
          const newTask = {
            id: "t_" + Date.now(),
            name: newWorkInput.trim(),
            completed: false,
            priority: newTaskPriority, // Use state priority
            roomId: activeRoomId,
          };
          return {
            ...p,
            tasks: [newTask, ...(p.tasks || [])],
          };
        }
        return p;
      })
    );

    setNewWorkInput("");
    setNewTaskPriority("medium"); // Reset to default
  };

  const handleToggleTask = (taskId, projId = activeProjectId) => {
    const targetProj = projects.find((p) => p.id === projId);
    if (targetProj) {
      const task = targetProj.tasks.find((t) => t.id === taskId);
      if (task && !task.completed) {
        const uncompletedDeps = (task.dependencies || [])
          .map((depId) => targetProj.tasks.find((t) => t.id === depId))
          .filter((t) => t && !t.completed);

        if (uncompletedDeps.length > 0) {
          const depNames = uncompletedDeps.map((t) => `"${t.name}"`).join(", ");
          alert(
            `Cannot complete this task. It depends on preceding tasks: ${depNames} which are not yet completed.`
          );
          return;
        }
      }
    }

    setProjects(
      projects.map((p) => {
        if (p.id === projId) {
          return {
            ...p,
            tasks: p.tasks.map((t) => {
              if (t.id === taskId) {
                return { ...t, completed: !t.completed };
              }
              return t;
            }),
          };
        }
        return p;
      })
    );
  };

  const handleDeleteTask = (taskId) => {
    setProjects(
      projects.map((p) => {
        if (p.id === activeProjectId) {
          return {
            ...p,
            tasks: p.tasks.filter((t) => t.id !== taskId),
          };
        }
        return p;
      })
    );
  };

  const handleClearCompletedTasks = () => {
    if (!activeProjectId) return;
    
    let roomName = "this room";
    if (activeRoomId === "general") {
      roomName = "General / Unassigned";
    } else if (activeRoomId) {
      const room = activeProject?.rooms?.find(r => r.id === activeRoomId);
      if (room) roomName = room.name;
    }
    
    setCustomConfirm({
      title: "Clear Completed Tasks",
      message: `Are you sure you want to clear all completed tasks in ${roomName}?`,
      onConfirm: () => {
        setProjects(
          projects.map((p) => {
            if (p.id === activeProjectId) {
              return {
                ...p,
                tasks: (p.tasks || []).filter((t) => {
                  const belongsToActiveRoom = activeRoomId === "general"
                    ? (!t.roomId || t.roomId === "general")
                    : t.roomId === activeRoomId;
                  return !t.completed || !belongsToActiveRoom;
                }),
              };
            }
            return p;
          })
        );
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

    setProjects((prevProjects) =>
      prevProjects.map((proj) => {
        if (proj.id === activeProjectId) {
          const tasks = [...proj.tasks];
          const draggedIndex = tasks.findIndex((t) => t.id === draggedTaskId);
          const targetIndex = tasks.findIndex((t) => t.id === targetId);

          if (draggedIndex !== -1 && targetIndex !== -1) {
            const [draggedTask] = tasks.splice(draggedIndex, 1);
            tasks.splice(targetIndex, 0, draggedTask);
          }
          return { ...proj, tasks };
        }
        return proj;
      })
    );
    setDraggedTaskId(null);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    // eslint-disable-next-line no-unused-vars
    const { type, projectId, itemId, name, description, time, day, status } =
      editItemModal;

    if (type === "project") {
      const { completionDate } = editItemModal;
      setProjects(
        projects.map((p) => {
          if (p.id === itemId) {
            return {
              ...p,
              name,
              status,
              completionDate: completionDate || "",
            };
          }
          return p;
        })
      );
    } else if (type === "room") {
      setProjects(
        projects.map((p) => {
          if (p.id === projectId) {
            return {
              ...p,
              rooms: (p.rooms || []).map((r) =>
                r.id === itemId ? { ...r, name: name.trim() } : r
              ),
            };
          }
          return p;
        })
      );
    } else if (type === "new_room") {
      if (name && name.trim()) {
        setProjects(
          projects.map((p) => {
            if (p.id === projectId) {
              const newRoom = { id: "room_" + Date.now(), name: name.trim() };
              return { ...p, rooms: [...(p.rooms || []), newRoom] };
            }
            return p;
          })
        );
      }
    } else if (type === "material") {
      setProjects(
        projects.map((p) => {
          if (p.id === projectId) {
            return {
              ...p,
              materials: p.materials.map((m) =>
                m.id === itemId ? { ...m, name } : m
              ),
            };
          }
          return p;
        })
      );
    } else if (type === "task") {
      const { priority, dependencies } = editItemModal;
      setProjects(
        projects.map((p) => {
          if (p.id === projectId) {
            return {
              ...p,
              tasks: p.tasks.map((t) =>
                t.id === itemId
                  ? {
                    ...t,
                    name,
                    priority: priority || "medium",
                    dependencies: dependencies || [],
                  }
                  : t
              ),
            };
          }
          return p;
        })
      );
    } else if (type === "meeting") {
      const { date } = editItemModal;
      const exists = schedule.some(
        (s) => s.date === date && s.id !== itemId && !s.completed
      );
      if (exists) {
        const proceed = window.confirm(
          "A meeting is already scheduled on this date. Do you still want to schedule another meeting?"
        );
        if (!proceed) return;
      }
      setSchedule(
        schedule.map((s) => {
          if (s.id === itemId) {
            return { ...s, title: name, date };
          }
          return s;
        })
      );
    } else if (type === "catalog_material") {
      const { price } = editItemModal;
      setMaterialCatalog(
        materialCatalog.map((item) =>
          item.id === itemId ? { ...item, name: name.trim(), price: price.trim() } : item
        )
      );
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
