import { useState, useEffect, useRef } from "react";
import { collection, onSnapshot, getDocs, doc, setDoc } from "firebase/firestore";
import { createProject, updateProject, deleteProject } from "../api/project.api";
import { APPLICATION } from "../config/application";

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
  schedule,
  setSchedule,
  todos,
  setTodos,
  materialCatalog,
  setMaterialCatalog,
  prevProjectsRef
}) => {
  const [hasLoadedProjectsFromCloud, setHasLoadedProjectsFromCloud] = useState(false);
  const [hasLoadedScheduleFromCloud, setHasLoadedScheduleFromCloud] = useState(false);
  const [hasLoadedTodosFromCloud, setHasLoadedTodosFromCloud] = useState(false);
  const [hasLoadedCatalogFromCloud, setHasLoadedCatalogFromCloud] = useState(false);
  
  const isRemoteChange = useRef(false);

  // Sync individual project document to cloud
  const syncProjectToCloud = async (project) => {
    if (!isConfigured || !db || !cloudSyncEnabled || !isAuthorized || !userEmail) return;
    try {
      // If it has an ID and it's NOT a temporary ID, it's an update
      if (project.id && !String(project.id).startsWith('temp_')) {
        await updateProject(project.id, {
          name: project.name,
          updatedAt: new Date().toISOString()
        });
      } else {
        await createProject({
          tempId: project.id, // Pass tempId so offlineQueue and backend (if needed) can track it
          name: project.name,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error(`Failed to sync project ${project.id} to cloud:`, err);
    }
  };

  // Delete individual project document from cloud and add to deleted_projects collection
  const deleteProjectFromCloud = async (projectId) => {
    if (!isConfigured || !db || !cloudSyncEnabled || !isAuthorized || !userEmail) return;
    try {
      await deleteProject(projectId);
    } catch (err) {
      console.error(`Failed to delete project ${projectId} from cloud:`, err);
    }
  };

  // Sync schedule/meetings to user-specific private document in cloud
  const syncScheduleToCloud = async (newSchedule) => {
    if (!isConfigured || !db || !cloudSyncEnabled || !isAuthorized || !userEmail) return;
    try {
      const cleanEmail = userEmail.toLowerCase().trim();
      const dataDocRef = doc(db, "users", cleanEmail, "private", "meetings");
      await setDoc(dataDocRef, {
        schedule: newSchedule,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.error("Failed to sync private schedule to cloud:", err);
    }
  };

  // Sync todos to user-specific private document in cloud
  const syncTodosToCloud = async (newTodos) => {
    if (!isConfigured || !db || !cloudSyncEnabled || !isAuthorized || !userEmail) return;
    try {
      const cleanEmail = userEmail.toLowerCase().trim();
      const dataDocRef = doc(db, "users", cleanEmail, "private", "todos");
      await setDoc(dataDocRef, {
        todos: newTodos,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.error("Failed to sync private todos to cloud:", err);
    }
  };

  // Sync material catalog to user-specific private document in cloud
  const syncCatalogToCloud = async (newCatalog) => {
    if (!isConfigured || !db || !cloudSyncEnabled || !isAuthorized || !userEmail) return;
    try {
      const cleanEmail = userEmail.toLowerCase().trim();
      const dataDocRef = doc(db, "users", cleanEmail, "private", "catalog");
      await setDoc(dataDocRef, {
        catalog: newCatalog,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.error("Failed to sync private catalog to cloud:", err);
    }
  };

  // Sync projects state to localStorage and cloud incrementally
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {

    if (isConfigured && db && cloudSyncEnabled && isAuthorized && userEmail && hasLoadedProjectsFromCloud) {
      if (!isRemoteChange.current) {
        const prevProjects = prevProjectsRef.current || [];
        
        projects.forEach(proj => {
          const prevProj = prevProjects.find(p => p.id === proj.id);
          if (!prevProj || JSON.stringify(proj) !== JSON.stringify(prevProj)) {
            syncProjectToCloud(proj);
          }
        });

        prevProjects.forEach(prevProj => {
          if (!projects.some(p => p.id === prevProj.id)) {
            deleteProjectFromCloud(prevProj.id);
          }
        });
      }
    } else if (!cloudSyncEnabled || !hasLoadedProjectsFromCloud) {
      if (!isRemoteChange.current) {
        projects.forEach(proj => {
          syncProjectToCloud(proj);
        });
      }
    }
    
    prevProjectsRef.current = projects;
  }, [projects, hasLoadedProjectsFromCloud, cloudSyncEnabled, isAuthorized, userEmail]);

  // Sync schedule state to localStorage and cloud
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!cloudSyncEnabled || hasLoadedScheduleFromCloud) {
      if (!isRemoteChange.current) {
        syncScheduleToCloud(schedule);
      }
    }
  }, [schedule, hasLoadedScheduleFromCloud, cloudSyncEnabled]);

  // Sync todos state to cloud
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!cloudSyncEnabled || hasLoadedTodosFromCloud) {
      if (!isRemoteChange.current) {
        syncTodosToCloud(todos);
      }
    }
  }, [todos, hasLoadedTodosFromCloud, cloudSyncEnabled]);

  // Sync catalog state
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!cloudSyncEnabled || hasLoadedCatalogFromCloud) {
      if (!isRemoteChange.current) {
        syncCatalogToCloud(materialCatalog);
      }
    }
  }, [materialCatalog, hasLoadedCatalogFromCloud, cloudSyncEnabled]);

  // Handle Firestore cloud database listeners
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    let unsubscribeUsers = () => { };
    
    if (!isConfigured || !db || !cloudSyncEnabled || !userEmail) {
      return;
    }

    try {
      const cleanEmail = userEmail.toLowerCase().trim();
      const usersCol = collection(db, "users");
      
      // Only User Role changes are kept here (RBAC)
      unsubscribeUsers = onSnapshot(usersCol, async (snapshot) => {
        const usersList = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          usersList.push({ email: docSnap.id, role: data.role || "editor" });

          if (docSnap.id.toLowerCase() === cleanEmail) {
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

    } catch (err) {
      console.error("Failed to initialize Firestore snapshot listeners:", err);
    }

    return () => {
      unsubscribeUsers();
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
