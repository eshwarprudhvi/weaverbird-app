import { workspaceRegistry, workspaceStorageService, workspaceReadinessManager, workspaceListenerManager, workspaceEventBus } from '../session';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, isConfigured } from '../../firebase';
import { EntityIdentityResolver } from '../utils/EntityIdentityResolver';

export const TasksModule = {
  name: 'tasks',
  priority: 500,
  
  initialize: async (workspaceId) => {
    if (!workspaceId) {
      throw new Error("TasksModule: Cannot initialize without a valid workspaceId.");
    }

    workspaceReadinessManager.createGate('tasks');
    
    // 1. Load from storage immediately for fast UI
    const storedTodos = workspaceStorageService.getItem(workspaceId, 'todos') || [];
    workspaceEventBus.emit('todos.updated', storedTodos);

    // 2. Setup Listeners via Listener Manager
    if (isConfigured) {
       const tasksColRef = collection(db, 'workspaces', workspaceId, 'tasks');
       
       const unsubTodos = onSnapshot(tasksColRef, (querySnapshot) => {
           try {
               const todosList = [];
               querySnapshot.forEach((docSnap) => {
                   const data = docSnap.data();
                   
                   // Refinement 14: Read Model Validation
                   const isValid = 
                     data && 
                     (typeof data.text === 'string' || typeof data.title === 'string') &&
                     (data.status !== 'deleted');

                   if (isValid) {
                       todosList.push({ id: docSnap.id, ...data });
                   } else if (data && data.status !== 'deleted') {
                       console.warn(`[TasksModule] Ignored malformed task document: ${docSnap.id}`, data);
                   }
               });

               // Sort: Newest first
               todosList.sort((a, b) => {
                 const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                 const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                 return bTime - aTime;
               });

               // TempId resolution
               const prevTodos = workspaceStorageService.getItem(workspaceId, 'todos') || [];
               const localTodosMap = new Map();
               prevTodos.forEach(t => localTodosMap.set(t.id, t));

               EntityIdentityResolver.resolve(localTodosMap, todosList);

               // Prune items that have been hard deleted from Firestore
               const cloudIds = new Set(todosList.map(i => i.id));
               for (const key of localTodosMap.keys()) {
                 if (!cloudIds.has(key)) {
                   localTodosMap.delete(key);
                 }
               }

               const parseTime = (val) => {
                 if (!val) return 0;
                 if (val.toDate && typeof val.toDate === 'function') return val.toDate().getTime();
                 if (typeof val.seconds === 'number') return val.seconds * 1000 + Math.floor((val.nanoseconds || 0) / 1000000);
                 const d = new Date(val);
                 return isNaN(d.getTime()) ? 0 : d.getTime();
               };

               // Standard merge (Refinement 8: Server timestamps win)
               todosList.forEach((cloudTodo) => {
                 const localTodo = localTodosMap.get(cloudTodo.id);
                 if (!localTodo) {
                   localTodosMap.set(cloudTodo.id, cloudTodo);
                 } else {
                   const localTime = parseTime(localTodo.updatedAt);
                   const cloudTime = parseTime(cloudTodo.updatedAt);
                   const localIsNewer = localTime > cloudTime;
                   const merged = localIsNewer ? { ...cloudTodo, ...localTodo } : { ...localTodo, ...cloudTodo };
                   localTodosMap.set(cloudTodo.id, merged);
                 }
               });

               const mergedFinal = Array.from(localTodosMap.values()).filter(t => t.status !== 'deleted');
               
               workspaceStorageService.setItem(workspaceId, 'todos', mergedFinal);
               workspaceEventBus.emit('todos.updated', mergedFinal);
           } catch (err) {
               console.error("TasksModule: Error processing tasks snapshot", err);
           }
       });
       
       workspaceListenerManager.register('tasks', 'todos-list', unsubTodos);
    }
    
    workspaceReadinessManager.completeGate('tasks');
  },
  
  reset: async () => {},
  destroy: async () => {}
};

workspaceRegistry.register(TasksModule);
