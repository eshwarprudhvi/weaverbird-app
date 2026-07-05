import { workspaceRegistry, workspaceStorageService, workspaceReadinessManager, workspaceListenerManager, workspaceEventBus } from '../session';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, isConfigured } from '../../firebase';
import { APPLICATION } from '../../config/application';

export const ScheduleModule = {
  name: 'schedule',
  priority: 600,
  
  initialize: async (workspaceId) => {
    workspaceReadinessManager.createGate('schedule');
    
    const storedSchedule = workspaceStorageService.getItem(workspaceId, 'schedule') || [];
    workspaceEventBus.emit('schedule.updated', storedSchedule);

    if (workspaceId && isConfigured) {
       const userEmail = localStorage.getItem(APPLICATION.storageKeys.userEmail);
       
       if (userEmail) {
           const cleanEmail = userEmail.toLowerCase().trim();
           const scheduleDocRef = doc(db, "users", cleanEmail, "private", "meetings");
           
           const unsubSchedule = onSnapshot(scheduleDocRef, (docSnap) => {
               try {
                   if (docSnap.exists()) {
                       const cloudData = docSnap.data();
                       if (cloudData.schedule) {
                           workspaceStorageService.setItem(workspaceId, 'schedule', cloudData.schedule);
                           workspaceEventBus.emit('schedule.updated', cloudData.schedule);
                       }
                   }
               } catch (err) {
                   console.error("ScheduleModule: Error processing schedule snapshot", err);
               }
           });
           
           workspaceListenerManager.register('schedule', 'meetings-list', unsubSchedule);
       }
    }
    
    workspaceReadinessManager.completeGate('schedule');
  },
  
  reset: async () => {},
  destroy: async () => {}
};

workspaceRegistry.register(ScheduleModule);
