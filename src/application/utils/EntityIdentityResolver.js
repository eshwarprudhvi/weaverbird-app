/**
 * Standard utility to resolve and map temporary offline/local IDs to Firestore Server IDs
 */
export const EntityIdentityResolver = {
  /**
   * Resolves tempId records in a collection map
   * @param {Map} localItemsMap - Map of existing local items (key is item.id)
   * @param {Array} cloudItems - Array of raw items retrieved from Firestore snapshot
   * @param {string} idKey - Object property representing Firestore document ID (default: 'id')
   */
  resolve(localItemsMap, cloudItems, idKey = 'id') {
    cloudItems.forEach((cloudItem) => {
      const tempId = cloudItem.tempId;
      if (tempId && localItemsMap.has(tempId)) {
        console.log(`[EntityIdentityResolver] Swapping local tempId: ${tempId} -> serverId: ${cloudItem[idKey]}`);
        const localItem = localItemsMap.get(tempId);
        localItemsMap.delete(tempId);
        localItem[idKey] = cloudItem[idKey];
        localItemsMap.set(cloudItem[idKey], localItem);
      }
    });
  }
};
