const { db } = require('../../config/firebase');

/**
 * Encapsulates all search behavior.
 * Currently uses basic Firestore querying + local filtering for MVP.
 * Architected to be swapped with Algolia, OpenSearch, or Vertex AI 
 * without changing the caller's interface.
 */
class SearchService {
  /**
   * Performs a search on a specific collection
   * 
   * @param {string} collectionPath - The path to the collection (e.g., 'workspaces/123/projects')
   * @param {Object} params - Search and pagination parameters
   * @param {number} params.page
   * @param {number} params.pageSize
   * @param {string} params.sort
   * @param {string} params.order
   * @param {string} params.search - Substring search text
   * @param {Object} params.filters - Exact match filters (e.g., { status: 'active' })
   * @param {Array<string>} params.searchFields - Fields to check substring against
   * @returns {Promise<{ data: Array, total: number }>}
   */
  async search(collectionPath, { page = 1, pageSize = 10, sort = 'createdAt', order = 'desc', search = '', filters = {}, searchFields = ['name', 'description'] }) {
    
    // In a future Algolia implementation, this would be:
    // const index = client.initIndex(collectionPath);
    // const results = await index.search(search, { page, hitsPerPage: pageSize, filters: ... });
    // return { data: results.hits, total: results.nbHits };

    let query = db.collection(collectionPath);

    // Apply strict equality filters at the DB level to reduce payload size
    for (const [field, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null) {
        query = query.where(field, '==', value);
      }
    }

    // Exclude soft-deleted items by default (unless explicitly requesting them)
    // Firestore limitation: cannot do != and orderBy on a different field easily, 
    // so we fetch and filter locally if a sort is requested that isn't 'status'.
    const snapshot = await query.get();
    
    let results = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(doc => doc.status !== 'deleted' && doc.status !== 'removed'); // Enforce soft delete policy

    // Apply local substring search (Algolia handles this natively)
    if (search) {
      const s = search.toLowerCase();
      results = results.filter(doc => {
        return searchFields.some(field => {
          const val = doc[field];
          return typeof val === 'string' && val.toLowerCase().includes(s);
        });
      });
    }

    // Apply sorting locally (Firestore requires complex composite indexes for every sort/filter combination)
    results.sort((a, b) => {
      let valA = a[sort] || '';
      let valB = b[sort] || '';
      if (valA < valB) return order === 'asc' ? -1 : 1;
      if (valA > valB) return order === 'asc' ? 1 : -1;
      return 0;
    });

    const total = results.length;
    const startIndex = (page - 1) * pageSize;
    const paginatedData = results.slice(startIndex, startIndex + pageSize);

    return {
      data: paginatedData,
      total,
    };
  }
}

module.exports = new SearchService();
