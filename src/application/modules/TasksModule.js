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

               // Standard merge (Refinement 8: Server timestamps win)
               todosList.forEach((cloudTodo) => {
                 const localTodo = localTodosMap.get(cloudTodo.id);
                 if (!localTodo) {
                   localTodosMap.set(cloudTodo.id, cloudTodo);
                 } else {
                   const localTime = localTodo.updatedAt ? new Date(localTodo.updatedAt).getTime() : 0;
                   const cloudTime = cloudTodo.updatedAt ? new Date(cloudTodo.updatedAt).getTime() : 0;
                   const localIsNewer = localTime >= cloudTime;
                   const base = localIsNewer ? localTodo : cloudTodo;
                   localTodosMap.set(cloudTodo.id, { ...base, ...cloudTodo }); // Cloud wins on conflict
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
