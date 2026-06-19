import { useState } from 'react';

export const useCatalog = (setCustomConfirm) => {
  const [materialCatalog, setMaterialCatalog] = useState(() => {
    const saved = localStorage.getItem("ipm_material_catalog");
    return saved ? JSON.parse(saved) : [];
  });

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
