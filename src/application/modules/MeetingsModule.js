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
                const docChanges = [];
                querySnapshot.docChanges().forEach(change => {
                  docChanges.push({ type: change.type, id: change.doc.id });
                });

                console.log(`[Listener] Snapshot received | Workspace: ${workspaceId} | Size: ${querySnapshot.size} | Changes: ${JSON.stringify(docChanges)} | Timestamp: ${new Date().toISOString()}`);

                const deletedIds = new Set(workspaceStorageService.getItem(workspaceId, 'deletedMeetingIds') || []);

                const meetingsList = [];
                querySnapshot.forEach((docSnap) => {
                    const data = docSnap.data();
                    
                    if (data && data.status === 'deleted') {
                        deletedIds.add(docSnap.id);
                        if (data.tempId) deletedIds.add(data.tempId);
                        return;
                    }

                    // Refinement 14: Read Model Validation
                    const isValid = 
                      data && 
                      typeof data.title === 'string' && 
                      data.title.trim().length > 0;

                    if (isValid) {
                        if (deletedIds.has(docSnap.id) || (data.tempId && deletedIds.has(data.tempId))) {
                            console.log(`[MeetingsModule] Ignoring deleted meeting: ${docSnap.id}`);
                            return;
                        }
                        meetingsList.push({ id: docSnap.id, ...data });
                    } else if (data) {
                        console.warn(`[MeetingsModule] Ignored malformed meeting document: ${docSnap.id}`, data);
                    }
                });

                workspaceStorageService.setItem(workspaceId, 'deletedMeetingIds', Array.from(deletedIds));

                console.log(`[Listener] Meetings count from snapshot: ${meetingsList.length} | IDs: ${JSON.stringify(meetingsList.map(m => m.id))}`);

                // Sort meetings chronologically
                meetingsList.sort((a, b) => {
                  const aTime = a.date ? new Date(a.date).getTime() : 0;
                  const bTime = b.date ? new Date(b.date).getTime() : 0;
                  return aTime - bTime;
                });

                // TempId resolution
                const rawPrevMeetings = workspaceStorageService.getItem(workspaceId, 'meetings') || [];
                const prevMeetings = rawPrevMeetings.filter(m => !deletedIds.has(m.id) && (!m.tempId || !deletedIds.has(m.tempId)) && m.status !== 'deleted');
                const localMeetingsMap = new Map();
                prevMeetings.forEach(m => localMeetingsMap.set(m.id, m));

                console.log(`[Storage] Cache before update | Current cache IDs: ${JSON.stringify(Array.from(localMeetingsMap.keys()))} | Incoming IDs: ${JSON.stringify(meetingsList.map(m => m.id))}`);

                EntityIdentityResolver.resolve(localMeetingsMap, meetingsList);

                const parseTime = (val) => {
                  if (!val) return 0;
                  if (val.toDate && typeof val.toDate === 'function') return val.toDate().getTime();
                  if (typeof val.seconds === 'number') return val.seconds * 1000 + Math.floor((val.nanoseconds || 0) / 1000000);
                  const d = new Date(val);
                  return isNaN(d.getTime()) ? 0 : d.getTime();
                };

                // Standard merge (Refinement 8: Server timestamps win)
                meetingsList.forEach((cloudMeet) => {
                  const localMeet = localMeetingsMap.get(cloudMeet.id);
                  if (!localMeet) {
                    localMeetingsMap.set(cloudMeet.id, { ...cloudMeet, syncState: 'SYNCED' });
                  } else {
                    const localTime = parseTime(localMeet.updatedAt);
                    const cloudTime = parseTime(cloudMeet.updatedAt);
                    const localIsNewer = localTime > cloudTime;

                    const mergedMeet = localIsNewer
                       ? { ...cloudMeet, ...localMeet, syncState: localMeet.syncState !== 'SYNCED' ? localMeet.syncState : 'SYNCED' }
                       : { ...localMeet, ...cloudMeet, syncState: 'SYNCED' };

                    localMeetingsMap.set(cloudMeet.id, mergedMeet);
                  }
                });

                const mergedFinal = Array.from(localMeetingsMap.values()).filter(m => !deletedIds.has(m.id) && (!m.tempId || !deletedIds.has(m.tempId)) && m.status !== 'deleted');

                if (JSON.stringify(mergedFinal) !== JSON.stringify(prevMeetings)) {
                  workspaceStorageService.setItem(workspaceId, 'meetings', mergedFinal);
                  console.log(`[Storage] Cache after update | Stored IDs: ${JSON.stringify(mergedFinal.map(m => m.id))}`);
                  workspaceEventBus.emit('meetings.updated', mergedFinal);
                } else {
                  console.log(`[Storage] Cache unchanged | Stored IDs: ${JSON.stringify(mergedFinal.map(m => m.id))}`);
                }
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
