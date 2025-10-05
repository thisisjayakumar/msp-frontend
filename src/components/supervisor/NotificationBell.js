"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BellIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { apiRequest } from '@/components/API_Service/api-utils';
import { NOTIFICATIONS_APIS } from '@/components/API_Service/api-list';

export default function NotificationBell({ onNotificationClick }) {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiRequest(NOTIFICATIONS_APIS.MY_NOTIFICATIONS, { 
        method: 'GET' 
      });
      
      if (response.success) {
        setNotifications(response.data.notifications || []);
        setUnreadCount(response.data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch notifications on mount and poll every 30 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification) => {
    // Acknowledge the notification
    try {
      await apiRequest(NOTIFICATIONS_APIS.ACKNOWLEDGE_ALERT(notification.id), {
        method: 'POST'
      });
      
      // Refresh notifications
      await fetchNotifications();
      
      // Navigate to MO detail if it's an MO-related notification
      if (notification.related_object_type === 'mo' && notification.related_object_id) {
        setIsOpen(false);
        router.push(`/supervisor/mo-detail/${notification.related_object_id}`);
        if (onNotificationClick) {
          onNotificationClick();
        }
      }
    } catch (error) {
      console.error('Error acknowledging notification:', error);
    }
  };

  const handleDismiss = async (notificationId, event) => {
    event.stopPropagation();
    
    try {
      await apiRequest(NOTIFICATIONS_APIS.DISMISS_ALERT(notificationId), {
        method: 'POST'
      });
      
      // Refresh notifications
      await fetchNotifications();
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      low: 'bg-blue-50 border-blue-200',
      medium: 'bg-yellow-50 border-yellow-200',
      high: 'bg-orange-50 border-orange-200',
      critical: 'bg-red-50 border-red-200'
    };
    return colors[severity] || 'bg-gray-50 border-gray-200';
  };

  const getSeverityIcon = (severity) => {
    const colors = {
      low: 'text-blue-600',
      medium: 'text-yellow-600',
      high: 'text-orange-600',
      critical: 'text-red-600'
    };
    return colors[severity] || 'text-gray-600';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
      >
        <BellIcon className="h-6 w-6 text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 max-h-[600px] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 text-sm text-slate-500">({unreadCount} unread)</span>
              )}
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-slate-600" />
            </button>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12">
                <BellIcon className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No new notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors ${
                      getSeverityColor(notification.severity)
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getSeverityIcon(notification.severity)}`}>
                            {notification.severity_display}
                          </span>
                          <span className="text-xs text-slate-500">
                            {notification.time_ago}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-slate-800 mb-1">
                          {notification.title}
                        </h4>
                        <p className="text-sm text-slate-600 line-clamp-2">
                          {notification.message}
                        </p>
                      </div>
                      <button
                        onClick={(e) => handleDismiss(notification.id, e)}
                        className="ml-2 p-1 rounded-lg hover:bg-slate-200 transition-colors flex-shrink-0"
                      >
                        <XMarkIcon className="h-4 w-4 text-slate-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-slate-200 bg-slate-50">
              <button
                onClick={fetchNotifications}
                className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Refresh Notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

