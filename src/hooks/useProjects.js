import { useState, useMemo } from 'react';
import { useOptimisticSync } from './useOptimisticSync';

export const useProjects = (activeProjectId, setActiveProjectId, setCustomConfirm, setIsNewProjModalOpen, setEditItemModal) => {
  const [projects, setProjects] = useState(() => {
    const saved = localStorage.getItem("ipm_projects");
    return saved ? JSON.parse(saved) : [];
  });

  const [deletedProjectIds, setDeletedProjectIds] = useState(() => {
    const saved = localStorage.getItem("ipm_deleted_project_ids");
    return saved ? JSON.parse(saved) : [];
  });

  const { optimisticProjects, setOptimisticProjects, retrySync } = useOptimisticSync();

  // Merge Firestore projects with Optimistic projects for the UI
  const mergedProjects = useMemo(() => {
    // Start with all Firestore projects
    const merged = [...projects];

    // For each optimistic project, either add it or overlay it on the existing one
    optimisticProjects.forEach(optProj => {
      const existingIndex = merged.findIndex(p => p.id === optProj.id);
      if (existingIndex >= 0) {
        // Overlay properties (optProj takes precedence)
        merged[existingIndex] = { ...merged[existingIndex], ...optProj };
      } else {
        // Add new optimistic project
        merged.unshift(optProj); // Put new ones at the top
      }
    });

    return merged;
  }, [projects, optimisticProjects]);

  const handleAddProject = (newProject) => {
    // Generate a temporary ID if one isn't provided (usually it will be in the project payload)
    const projectWithTempId = {
      ...newProject,
      id: newProject.id || `temp_${Date.now()}`,
      syncStatus: 'pending', // Optimistically mark as pending
      syncState: newProject.syncState || 'LOCAL'
    };

    // We can add it directly to optimistic overlay, 
    // though the offlineQueue will also dispatch it if it queues.
    // Doing it here ensures instant UI feedback even before the API wrapper is called.
    setOptimisticProjects(prev => [projectWithTempId, ...prev]);
    setIsNewProjModalOpen(false);
    return projectWithTempId; // Return so the caller can send it to the API
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
    projects: mergedProjects, // Expose the merged list to the UI
    setProjects, // used by onSnapshot to update the base firestore data
    deletedProjectIds,
    setDeletedProjectIds,
    handleAddProject,
    handleAddRoomToExistingProject,
    handleEditRoom,
    handleDeleteRoom,
    handleDeleteProject,
    handleProjectStatusChange,
    retrySync
  };
};
