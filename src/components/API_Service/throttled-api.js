// Throttled API service to prevent rate limiting issues
// This service implements request throttling, caching, and exponential backoff

import { apiRequest } from './api-utils';

class ThrottledAPIService {
  constructor() {
    this.requestCache = new Map();
    this.requestTimestamps = new Map();
    this.activeRequests = new Map();
    this.retryDelays = new Map();
    
    // Configuration
    this.config = {
      cacheTimeout: 30000, // 30 seconds cache
      minRequestInterval: 5000, // Minimum 5 seconds between requests to same endpoint
      maxRetries: 3,
      baseRetryDelay: 1000, // 1 second base delay
      maxRetryDelay: 30000, // 30 seconds max delay
      rateLimitBackoff: 60000, // 1 minute backoff for 429 errors
    };
  }

  // Generate cache key for request
  getCacheKey(url, options = {}) {
    const method = options.method || 'GET';
    const body = options.body ? JSON.stringify(options.body) : '';
    return `${method}:${url}:${body}`;
  }

  // Check if request is cached and still valid
  isCached(cacheKey) {
    const cached = this.requestCache.get(cacheKey);
    if (!cached) return false;
    
    const now = Date.now();
    const cacheAge = now - cached.timestamp;
    
    return cacheAge < this.config.cacheTimeout;
  }

  // Check if enough time has passed since last request to same endpoint
  canMakeRequest(cacheKey) {
    const lastRequest = this.requestTimestamps.get(cacheKey);
    if (!lastRequest) return true;
    
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequest;
    
    return timeSinceLastRequest >= this.config.minRequestInterval;
  }

  // Get retry delay with exponential backoff
  getRetryDelay(cacheKey, attempt = 1) {
    const baseDelay = this.retryDelays.get(cacheKey) || this.config.baseRetryDelay;
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 1000; // Add random jitter
    
    return Math.min(exponentialDelay + jitter, this.config.maxRetryDelay);
  }

  // Update retry delay for rate limiting
  updateRetryDelay(cacheKey, isRateLimited = false) {
    if (isRateLimited) {
      this.retryDelays.set(cacheKey, this.config.rateLimitBackoff);
    } else {
      // Gradually reduce delay on successful requests
      const currentDelay = this.retryDelays.get(cacheKey) || this.config.baseRetryDelay;
      this.retryDelays.set(cacheKey, Math.max(currentDelay / 2, this.config.baseRetryDelay));
    }
  }

  // Main throttled request method
  async request(url, options = {}, forceRefresh = false) {
    const cacheKey = this.getCacheKey(url, options);
    
    // Check if request is already in progress
    if (this.activeRequests.has(cacheKey)) {
      console.log(`Request to ${url} already in progress, waiting...`);
      return this.activeRequests.get(cacheKey);
    }

    // Check cache first (only for GET requests)
    if (!forceRefresh && options.method === 'GET' && this.isCached(cacheKey)) {
      console.log(`Returning cached response for ${url}`);
      return this.requestCache.get(cacheKey).data;
    }

    // Check if we can make the request (rate limiting)
    if (!this.canMakeRequest(cacheKey)) {
      const lastRequest = this.requestTimestamps.get(cacheKey);
      const waitTime = this.config.minRequestInterval - (Date.now() - lastRequest);
      
      console.log(`Rate limiting: waiting ${waitTime}ms before next request to ${url}`);
      
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          this.request(url, options, forceRefresh)
            .then(resolve)
            .catch(reject);
        }, waitTime);
      });
    }

    // Create the request promise
    const requestPromise = this.makeRequestWithRetry(url, options, cacheKey);
    
    // Store active request
    this.activeRequests.set(cacheKey, requestPromise);
    
    try {
      const result = await requestPromise;
      
      // Cache successful GET responses
      if (options.method === 'GET' && result.success) {
        this.requestCache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });
      }
      
      // Update request timestamp
      this.requestTimestamps.set(cacheKey, Date.now());
      
      // Reset retry delay on success
      this.updateRetryDelay(cacheKey, false);
      
      return result;
    } finally {
      // Remove from active requests
      this.activeRequests.delete(cacheKey);
    }
  }

  // Make request with retry logic
  async makeRequestWithRetry(url, options, cacheKey, attempt = 1) {
    try {
      console.log(`Making request to ${url} (attempt ${attempt})`);
      const result = await apiRequest(url, options);
      
      if (result.success) {
        return result;
      }
      
      // Handle specific error cases
      if (result.status === 429) {
        console.warn(`Rate limited for ${url}, implementing backoff`);
        this.updateRetryDelay(cacheKey, true);
        
        if (attempt < this.config.maxRetries) {
          const delay = this.getRetryDelay(cacheKey, attempt);
          console.log(`Retrying ${url} after ${delay}ms delay`);
          
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.makeRequestWithRetry(url, options, cacheKey, attempt + 1);
        }
      }
      
      // Handle permission errors (403) - return as failed response instead of throwing
      if (result.status === 403) {
        console.warn(`Permission denied for ${url} - returning failed response`);
        return {
          success: false,
          error: `Permission denied: ${result.error || 'Access forbidden'}`,
          status: 403,
          data: null
        };
      }
      
      // For other errors, retry with exponential backoff
      if (attempt < this.config.maxRetries && result.status >= 500) {
        const delay = this.getRetryDelay(cacheKey, attempt);
        console.log(`Retrying ${url} after ${delay}ms delay due to server error`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeRequestWithRetry(url, options, cacheKey, attempt + 1);
      }
      
      // Return a failed response instead of throwing to prevent crashes
      return {
        success: false,
        error: result.error || `Request failed with status ${result.status}`,
        status: result.status,
        data: null
      };
      
    } catch (error) {
      console.error(`Request failed for ${url}:`, error);
      
      // Retry on network errors
      if (attempt < this.config.maxRetries && !error.message.includes('HTTP error')) {
        const delay = this.getRetryDelay(cacheKey, attempt);
        console.log(`Retrying ${url} after ${delay}ms delay due to network error`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeRequestWithRetry(url, options, cacheKey, attempt + 1);
      }
      
      // Return a failed response instead of throwing to prevent crashes
      return {
        success: false,
        error: error.message || 'Network error occurred',
        status: 0,
        data: null
      };
    }
  }

  // Clear cache for specific endpoint
  clearCache(url, options = {}) {
    const cacheKey = this.getCacheKey(url, options);
    this.requestCache.delete(cacheKey);
    this.requestTimestamps.delete(cacheKey);
    this.retryDelays.delete(cacheKey);
  }

  // Clear all cache
  clearAllCache() {
    this.requestCache.clear();
    this.requestTimestamps.clear();
    this.retryDelays.clear();
  }

  // Get cache statistics
  getCacheStats() {
    return {
      cacheSize: this.requestCache.size,
      activeRequests: this.activeRequests.size,
      retryDelays: Array.from(this.retryDelays.entries()),
    };
  }
}

// Create singleton instance
const throttledAPI = new ThrottledAPIService();

// Export convenience methods
export const throttledRequest = (url, options = {}, forceRefresh = false) => {
  return throttledAPI.request(url, options, forceRefresh);
};

export const throttledGet = (url, options = {}, forceRefresh = false) => {
  return throttledAPI.request(url, { ...options, method: 'GET' }, forceRefresh);
};

export const throttledPost = (url, data, options = {}, forceRefresh = false) => {
  return throttledAPI.request(url, { 
    ...options, 
    method: 'POST', 
    body: data 
  }, forceRefresh);
};

export const throttledPatch = (url, data, options = {}, forceRefresh = false) => {
  return throttledAPI.request(url, { 
    ...options, 
    method: 'PATCH', 
    body: data 
  }, forceRefresh);
};

export const throttledDelete = (url, options = {}, forceRefresh = false) => {
  return throttledAPI.request(url, { ...options, method: 'DELETE' }, forceRefresh);
};

// Cache management
export const clearThrottledCache = (url, options = {}) => {
  throttledAPI.clearCache(url, options);
};

export const clearAllThrottledCache = () => {
  throttledAPI.clearAllCache();
};

export const getThrottledCacheStats = () => {
  return throttledAPI.getCacheStats();
};

export default throttledAPI;
