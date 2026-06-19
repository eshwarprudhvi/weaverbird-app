import { useState } from 'react';

export const useProjects = (activeProjectId, setActiveProjectId, setCustomConfirm, setIsNewProjModalOpen, setEditItemModal) => {
  const [projects, setProjects] = useState(() => {
    const saved = localStorage.getItem("ipm_projects");
    return saved ? JSON.parse(saved) : [];
  });

  const [deletedProjectIds, setDeletedProjectIds] = useState(() => {
    const saved = localStorage.getItem("ipm_deleted_project_ids");
    return saved ? JSON.parse(saved) : [];
  });


  const handleAddProject = (newProject) => {
    setProjects([newProject, ...projects]);
    setIsNewProjModalOpen(false);
  };

  const handleAddRoomToExistingProject = () => {
    setEditItemModal({
      type: "new_room",
      projectId: activeProjectId,
      name: ""
    });
  };

  const handleEditRoom = (e, roomId, currentName) => {
    e.stopPropagation();
    setEditItemModal({
      type: "room",
      projectId: activeProjectId,
      itemId: roomId,
      name: currentName
    });
  };

  const handleDeleteRoom = (e, roomId) => {
    e.stopPropagation();
    setCustomConfirm({
      title: "Delete Room",
      message: "Are you sure you want to delete this room? Materials and Tasks assigned to this room will become unassigned.",
      onConfirm: () => {
        setProjects(projects.map(p => {
          if (p.id === activeProjectId) {
            return {
              ...p,
              rooms: (p.rooms || []).filter(r => r.id !== roomId),
              materials: (p.materials || []).map(m => m.roomId === roomId ? { ...m, roomId: null } : m),
              tasks: (p.tasks || []).map(t => t.roomId === roomId ? { ...t, roomId: null } : t),
            };
          }
          return p;
        }));
      }
    });
  };


  // Delete Project (Move to Recycle Bin)
  const handleDeleteProject = (projId, e) => {
    if (e) e.stopPropagation(); // Stop navigation click
    setCustomConfirm({
      title: "Move Project to Trash",
      message: "Are you sure you want to move this project to the Recycle Bin (Trash)?",
      onConfirm: () => {
        setProjects(
          projects.map((p) => {
            if (p.id === projId) {
              return { ...p, isTrashed: true, trashedAt: new Date().toISOString() };
            }
            return p;
          })
        );
        if (activeProjectId === projId) {
          setActiveProjectId(null);
        }
      }
    });
  };

  // Update Project Status from details screen
  const handleProjectStatusChange = (projId, newStatus) => {
    setProjects(
      projects.map((p) => {
        if (p.id === projId) {
          return { ...p, status: newStatus };
        }
        return p;
      })
    );
  };



  return {
    projects,
    setProjects,
    deletedProjectIds,
    setDeletedProjectIds,
    handleAddProject,
    handleAddRoomToExistingProject,
    handleEditRoom,
    handleDeleteRoom,
    handleDeleteProject,
    handleProjectStatusChange
  };
};
