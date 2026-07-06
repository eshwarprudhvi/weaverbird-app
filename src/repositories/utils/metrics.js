/**
 * Repository performance metrics publisher (Development only)
 */
export const publishMetrics = (metric) => {
  if (process.env.NODE_ENV === 'production') return;

  const {
    operation,
    duration,
    retryCount = 0,
    rollbackCount = 0,
    success,
    failure = null,
    workspaceId,
    entityType,
    entityId
  } = metric;

  console.group(`[Repository Metrics] ${entityType}:${operation}`);
  console.log(`Success: ${success ? '✅ Yes' : '❌ No'}`);
  console.log(`Duration: ${duration.toFixed(2)}ms`);
  console.log(`Retries: ${retryCount}`);
  console.log(`Rollbacks: ${rollbackCount}`);
  console.log(`Workspace: ${workspaceId}`);
  console.log(`Entity ID: ${entityId}`);
  if (failure) {
    console.error('Error detail:', failure);
  }
  console.groupEnd();
};
