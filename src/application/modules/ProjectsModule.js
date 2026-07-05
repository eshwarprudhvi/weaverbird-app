import { workspaceRegistry, workspaceStorageService, workspaceReadinessManager, workspaceListenerManager, workspaceEventBus } from '../session';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db, isConfigured } from '../../firebase';

export const ProjectsModule = {
  name: 'projects',
  priority: 400,
  
  initialize: async (workspaceId) => {
    workspaceReadinessManager.createGate('projects');
    
    // 1. Load from storage immediately for fast UI
    const stored = workspaceStorageService.getItem(workspaceId, 'projects') || [];
    workspaceEventBus.emit('projects.updated', stored);

    const storedDeleted = workspaceStorageService.getItem(workspaceId, 'deleted_project_ids') || [];
    workspaceEventBus.emit('projects.deleted.updated', storedDeleted);

    // 2. Setup Listeners via Listener Manager
    if (workspaceId && isConfigured) {
       const projectsColRef = collection(db, 'projects');
       const deletedColRef = collection(db, 'deleted_projects');
       
       // In a real multi-tenant scenario, we must scope queries by workspaceId
       // const projectsQuery = query(projectsColRef, where("workspaceId", "==", workspaceId));
       // For compatibility right now we just grab the collection if it's not scoped yet.
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
                   cloudProjects.push({ ...docSnap.data(), id: docSnap.id });
               });

               const currentDeletedIds = workspaceStorageService.getItem(workspaceId, 'deleted_project_ids') || [];
               const prevProjects = workspaceStorageService.getItem(workspaceId, 'projects') || [];
               
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
                       allProjectsMap.set(cloudProj.id, { ...cloudProj, syncState: "SYNCED" });
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
                           tasks: mergedTasks,
                           syncState: localIsNewer && localProj.syncState !== "SYNCED" ? localProj.syncState : "SYNCED",
                       });
                   }
               });

               const mergedFinal = Array.from(allProjectsMap.values());
               workspaceStorageService.setItem(workspaceId, 'projects', mergedFinal);
               workspaceEventBus.emit('projects.updated', mergedFinal);
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
