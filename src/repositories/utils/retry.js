/**
 * Transient error retry utility with exponential backoff
 */
export const retryRequest = async (fn, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      const status = err.status || err.response?.status;
      const isTransient = 
        !status || // Network drops (no status code)
        status === 408 || // Request Timeout
        [500, 502, 503, 504].includes(status) || // Server errors
        err.message?.includes('timeout') ||
        err.message?.includes('Network Error') ||
        err.code === 'ECONNABORTED';

      if (!isTransient || i === retries - 1) {
        throw err;
      }
      
      const backoffTime = delay * Math.pow(2, i);
      console.warn(`[Repository Retry] Transient failure encountered (status: ${status || 'network'}). Retrying in ${backoffTime}ms... (Attempt ${i + 1}/${retries})`);
      await new Promise(resolve => setTimeout(resolve, backoffTime));
    }
  }
};
