import { workspaceRegistry, workspaceStorageService, workspaceReadinessManager, workspaceListenerManager, workspaceEventBus } from '../session';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db, isConfigured } from '../../firebase';
import { EntityIdentityResolver } from '../utils/EntityIdentityResolver';

export const ProjectsModule = {
  name: 'projects',
  priority: 400,
  
  initialize: async (workspaceId) => {
    if (!workspaceId) {
      throw new Error("ProjectsModule: Cannot initialize without a valid workspaceId.");
    }

    workspaceReadinessManager.createGate('projects');
    
    // 1. Load from storage immediately for fast UI
    const stored = workspaceStorageService.getItem(workspaceId, 'projects') || [];
    workspaceEventBus.emit('projects.updated', stored);

    const storedDeleted = workspaceStorageService.getItem(workspaceId, 'deleted_project_ids') || [];
    workspaceEventBus.emit('projects.deleted.updated', storedDeleted);

    // 2. Setup Listeners via Listener Manager
    if (isConfigured) {
       const projectsColRef = collection(db, 'workspaces', workspaceId, 'projects');
       const deletedColRef = collection(db, 'workspaces', workspaceId, 'deleted_projects');
       const projectsQuery = projectsColRef; // Assuming DB rules or query handles this for now.

       const unsubDeleted = onSnapshot(deletedColRef, (deletedSnap) => {
           try {
               const cloudDeletedIds = [];
               deletedSnap.forEach((docSnap) => cloudDeletedIds.push(docSnap.id));
               
               const localDeletedIds = workspaceStorageService.getItem(workspaceId, 'deleted_project_ids') || [];
               
               if (JSON.stringify(localDeletedIds.sort()) !== JSON.stringify(cloudDeletedIds.sort())) {
                   const combined = [...new Set([...localDeletedIds, ...cloudDeletedIds])];
                   workspaceStorageService.setItem(workspaceId, 'deleted_project_ids', combined);
                   workspaceEventBus.emit('projects.deleted.updated', combined);
               }
           } catch (err) {
               console.error("ProjectsModule: Error processing deleted projects", err);
           }
       });

       const unsubProjects = onSnapshot(projectsQuery, (querySnapshot) => {
            try {
                const cloudProjects = [];
                querySnapshot.forEach((docSnap) => {
                    const data = docSnap.data();
                    
                    // Refinement 14: Read Model Validation
                    const isValid = 
                      data && 
                      typeof data.name === 'string' && 
                      data.name.trim().length > 0 &&
                      (data.status !== 'deleted');

                    if (isValid) {
                        cloudProjects.push({ ...data, id: docSnap.id });
                    } else if (data && data.status !== 'deleted') {
                        console.warn(`[ProjectsModule] Ignored malformed project document: ${docSnap.id}`, data);
                    }
                });

                const currentDeletedIds = workspaceStorageService.getItem(workspaceId, 'deleted_project_ids') || [];
                const prevProjects = workspaceStorageService.getItem(workspaceId, 'projects') || [];
                
                const allProjectsMap = new Map();
                prevProjects.forEach((p) => {
                    // Exclude permanently-deleted IDs (keep locally-trashed projects in read model for Trash view)
                    if (!currentDeletedIds.includes(p.id)) {
                        allProjectsMap.set(p.id, p);
                    }
                });

                // Pass 1: Resolve temporary IDs (using shared resolver)
                EntityIdentityResolver.resolve(allProjectsMap, cloudProjects);

                // Pass 2: Standard merge
                cloudProjects.forEach((cloudProj) => {
                    if (currentDeletedIds.includes(cloudProj.id)) return;

                    const localProj = allProjectsMap.get(cloudProj.id);
                    if (!localProj) {
                        allProjectsMap.set(cloudProj.id, { ...cloudProj, syncState: "SYNCED" });
                    } else {
                        const localTime = localProj.updatedAt ? new Date(localProj.updatedAt).getTime() : 0;
                        const cloudTime = cloudProj.updatedAt ? new Date(cloudProj.updatedAt).getTime() : 0;

                        const localIsNewer = localTime >= cloudTime;


                        // When local is newer, trust local task/material state.
                        // When cloud is newer, trust cloud task/material state.
                        // This prevents completed tasks from being stomped by stale server state.
                        const mergedProject = localIsNewer
                          ? {
                              // Local wins: keep local task/material state
                              ...cloudProj,    // start with cloud for metadata (name, status, etc.)
                              ...localProj,    // local overrides all (is more recent)
                              // Merge arrays: local is base, add any NEW cloud items not in local
                              materials: (() => {
                                const base = localProj.materials || [];
                                const cloudItems = cloudProj.materials || [];
                                const merged = [...base];
                                cloudItems.forEach(item => {
                                  if (!base.some(m => m.id === item.id)) merged.push(item);
                                });
                                return merged;
                              })(),
                              tasks: (() => {
                                const base = localProj.tasks || [];
                                const cloudItems = cloudProj.tasks || [];
                                const merged = [...base];
                                cloudItems.forEach(item => {
                                  if (!base.some(t => t.id === item.id)) merged.push(item);
                                });
                                return merged;
                              })(),
                              syncState: localProj.syncState !== 'SYNCED' ? localProj.syncState : 'SYNCED',
                            }
                          : {
                              // Cloud wins: trust cloud completely (newer server data)
                              ...cloudProj,
                              syncState: 'SYNCED',
                            };

                        allProjectsMap.set(cloudProj.id, mergedProject);
                    }
                });

               const mergedFinal = Array.from(allProjectsMap.values());
               if (JSON.stringify(mergedFinal) !== JSON.stringify(prevProjects)) {
                   workspaceStorageService.setItem(workspaceId, 'projects', mergedFinal);
                   workspaceEventBus.emit('projects.updated', mergedFinal);
               }
           } catch (err) {
               console.error("ProjectsModule: Error processing active projects", err);
           }
       });
       
       workspaceListenerManager.register('projects', 'deleted-projects-list', unsubDeleted);
       workspaceListenerManager.register('projects', 'active-projects-list', unsubProjects);
    }
    
    workspaceReadinessManager.completeGate('projects');
  },
  
  reset: async () => {},
  destroy: async () => {}
};

workspaceRegistry.register(ProjectsModule);
