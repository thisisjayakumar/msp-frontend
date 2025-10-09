"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import RMStoreDashboard from '../../../components/rm-store/RMStoreDashboard';
import { authUtils, apiRequest } from '../../../components/API_Service/api-utils';
import { throttledGet } from '../../../components/API_Service/throttled-api';
import { AUTH_APIS } from '../../../components/API_Service/api-list';
import LoadingSpinner from '../../../components/CommonComponents/ui/LoadingSpinner';

export default function RMStoreDashboardPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  // Fetch user profile (THROTTLED)
  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await throttledGet(AUTH_APIS.PROFILE);
      
      if (response.success) {
        setUserProfile(response.data);
        return response.data;
      } else {
        console.error('Profile API error:', response.error);
        return null;
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      
      // Handle rate limiting errors gracefully
      if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
        console.warn('Rate limited while fetching profile - will retry');
        return null;
      }
      
      return null;
    }
  }, []);

  // Handle logout
  const handleLogout = () => {
    authUtils.removeToken();
    router.replace('/');
  };

  useEffect(() => {
    const checkAuth = async () => {
      const token = authUtils.getToken();
      
      if (!token) {
        router.replace('/');
        return;
      }

      // Fetch user profile and check role
      const profile = await fetchUserProfile();
      if (profile) {
        const role = profile.primary_role?.name;
        if (role === 'rm_store') {
          setIsAuthenticated(true);
        } else {
          console.log('User does not have rm_store role:', role);
          router.replace('/');
          return;
        }
      } else {
        router.replace('/');
        return;
      }

      setIsLoading(false);
    };

    checkAuth();
  }, [router, fetchUserProfile]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-600 to-red-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">RM</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-800">RM Store Dashboard</h1>
                  {userProfile && (
                    <p className="text-xs text-slate-500">{userProfile.full_name}</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <RMStoreDashboard />
      </main>
    </div>
  );
}
