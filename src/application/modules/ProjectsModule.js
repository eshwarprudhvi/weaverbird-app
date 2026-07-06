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
                 const deletedFromCloud = [];

                 querySnapshot.forEach((docSnap) => {
                     const data = docSnap.data();
                     
                     if (data && data.status === 'deleted') {
                         deletedFromCloud.push(docSnap.id);
                         if (data.tempId) deletedFromCloud.push(data.tempId);
                         return;
                     }
                     
                     // Refinement 14: Read Model Validation
                     const isValid = 
                       data && 
                       typeof data.name === 'string' && 
                       data.name.trim().length > 0;

                     if (isValid) {
                         cloudProjects.push({ ...data, id: docSnap.id });
                     } else {
                         console.warn(`[ProjectsModule] Ignored malformed project document: ${docSnap.id}`, data);
                     }
                 });

                 const currentDeletedIds = workspaceStorageService.getItem(workspaceId, 'deleted_project_ids') || [];
                 const combinedDeletedIds = [...new Set([...currentDeletedIds, ...deletedFromCloud])];
                 
                 if (JSON.stringify(currentDeletedIds.sort()) !== JSON.stringify(combinedDeletedIds.sort())) {
                     workspaceStorageService.setItem(workspaceId, 'deleted_project_ids', combinedDeletedIds);
                     workspaceEventBus.emit('projects.deleted.updated', combinedDeletedIds);
                 }

                 const prevProjects = workspaceStorageService.getItem(workspaceId, 'projects') || [];
                 
                 const allProjectsMap = new Map();
                 prevProjects.forEach((p) => {
                     // Exclude permanently-deleted IDs (keep locally-trashed projects in read model for Trash view)
                     if (!combinedDeletedIds.includes(p.id)) {
                         allProjectsMap.set(p.id, p);
                     }
                 });

                 // Pass 1: Resolve temporary IDs (using shared resolver)
                 EntityIdentityResolver.resolve(allProjectsMap, cloudProjects);

                 // Pass 2: Standard merge
                 const parseTime = (val) => {
                     if (!val) return 0;
                     if (val.toDate && typeof val.toDate === 'function') return val.toDate().getTime();
                     if (typeof val.seconds === 'number') return val.seconds * 1000 + Math.floor((val.nanoseconds || 0) / 1000000);
                     const d = new Date(val);
                     return isNaN(d.getTime()) ? 0 : d.getTime();
                 };

                 cloudProjects.forEach((cloudProj) => {
                     if (combinedDeletedIds.includes(cloudProj.id)) return;

                     const localProj = allProjectsMap.get(cloudProj.id);
                     if (!localProj) {
                         allProjectsMap.set(cloudProj.id, { ...cloudProj, syncState: "SYNCED" });
                     } else {
                         const localTime = parseTime(localProj.updatedAt);
                         const cloudTime = parseTime(cloudProj.updatedAt);

                         // Only trust local if it has pending changes and is strictly newer
                         const localIsNewer = localProj.syncState !== 'SYNCED' && localTime > cloudTime;

                         const mergedProject = localIsNewer
                           ? {
                               ...cloudProj,    // start with cloud for metadata
                               ...localProj,    // local overrides all
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
                               syncState: localProj.syncState,
                             }
                           : {
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
