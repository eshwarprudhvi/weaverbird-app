import { workspaceRegistry, workspaceStorageService, workspaceReadinessManager, workspaceListenerManager, workspaceEventBus } from '../session';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, isConfigured } from '../../firebase';
import { EntityIdentityResolver } from '../utils/EntityIdentityResolver';

export const MeetingsModule = {
  name: 'meetings',
  priority: 600,
  
  initialize: async (workspaceId) => {
    if (!workspaceId) {
      throw new Error("MeetingsModule: Cannot initialize without a valid workspaceId.");
    }

    workspaceReadinessManager.createGate('meetings');
    
    const storedMeetings = workspaceStorageService.getItem(workspaceId, 'meetings') || [];
    workspaceEventBus.emit('meetings.updated', storedMeetings);

    if (isConfigured) {
       const meetingsColRef = collection(db, 'workspaces', workspaceId, 'meetings');
       
       const unsubMeetings = onSnapshot(meetingsColRef, (querySnapshot) => {
           try {
               const meetingsList = [];
               querySnapshot.forEach((docSnap) => {
                   const data = docSnap.data();
                   
                   // Refinement 14: Read Model Validation
                   const isValid = 
                     data && 
                     typeof data.title === 'string' && 
                     data.title.trim().length > 0 &&
                     (data.status !== 'deleted');

                   if (isValid) {
                       meetingsList.push({ id: docSnap.id, ...data });
                   } else if (data && data.status !== 'deleted') {
                       console.warn(`[MeetingsModule] Ignored malformed meeting document: ${docSnap.id}`, data);
                   }
               });

               // Sort meetings chronologically
               meetingsList.sort((a, b) => {
                 const aTime = a.date ? new Date(a.date).getTime() : 0;
                 const bTime = b.date ? new Date(b.date).getTime() : 0;
                 return aTime - bTime;
               });

               // TempId resolution
               const prevMeetings = workspaceStorageService.getItem(workspaceId, 'meetings') || [];
               const localMeetingsMap = new Map();
               prevMeetings.forEach(m => localMeetingsMap.set(m.id, m));

               EntityIdentityResolver.resolve(localMeetingsMap, meetingsList);

               // Standard merge (Refinement 8: Server timestamps win)
               meetingsList.forEach((cloudMeet) => {
                 const localMeet = localMeetingsMap.get(cloudMeet.id);
                 if (!localMeet) {
                   localMeetingsMap.set(cloudMeet.id, cloudMeet);
                 } else {
                   const localTime = localMeet.updatedAt ? new Date(localMeet.updatedAt).getTime() : 0;
                   const cloudTime = cloudMeet.updatedAt ? new Date(cloudMeet.updatedAt).getTime() : 0;
                   const localIsNewer = localTime >= cloudTime;
                   const base = localIsNewer ? localMeet : cloudMeet;
                   localMeetingsMap.set(cloudMeet.id, { ...base, ...cloudMeet }); // cloudMeet fields always win on conflict
                 }
               });

               const mergedFinal = Array.from(localMeetingsMap.values()).filter(m => m.status !== 'deleted');

               workspaceStorageService.setItem(workspaceId, 'meetings', mergedFinal);
               workspaceEventBus.emit('meetings.updated', mergedFinal);
           } catch (err) {
               console.error("MeetingsModule: Error processing meetings snapshot", err);
           }
       });
       
       workspaceListenerManager.register('meetings', 'meetings-list', unsubMeetings);
    }
    
    workspaceReadinessManager.completeGate('meetings');
  },
  
  reset: async () => {},
  destroy: async () => {}
};

workspaceRegistry.register(MeetingsModule);
