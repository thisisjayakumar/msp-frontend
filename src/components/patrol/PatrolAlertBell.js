"use client";

import { useState, useEffect, useCallback } from 'react';
import patrolAPI from '@/components/API_Service/patrol-api';

export default function PatrolAlertBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAlerts, setShowAlerts] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await patrolAPI.alerts.getUnreadCount();
      if (!data.error) {
        setUnreadCount(data.unread_count || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await patrolAPI.alerts.getAll({ is_read: false });
      if (!data.error) {
        setAlerts(data);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    // Poll for new alerts every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (showAlerts) {
      fetchAlerts();
    }
  }, [showAlerts, fetchAlerts]);

  const handleMarkAsRead = async (alertId) => {
    try {
      await patrolAPI.alerts.markAsRead(alertId);
      fetchUnreadCount();
      fetchAlerts();
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  const getAlertIcon = (alertType) => {
    switch (alertType) {
      case 'duty_assigned':
        return '📋';
      case 'duty_ending_4hr':
      case 'duty_ending_8hr':
        return '⏰';
      case 'upload_missed':
        return '❗';
      case 'duty_completed':
        return '✅';
      default:
        return '🔔';
    }
  };

  const getAlertColor = (alertType) => {
    switch (alertType) {
      case 'duty_assigned':
        return 'bg-blue-50 border-blue-200';
      case 'duty_ending_4hr':
      case 'duty_ending_8hr':
        return 'bg-orange-50 border-orange-200';
      case 'upload_missed':
        return 'bg-red-50 border-red-200';
      case 'duty_completed':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setShowAlerts(!showAlerts)}
        className="relative bg-white/20 hover:bg-white/30 backdrop-blur-sm p-2 rounded-lg transition-colors"
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Alerts Dropdown */}
      {showAlerts && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowAlerts(false)}
          />
          <div className="absolute right-0 mt-2 w-96 max-h-[32rem] overflow-y-auto bg-white rounded-lg shadow-2xl z-50 border border-gray-200">
            <div className="sticky top-0 bg-gradient-to-r from-emerald-600 to-green-600 text-white px-4 py-3 rounded-t-lg">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Patrol Alerts</h3>
                <button
                  onClick={() => setShowAlerts(false)}
                  className="hover:bg-white/20 rounded p-1 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-2">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
                  <p className="mt-2 text-gray-600 text-sm">Loading alerts...</p>
                </div>
              ) : alerts.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-2">🔔</div>
                  <p className="text-gray-600">No new alerts</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {alerts.map(alert => (
                    <div
                      key={alert.id}
                      className={`border rounded-lg p-3 ${getAlertColor(alert.alert_type)} hover:shadow-md transition-shadow`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-1">
                            <span className="text-lg mr-2">{getAlertIcon(alert.alert_type)}</span>
                            <span className="text-xs font-medium text-gray-600">
                              {new Date(alert.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-800">{alert.message}</p>
                        </div>
                        <button
                          onClick={() => handleMarkAsRead(alert.id)}
                          className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Mark as read"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

