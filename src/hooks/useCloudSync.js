import { useState, useEffect, useRef } from "react";
import { collection, doc, setDoc, onSnapshot, deleteDoc, getDocs } from "firebase/firestore";

export const useCloudSync = ({
  db,
  isConfigured,
  cloudSyncEnabled,
  isAuthorized,
  userEmail,
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
      const projDocRef = doc(db, "projects", project.id);
      await setDoc(projDocRef, {
        ...project,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.error(`Failed to sync project ${project.id} to cloud:`, err);
    }
  };

  // Delete individual project document from cloud and add to deleted_projects collection
  const deleteProjectFromCloud = async (projectId) => {
    if (!isConfigured || !db || !cloudSyncEnabled || !isAuthorized || !userEmail) return;
    try {
      await deleteDoc(doc(db, "projects", projectId));
      await setDoc(doc(db, "deleted_projects", projectId), {
        deletedAt: new Date().toISOString()
      });
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
  useEffect(() => {
    localStorage.setItem("ipm_projects", JSON.stringify(projects));

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
  useEffect(() => {
    localStorage.setItem("ipm_schedule", JSON.stringify(schedule));
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
  useEffect(() => {
    localStorage.setItem("ipm_material_catalog", JSON.stringify(materialCatalog));
    if (!cloudSyncEnabled || hasLoadedCatalogFromCloud) {
      if (!isRemoteChange.current) {
        syncCatalogToCloud(materialCatalog);
      }
    }
  }, [materialCatalog, hasLoadedCatalogFromCloud, cloudSyncEnabled]);

  // Handle Firestore cloud database listeners
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    let unsubscribeUsers = () => { };
    let unsubscribeData = () => { };
    let unsubscribeDeleted = () => { };
    let unsubscribeSchedule = () => { };
    let unsubscribeTodos = () => { };
    let unsubscribeCatalog = () => { };

    if (!isConfigured || !db || !cloudSyncEnabled || !userEmail) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHasLoadedProjectsFromCloud(false);
      setHasLoadedScheduleFromCloud(false);
      setHasLoadedTodosFromCloud(false);
      setHasLoadedCatalogFromCloud(false);
      return;
    }

    try {
      const cleanEmail = userEmail.toLowerCase().trim();
      const usersCol = collection(db, "users");
      const projectsColRef = collection(db, "projects");
      const deletedColRef = collection(db, "deleted_projects");

      // 1. Listen for user role changes
      unsubscribeUsers = onSnapshot(usersCol, async (snapshot) => {
        snapshot.forEach((docSnap) => {
          if (docSnap.id.toLowerCase() === cleanEmail) {
            const data = docSnap.data();
            if (data.role === "super_admin" || data.role === "admin") {
              // Admin role verified
            }
          }
        });
      });

      // 2. Listen to deleted projects collection
      unsubscribeDeleted = onSnapshot(deletedColRef, (deletedSnap) => {
        try {
          const cloudDeletedIds = [];
          deletedSnap.forEach((docSnap) => {
            cloudDeletedIds.push(docSnap.id);
          });
          const savedDeletedRaw = localStorage.getItem("ipm_deleted_project_ids");
          const localDeletedIds = savedDeletedRaw ? JSON.parse(savedDeletedRaw) : [];
          
          if (JSON.stringify(localDeletedIds.sort()) !== JSON.stringify(cloudDeletedIds.sort())) {
            const combined = [...new Set([...localDeletedIds, ...cloudDeletedIds])];
            localStorage.setItem("ipm_deleted_project_ids", JSON.stringify(combined));
          }
        } catch (err) {
          console.error("Error processing deleted projects snapshot:", err);
        }
      });

      // 3. Listen to active projects updates
      unsubscribeData = onSnapshot(projectsColRef, (querySnapshot) => {
        try {
          isRemoteChange.current = true;

          const cloudProjects = [];
          querySnapshot.forEach((docSnap) => {
            cloudProjects.push({ ...docSnap.data(), id: docSnap.id });
          });

          setProjects((prevProjects) => {
            const savedDeletedRaw = localStorage.getItem("ipm_deleted_project_ids");
            const currentDeletedIds = savedDeletedRaw ? JSON.parse(savedDeletedRaw) : [];

            const allProjectsMap = new Map();

            prevProjects.forEach((p) => {
              if (!currentDeletedIds.includes(p.id)) {
                allProjectsMap.set(p.id, p);
              }
            });

            cloudProjects.forEach((cloudProj) => {
              if (currentDeletedIds.includes(cloudProj.id)) return;

              const localProj = allProjectsMap.get(cloudProj.id);
              if (!localProj) {
                allProjectsMap.set(cloudProj.id, cloudProj);
              } else {
                const localTime = localProj.updatedAt ? new Date(localProj.updatedAt).getTime() : 0;
                const cloudTime = cloudProj.updatedAt ? new Date(cloudProj.updatedAt).getTime() : 0;

                const localIsNewer = localTime >= cloudTime;
                const baseProj = localIsNewer ? localProj : cloudProj;
                const otherProj = localIsNewer ? cloudProj : localProj;

                const baseMaterials = baseProj.materials || [];
                const otherMaterials = otherProj.materials || [];
                const mergedMaterials = [...baseMaterials];
                otherMaterials.forEach((item) => {
                  if (!baseMaterials.some((m) => m.id === item.id)) {
                    mergedMaterials.push(item);
                  }
                });

                const baseTasks = baseProj.tasks || [];
                const otherTasks = otherProj.tasks || [];
                const mergedTasks = [...baseTasks];
                otherTasks.forEach((item) => {
                  if (!baseTasks.some((t) => t.id === item.id)) {
                    mergedTasks.push(item);
                  }
                });

                allProjectsMap.set(cloudProj.id, {
                  ...baseProj,
                  materials: mergedMaterials,
                  tasks: mergedTasks
                });
              }
            });

            const mergedList = Array.from(allProjectsMap.values());
            localStorage.setItem("ipm_projects", JSON.stringify(mergedList));

            mergedList.forEach((p) => {
              const inCloud = cloudProjects.some((cp) => cp.id === p.id);
              if (!inCloud) {
                setTimeout(() => {
                  syncProjectToCloud(p);
                }, 200);
              }
            });

            currentDeletedIds.forEach((deletedId) => {
              const inCloud = cloudProjects.some((cp) => cp.id === deletedId);
              if (inCloud) {
                setTimeout(() => {
                  deleteProjectFromCloud(deletedId);
                }, 200);
              }
            });

            prevProjectsRef.current = mergedList;
            return mergedList;
          });

          setTimeout(() => {
            isRemoteChange.current = false;
          }, 100);
          setHasLoadedProjectsFromCloud(true);

          const backupsColRef = collection(db, "users", cleanEmail, "backups");
          getDocs(backupsColRef).then((querySnapshot) => {
            const cloudBackups = [];
            querySnapshot.forEach((docSnap) => {
              cloudBackups.push(docSnap.data());
            });
            cloudBackups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            localStorage.setItem("ipm_projects_backups_daily", JSON.stringify(cloudBackups));
          }).catch((err) => console.error("Error syncing cloud backups list:", err));
        } catch (err) {
          console.error("Error processing projects collection snapshot:", err);
        }
      }, (error) => {
        console.error("Error listening to projects updates:", error);
      });

      // 4. Listen to real-time private schedule sync edits
      const scheduleDocRef = doc(db, "users", cleanEmail, "private", "meetings");
      unsubscribeSchedule = onSnapshot(scheduleDocRef, (docSnap) => {
        try {
          if (docSnap.exists()) {
            const cloudData = docSnap.data();

            isRemoteChange.current = true;

            if (cloudData.schedule) {
              setSchedule(cloudData.schedule);
              localStorage.setItem("ipm_schedule", JSON.stringify(cloudData.schedule));
            }

            setTimeout(() => {
              isRemoteChange.current = false;
            }, 100);
          }
          setHasLoadedScheduleFromCloud(true);
        } catch (err) {
          console.error("Error processing private schedule snapshot:", err);
        }
      }, (error) => {
        console.error("Error listening to private schedule updates:", error);
      });

      // 5. Listen to real-time private todos sync edits
      const todosDocRef = doc(db, "users", cleanEmail, "private", "todos");
      unsubscribeTodos = onSnapshot(todosDocRef, (docSnap) => {
        try {
          if (docSnap.exists()) {
            const cloudData = docSnap.data();

            isRemoteChange.current = true;

            if (cloudData.todos) {
              setTodos(cloudData.todos);
            }

            setTimeout(() => {
              isRemoteChange.current = false;
            }, 100);
          }
          setHasLoadedTodosFromCloud(true);
        } catch (err) {
          console.error("Error processing private todos snapshot:", err);
        }
      }, (error) => {
        console.error("Error listening to private todos updates:", error);
      });

      // 6. Listen to real-time private catalog sync edits
      const catalogDocRef = doc(db, "users", cleanEmail, "private", "catalog");
      unsubscribeCatalog = onSnapshot(catalogDocRef, (docSnap) => {
        try {
          if (docSnap.exists()) {
            const cloudData = docSnap.data();

            isRemoteChange.current = true;

            if (cloudData.catalog) {
              setMaterialCatalog(cloudData.catalog);
              localStorage.setItem("ipm_material_catalog", JSON.stringify(cloudData.catalog));
            }

            setTimeout(() => {
              isRemoteChange.current = false;
            }, 100);
          }
          setHasLoadedCatalogFromCloud(true);
        } catch (err) {
          console.error("Error processing private catalog snapshot:", err);
        }
      }, (error) => {
        console.error("Error listening to private catalog updates:", error);
      });

    } catch (err) {
      console.error("Failed to initialize Firestore snapshot listeners:", err);
    }

    return () => {
      unsubscribeUsers();
      unsubscribeData();
      unsubscribeDeleted();
      unsubscribeSchedule();
      unsubscribeTodos();
      unsubscribeCatalog();
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
