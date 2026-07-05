import { useState, useEffect } from 'react';
import { useWorkspaceScope } from '../application/session';

export const useCatalog = (setCustomConfirm) => {
  const scope = useWorkspaceScope();

  const [materialCatalog, setMaterialCatalog] = useState(() => {
    return scope.storage.getItem(scope.workspaceId, 'material_catalog') || [];
  });

  useEffect(() => {
    const unsub = scope.eventBus.on('catalog.updated', (newCatalog) => {
      setMaterialCatalog(newCatalog);
    });
    return unsub;
  }, [scope.eventBus]);

  const handleAddCatalogItem = (e, name, price) => {
    if (e) e.preventDefault();
    if (!name.trim()) return;
    const newItem = {
      id: "cat_" + Date.now(),
      name: name.trim(),
      price: price.trim(),
    };
    setMaterialCatalog([newItem, ...materialCatalog]);
  };

  const handleDeleteCatalogItem = (e, itemId) => {
    if (e) e.stopPropagation();
    setCustomConfirm({
      title: "Delete Catalog Item",
      message: "Are you sure you want to delete this material price reference? This action cannot be undone.",
      onConfirm: () => {
        setMaterialCatalog((prev) => prev.filter((item) => item.id !== itemId));
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
