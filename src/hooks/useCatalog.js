import { useState, useEffect } from 'react';
import { useWorkspaceScope } from '../application/session';
import { catalogRepository } from '../repositories/CatalogRepository';

export const useCatalog = (setCustomConfirm) => {
  const scope = useWorkspaceScope();

  const [materialCatalog, setMaterialCatalog] = useState(() => {
    return scope.storage.getItem(scope.workspaceId, 'material_catalog') || [];
  });

  useEffect(() => {
    const unsub = scope.eventBus.on('catalog.updated', (newCatalog) => {
      setMaterialCatalog(newCatalog || []);
    });
    return unsub;
  }, [scope.eventBus]);

  const handleAddCatalogItem = async (e, name, price) => {
    if (e) e.preventDefault();
    if (!name.trim()) return;

    const tempId = `temp_${Date.now()}`;
    const newItem = {
      id: tempId,
      name: name.trim(),
      price: price.trim(),
    };

    setMaterialCatalog((prev) => [newItem, ...prev]);

    try {
      const createdItem = await catalogRepository.create(scope.workspaceId, {
        tempId,
        name: name.trim(),
        price: price.trim()
      });
      // Replace the temp ID in React state immediately with the real Firestore item
      setMaterialCatalog((prev) => 
        prev.map((item) => (item.id === tempId ? createdItem : item))
      );
    } catch (err) {
      console.error("Failed to add catalog item:", err);
      setMaterialCatalog((prev) => prev.filter((item) => item.id !== tempId));
    }
  };

  const handleDeleteCatalogItem = (e, itemId) => {
    if (e) e.stopPropagation();
    console.log("[useCatalog] handleDeleteCatalogItem called with itemId:", itemId);
    console.log("[useCatalog] Current materialCatalog state:", materialCatalog);
    
    setCustomConfirm({
      title: "Delete Catalog Item",
      message: "Are you sure you want to delete this material price reference? This action cannot be undone.",
      onConfirm: async () => {
        console.log("[useCatalog] Confirming delete for itemId:", itemId);
        const oldCatalog = [...materialCatalog];
        setMaterialCatalog((prev) => prev.filter((item) => item.id !== itemId));

        try {
          await catalogRepository.delete(scope.workspaceId, itemId);
          console.log("[useCatalog] Delete successful for itemId:", itemId);
        } catch (err) {
          console.error("Failed to delete catalog item:", err);
          setMaterialCatalog(oldCatalog);
        }
      },
    });
  };

  return {
    materialCatalog,
    setMaterialCatalog,
    handleAddCatalogItem,
    handleDeleteCatalogItem
  };
};
