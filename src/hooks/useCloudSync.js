import { useState, useEffect, useRef } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { projectRepository } from "../repositories/ProjectRepository";
import { APPLICATION } from "../config/application";
import { auth } from "../firebase";
import { workspaceListenerManager } from "../application/session";

export const useCloudSync = ({
  db,
  isConfigured,
  cloudSyncEnabled,
  isAuthorized,
  userEmail,
  setUserRole,
  setAuthorizedUsers,
  projects,
  setProjects,
  deletedProjectIds,
  schedule, // kept for backward compatibility signature if needed, but not synced
  setSchedule,
  todos,
  setTodos,
  materialCatalog,
  setMaterialCatalog,
  prevProjectsRef
}) => {
  const [hasLoadedProjectsFromCloud, setHasLoadedProjectsFromCloud] = useState(true);
  const [hasLoadedScheduleFromCloud, setHasLoadedScheduleFromCloud] = useState(true);
  const [hasLoadedTodosFromCloud, setHasLoadedTodosFromCloud] = useState(true);
  const [hasLoadedCatalogFromCloud, setHasLoadedCatalogFromCloud] = useState(true);
  
  const isRemoteChange = useRef(false);

  // Sync individual project document to cloud via ProjectRepository
  const syncProjectToCloud = async (project) => {
    if (!isConfigured || !db || !cloudSyncEnabled || !isAuthorized || !userEmail) return;
    const activeWorkspaceId = localStorage.getItem(APPLICATION.storageKeys.activeWorkspaceId);
    if (!activeWorkspaceId) return;

    try {
      const isTempId = !project.id || 
                       String(project.id).startsWith('temp_') || 
                       /^\d+$/.test(String(project.id));

      if (project.id && !isTempId) {
        await projectRepository.update(activeWorkspaceId, project.id, {
          name: project.name,
          status: project.status || 'not-started',
          description: project.description || '',
          completionDate: project.completionDate || '',
          isTrashed: project.isTrashed || false,
          trashedAt: project.trashedAt || undefined,
          rooms: project.rooms || [],
          materials: project.materials || [],
          tasks: project.tasks || [],
          updatedAt: new Date().toISOString()
        });
      } else {
        await projectRepository.create(activeWorkspaceId, {
          id: project.id,
          name: project.name,
          status: project.status || 'not-started',
          description: project.description || '',
          completionDate: project.completionDate || '',
          isTrashed: project.isTrashed || false,
          trashedAt: project.trashedAt || undefined,
          rooms: project.rooms || [],
          materials: project.materials || [],
          tasks: project.tasks || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error(`Failed to sync project ${project.id} to cloud:`, err);
    }
  };

  const deleteProjectFromCloud = async (projectId) => {
    if (!isConfigured || !db || !cloudSyncEnabled || !isAuthorized || !userEmail) return;
    const activeWorkspaceId = localStorage.getItem(APPLICATION.storageKeys.activeWorkspaceId);
    if (!activeWorkspaceId) return;

    try {
      await projectRepository.delete(activeWorkspaceId, projectId);
    } catch (err) {
      console.error(`Failed to delete project ${projectId} from cloud:`, err);
    }
  };

  // Background auto-saving effect removed in accordance with Rule 3 ("React state NEVER automatically persists")
  // and Rule 4 ("Only explicit user actions trigger repository writes").
  // Explicit user actions in useProjects and useProjectItems now call projectRepository directly.
  useEffect(() => {
    if (prevProjectsRef) {
      prevProjectsRef.current = projects;
    }
  }, [projects, prevProjectsRef]);


  // Handle Firestore cloud database listeners (members only)
  useEffect(() => {
    let unsubscribeMembers = () => { };
    
    if (!isConfigured || !db || !cloudSyncEnabled || !userEmail) {
      return;
    }

    try {
      const activeWorkspaceId = localStorage.getItem(APPLICATION.storageKeys.activeWorkspaceId);
      
      if (activeWorkspaceId) {
        const membersCol = collection(db, "workspaces", activeWorkspaceId, "members");
        
        unsubscribeMembers = onSnapshot(membersCol, (snapshot) => {
          const usersList = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const emailVal = data.email || "";
            usersList.push({ email: emailVal, role: data.role || "editor", status: data.status || "active", name: data.name || "" });

            if (auth.currentUser && docSnap.id === auth.currentUser.uid) {
              const fetchedRole = data.role || "editor";
              if (setUserRole) {
                setUserRole(fetchedRole);
              }
              localStorage.setItem(APPLICATION.storageKeys.userRole, fetchedRole);
            }
          });
          
          if (setAuthorizedUsers) {
            setAuthorizedUsers(usersList);
          }
        });

        workspaceListenerManager.register('members', 'members-list', unsubscribeMembers);
      }

    } catch (err) {
      console.error("Failed to initialize Firestore workspace members listener:", err);
    }

    return () => {
      workspaceListenerManager.unregister('members', 'members-list');
    };
  }, [cloudSyncEnabled, userEmail, isConfigured, isAuthorized, db]);

  return {
    hasLoadedProjectsFromCloud,
    setHasLoadedProjectsFromCloud,
    hasLoadedScheduleFromCloud,
    setHasLoadedScheduleFromCloud,
    hasLoadedTodosFromCloud,
    setHasLoadedTodosFromCloud,
    hasLoadedCatalogFromCloud,
    setHasLoadedCatalogFromCloud,
    syncProjectToCloud,
    deleteProjectFromCloud
  };
};
