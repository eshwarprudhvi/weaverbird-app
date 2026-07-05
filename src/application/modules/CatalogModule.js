import { workspaceRegistry, workspaceStorageService, workspaceReadinessManager, workspaceListenerManager, workspaceEventBus } from '../session';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, isConfigured } from '../../firebase';
import { APPLICATION } from '../../config/application';

export const CatalogModule = {
  name: 'catalog',
  priority: 700,
  
  initialize: async (workspaceId) => {
    workspaceReadinessManager.createGate('catalog');
    
    const storedCatalog = workspaceStorageService.getItem(workspaceId, 'material_catalog') || [];
    workspaceEventBus.emit('catalog.updated', storedCatalog);

    if (workspaceId && isConfigured) {
       const userEmail = localStorage.getItem(APPLICATION.storageKeys.userEmail);
       
       if (userEmail) {
           const cleanEmail = userEmail.toLowerCase().trim();
           const catalogDocRef = doc(db, "users", cleanEmail, "private", "catalog");
           
           const unsubCatalog = onSnapshot(catalogDocRef, (docSnap) => {
               try {
                   if (docSnap.exists()) {
                       const cloudData = docSnap.data();
                       if (cloudData.catalog) {
                           workspaceStorageService.setItem(workspaceId, 'material_catalog', cloudData.catalog);
                           workspaceEventBus.emit('catalog.updated', cloudData.catalog);
                       }
                   }
               } catch (err) {
                   console.error("CatalogModule: Error processing catalog snapshot", err);
               }
           });
           
           workspaceListenerManager.register('catalog', 'catalog-list', unsubCatalog);
       }
    }
    
    workspaceReadinessManager.completeGate('catalog');
  },
  
  reset: async () => {},
  destroy: async () => {}
};

workspaceRegistry.register(CatalogModule);
