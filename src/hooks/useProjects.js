import { useState, useMemo, useEffect } from 'react';
import { useOptimisticSync } from './useOptimisticSync';
import { useWorkspaceScope } from '../application/session';
import { projectRepository } from '../repositories/ProjectRepository';


export const useProjects = (activeProjectId, setActiveProjectId, setCustomConfirm, setIsNewProjModalOpen, setEditItemModal) => {
  const scope = useWorkspaceScope();

  const [projects, setProjects] = useState(() => {
    return scope.storage.getItem(scope.workspaceId, 'projects') || [];
  });

  const [deletedProjectIds, setDeletedProjectIds] = useState(() => {
    return scope.storage.getItem(scope.workspaceId, 'deleted_project_ids') || [];
  });

  useEffect(() => {
    const unsubProjects = scope.eventBus.on('projects.updated', (newProjects) => {
      setProjects(newProjects || []);
    });
    const unsubDeleted = scope.eventBus.on('projects.deleted.updated', (newIds) => {
      setDeletedProjectIds(newIds || []);
    });
    return () => {
      unsubProjects();
      unsubDeleted();
    };
  }, [scope.eventBus]);

  const { optimisticProjects, setOptimisticProjects, retrySync } = useOptimisticSync();

  // Auto-remove synced optimistic projects once they are resolved in Firestore projects
  useEffect(() => {
    if (optimisticProjects.length === 0) return;
    const syncedIds = optimisticProjects
      .filter(optProj => Array.isArray(projects) && projects.some(p => p.id === optProj.id || (p.tempId && p.tempId === optProj.id)))
      .map(optProj => optProj.id);
      
    if (syncedIds.length > 0) {
      setOptimisticProjects(prev => prev.filter(p => !syncedIds.includes(p.id)));
    }
  }, [projects, optimisticProjects, setOptimisticProjects]);

  // Merge Firestore projects with Optimistic projects for the UI
  const mergedProjects = useMemo(() => {
    // Start with all Firestore projects
    const merged = Array.isArray(projects) ? [...projects] : [];

    // For each optimistic project, either add it or overlay it on the existing one
    (optimisticProjects || []).forEach(optProj => {
      const existingIndex = merged.findIndex(p => p && (p.id === optProj.id || (p.tempId && p.tempId === optProj.id)));
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

  const handleAddProject = async (newProject) => {
    // Generate a temporary ID if one isn't provided (usually it will be in the project payload)
    const tempId = newProject.id || `temp_${Date.now()}`;
    const projectWithTempId = {
      ...newProject,
      id: tempId,
      syncStatus: 'pending', // Optimistically mark as pending
      syncState: newProject.syncState || 'LOCAL'
    };

    // We can add it directly to optimistic overlay, 
    // doing it here ensures instant UI feedback even before the API wrapper is called.
    setOptimisticProjects(prev => [projectWithTempId, ...prev]);
    setIsNewProjModalOpen(false);

    try {
      await projectRepository.create(scope.workspaceId, {
        tempId: tempId,
        name: newProject.name,
        status: newProject.status || 'not-started',
        description: newProject.description || '',
        rooms: newProject.rooms || [],
        materials: newProject.materials || [],
        tasks: newProject.tasks || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Failed to create project on startup:", err);
      // Mark as failed in optimistic sync so the user can retry
      setOptimisticProjects(prev => prev.map(p => 
        p.id === tempId ? { ...p, syncStatus: 'failed' } : p
      ));
    }

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

  const updateProjectInRepository = (projId, updatedData) => {
    if (!scope || !scope.workspaceId || !projId) return;
    projectRepository.update(scope.workspaceId, projId, updatedData)
      .catch(err => console.error(`Failed to update project ${projId} in repository:`, err));
  };

  const handleDeleteRoom = (e, roomId) => {
    e.stopPropagation();
    const targetProj = (Array.isArray(projects) ? projects : []).find(p => p.id === activeProjectId);
    if (!targetProj) return;

    setCustomConfirm({
      title: "Delete Room",
      message: "Are you sure you want to delete this room? Materials and Tasks assigned to this room will become unassigned.",
      onConfirm: () => {
        const updatedRooms = (targetProj.rooms || []).filter(r => r.id !== roomId);
        const updatedMaterials = (targetProj.materials || []).map(m => m.roomId === roomId ? { ...m, roomId: null } : m);
        const updatedTasks = (targetProj.tasks || []).map(t => t.roomId === roomId ? { ...t, roomId: null } : t);
        const nowStr = new Date().toISOString();

        setProjects(prev => (Array.isArray(prev) ? prev : []).map(p => {
          if (p.id === activeProjectId) {
            return {
              ...p,
              rooms: updatedRooms,
              materials: updatedMaterials,
              tasks: updatedTasks,
              updatedAt: nowStr,
            };
          }
          return p;
        }));
        updateProjectInRepository(activeProjectId, {
          rooms: updatedRooms,
          materials: updatedMaterials,
          tasks: updatedTasks,
          updatedAt: nowStr,
        });
      }
    });
  };

  // Move Project to Recycle Bin (Trash)
  const handleDeleteProject = (projId, e) => {
    if (e) e.stopPropagation(); // Stop navigation click
    setCustomConfirm({
      title: "Move Project to Trash",
      message: "Are you sure you want to move this project to the Recycle Bin (Trash)?",
      onConfirm: () => {
        const nowStr = new Date().toISOString();
        setProjects(prev =>
          (Array.isArray(prev) ? prev : []).map((p) =>
            p.id === projId ? { ...p, isTrashed: true, trashedAt: nowStr } : p
          )
        );
        if (activeProjectId === projId) {
          setActiveProjectId(null);
        }

        updateProjectInRepository(projId, {
          isTrashed: true,
          trashedAt: nowStr,
        });
      }
    });
  };

  // Update Project Status from details screen
  const handleProjectStatusChange = (projId, newStatus) => {
    const nowStr = new Date().toISOString();
    setProjects(prev =>
      (Array.isArray(prev) ? prev : []).map((p) => {
        if (p.id === projId) {
          return { ...p, status: newStatus, updatedAt: nowStr };
        }
        return p;
      })
    );
    updateProjectInRepository(projId, { status: newStatus, updatedAt: nowStr });
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
