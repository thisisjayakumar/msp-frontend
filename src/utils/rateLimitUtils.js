// Rate limiting utility to provide user feedback and manage API calls
import { getThrottledCacheStats } from './throttled-api';

class RateLimitManager {
  constructor() {
    this.rateLimitWarnings = new Set();
    this.lastWarningTime = 0;
    this.warningCooldown = 30000; // 30 seconds between warnings
  }

  // Handle rate limit errors with user-friendly messages
  handleRateLimitError(error, context = '') {
    const now = Date.now();
    const warningKey = `${context}_${Math.floor(now / this.warningCooldown)}`;
    
    // Only show warning once per cooldown period
    if (this.rateLimitWarnings.has(warningKey)) {
      return;
    }
    
    this.rateLimitWarnings.add(warningKey);
    
    // Clean up old warnings
    if (now - this.lastWarningTime > this.warningCooldown) {
      this.rateLimitWarnings.clear();
      this.lastWarningTime = now;
    }
    
    console.warn(`Rate limit warning for ${context}:`, error.message);
    
    // You can integrate with a toast notification system here
    // For now, we'll just log to console
    if (typeof window !== 'undefined' && window.console) {
      console.warn('🔄 API requests are being throttled to prevent server overload. Data will refresh automatically.');
    }
  }

  // Get current rate limiting status
  getStatus() {
    const stats = getThrottledCacheStats();
    return {
      activeRequests: stats.activeRequests,
      cacheSize: stats.cacheSize,
      hasRetryDelays: stats.retryDelays.length > 0,
      isRateLimited: stats.retryDelays.some(([_, delay]) => delay > 30000)
    };
  }

  // Check if we should show a rate limit indicator
  shouldShowIndicator() {
    const status = this.getStatus();
    return status.isRateLimited || status.activeRequests > 0;
  }

  // Get user-friendly status message
  getStatusMessage() {
    const status = this.getStatus();
    
    if (status.isRateLimited) {
      return '🔄 Server is busy - requests are being throttled';
    }
    
    if (status.activeRequests > 0) {
      return `🔄 ${status.activeRequests} request(s) in progress`;
    }
    
    return null;
  }
}

// Create singleton instance
const rateLimitManager = new RateLimitManager();

// Export utilities
export const handleRateLimitError = (error, context = '') => {
  rateLimitManager.handleRateLimitError(error, context);
};

export const getRateLimitStatus = () => {
  return rateLimitManager.getStatus();
};

export const shouldShowRateLimitIndicator = () => {
  return rateLimitManager.shouldShowIndicator();
};

export const getRateLimitStatusMessage = () => {
  return rateLimitManager.getStatusMessage();
};

export default rateLimitManager;
