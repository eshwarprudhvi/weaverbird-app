const { db } = require('../../config/firebase');

/**
 * Transaction Service
 * 
 * Provides an abstraction for Firestore batched writes and transactions.
 * All related database operations should succeed or fail together.
 */
class TransactionService {
  /**
   * Run a read-write transaction
   * @param {Function} updateFunction - The async function that receives a Firestore transaction object
   * @returns {Promise<any>}
   */
  async runTransaction(updateFunction) {
    return await db.runTransaction(async (transaction) => {
      return await updateFunction(transaction);
    });
  }

  /**
   * Returns a new batched write object for multiple write-only operations
   * @returns {FirebaseFirestore.WriteBatch}
   */
  batch() {
    return db.batch();
  }
}

module.exports = new TransactionService();
