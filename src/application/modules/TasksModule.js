import { workspaceRegistry, workspaceStorageService, workspaceReadinessManager, workspaceListenerManager, workspaceEventBus } from '../session';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, isConfigured } from '../../firebase';
import { APPLICATION } from '../../config/application';

export const TasksModule = {
  name: 'tasks',
  priority: 500,
  
  initialize: async (workspaceId) => {
    workspaceReadinessManager.createGate('tasks');
    
    // 1. Load from storage immediately for fast UI
    const storedTodos = workspaceStorageService.getItem(workspaceId, 'todos') || [];
    workspaceEventBus.emit('todos.updated', storedTodos);

    // 2. Setup Listeners via Listener Manager
    if (workspaceId && isConfigured) {
       // Ideally this should use workspaceId to scope tasks in Firestore.
       // For compatibility, if the backend still stores this by user email, we retrieve the email.
       const userEmail = localStorage.getItem(APPLICATION.storageKeys.userEmail);
       
       if (userEmail) {
           const cleanEmail = userEmail.toLowerCase().trim();
           const todosDocRef = doc(db, "users", cleanEmail, "private", "todos");
           
           const unsubTodos = onSnapshot(todosDocRef, (docSnap) => {
               try {
                   if (docSnap.exists()) {
                       const cloudData = docSnap.data();
                       if (cloudData.todos) {
                           workspaceStorageService.setItem(workspaceId, 'todos', cloudData.todos);
                           workspaceEventBus.emit('todos.updated', cloudData.todos);
                       }
                   }
               } catch (err) {
                   console.error("TasksModule: Error processing todos snapshot", err);
               }
           });
           
           workspaceListenerManager.register('tasks', 'todos-list', unsubTodos);
       }
    }
    
    workspaceReadinessManager.completeGate('tasks');
  },
  
  reset: async () => {},
  destroy: async () => {}
};

workspaceRegistry.register(TasksModule);
