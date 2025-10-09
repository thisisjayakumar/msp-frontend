// Custom hook for throttled authentication API calls
import { useState, useCallback } from 'react';
import { throttledGet } from '@/components/API_Service/throttled-api';
import { AUTH_APIS } from '@/components/API_Service/api-list';

export function useThrottledAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Throttled profile fetch
  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await throttledGet(AUTH_APIS.PROFILE);
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to fetch profile');
      }
    } catch (err) {
      const errorMessage = err.message;
      setError(errorMessage);
      
      // Handle rate limiting errors gracefully
      if (errorMessage.includes('429') || errorMessage.includes('Too Many Requests')) {
        console.warn('Rate limited while fetching profile - will retry');
        return null; // Don't throw error for rate limiting
      }
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Throttled permissions fetch
  const fetchPermissions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await throttledGet(AUTH_APIS.PERMISSIONS);
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to fetch permissions');
      }
    } catch (err) {
      const errorMessage = err.message;
      setError(errorMessage);
      
      // Handle rate limiting errors gracefully
      if (errorMessage.includes('429') || errorMessage.includes('Too Many Requests')) {
        console.warn('Rate limited while fetching permissions - will retry');
        return null; // Don't throw error for rate limiting
      }
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    fetchProfile,
    fetchPermissions,
    isLoading,
    error,
    clearError: () => setError(null)
  };
}

export default useThrottledAuth;
