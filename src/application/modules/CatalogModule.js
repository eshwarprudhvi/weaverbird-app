import { workspaceRegistry, workspaceStorageService, workspaceReadinessManager, workspaceListenerManager, workspaceEventBus } from '../session';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, isConfigured } from '../../firebase';
import { EntityIdentityResolver } from '../utils/EntityIdentityResolver';

export const CatalogModule = {
  name: 'catalog',
  priority: 700,
  
  initialize: async (workspaceId) => {
    if (!workspaceId) {
      throw new Error("CatalogModule: Cannot initialize without a valid workspaceId.");
    }

    workspaceReadinessManager.createGate('catalog');
    
    const storedCatalog = workspaceStorageService.getItem(workspaceId, 'material_catalog') || [];
    workspaceEventBus.emit('catalog.updated', storedCatalog);

    if (isConfigured) {
       const catalogColRef = collection(db, 'workspaces', workspaceId, 'catalog');
       
       const unsubCatalog = onSnapshot(catalogColRef, (querySnapshot) => {
           try {
               const catalogList = [];
               querySnapshot.forEach((docSnap) => {
                   const data = docSnap.data();
                   
                   // Refinement 14: Read Model Validation
                   const isValid = 
                     data && 
                     typeof data.name === 'string' && 
                     data.name.trim().length > 0 &&
                     (data.status !== 'deleted');

                   if (isValid) {
                       catalogList.push({ id: docSnap.id, ...data });
                   } else if (data && data.status !== 'deleted') {
                       console.warn(`[CatalogModule] Ignored malformed catalog document: ${docSnap.id}`, data);
                   }
               });
               
               // Sort by name
               catalogList.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

               // TempId resolution
               const prevCatalog = workspaceStorageService.getItem(workspaceId, 'material_catalog') || [];
               const localCatalogMap = new Map();
               prevCatalog.forEach(i => localCatalogMap.set(i.id, i));

               EntityIdentityResolver.resolve(localCatalogMap, catalogList);

               // Standard merge (Refinement 8: Server timestamps win)
               catalogList.forEach((cloudItem) => {
                 const localItem = localCatalogMap.get(cloudItem.id);
                 if (!localItem) {
                   localCatalogMap.set(cloudItem.id, cloudItem);
                 } else {
                   const localTime = localItem.updatedAt ? new Date(localItem.updatedAt).getTime() : 0;
                   const cloudTime = cloudItem.updatedAt ? new Date(cloudItem.updatedAt).getTime() : 0;
                   const localIsNewer = localTime >= cloudTime;
                   const base = localIsNewer ? localItem : cloudItem;
                   localCatalogMap.set(cloudItem.id, { ...base, ...cloudItem }); // Cloud wins on conflict
                 }
               });

               const mergedFinal = Array.from(localCatalogMap.values()).filter(i => i.status !== 'deleted');

               workspaceStorageService.setItem(workspaceId, 'material_catalog', mergedFinal);
               workspaceEventBus.emit('catalog.updated', mergedFinal);
           } catch (err) {
               console.error("CatalogModule: Error processing catalog snapshot", err);
           }
       });
       
       workspaceListenerManager.register('catalog', 'catalog-list', unsubCatalog);
    }
    
    workspaceReadinessManager.completeGate('catalog');
  },
  
  reset: async () => {},
  destroy: async () => {}
};

workspaceRegistry.register(CatalogModule);
