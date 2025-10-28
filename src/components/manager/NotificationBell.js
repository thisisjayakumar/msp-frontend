"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BellIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { notificationsAPI } from '@/components/API_Service/notifications-api';

export default function ManagerNotificationBell({ onNotificationClick }) {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch notifications using centralized API service
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      // Use workflow notifications API for manager notifications
      const data = await notificationsAPI.getWorkflowNotifications({
        is_read: 'false'  // Only get unread notifications
      });
      
      // Handle the response data
      setNotifications(data.results || []);
      setUnreadCount(data.results ? data.results.length : 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      
      // Handle rate limiting errors gracefully
      if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
        console.warn('Rate limited while fetching notifications - will retry');
        return;
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch notifications on mount and poll every 60 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
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
    // Mark notification as read first
    try {
      await notificationsAPI.markWorkflowNotificationRead(notification.id);
      
      // Refresh notifications
      await fetchNotifications();
      
      // Navigate to appropriate page based on notification type
      if (notification.notification_type === 'mo_created' && notification.related_mo) {
        setIsOpen(false);
        
        // Try to navigate to MO detail, but handle errors gracefully
        try {
          router.push(`/manager/mo-detail/${notification.related_mo}`);
          if (onNotificationClick) {
            onNotificationClick();
          }
        } catch (navigationError) {
          console.warn('Navigation error (MO might not exist):', navigationError);
          // Show a user-friendly message
          alert('This manufacturing order is no longer available. The notification has been removed.');
        }
      } else if (notification.notification_type === 'mo_approved') {
        setIsOpen(false);
        router.push('/manager/mo-approval');
        if (onNotificationClick) {
          onNotificationClick();
        }
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
      
      // If it's an MO-related notification and there's an error, 
      // it might be because the MO doesn't exist anymore
      if (notification.related_mo && notification.mo_id) {
        console.warn('MO might not exist, removing notification from list');
        // Remove the notification from the local state
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        // Show user-friendly message
        alert('This manufacturing order is no longer available. The notification has been removed.');
      }
    }
  };

  const handleDismiss = async (notificationId, event) => {
    event.stopPropagation();
    
    try {
      await notificationsAPI.markWorkflowNotificationRead(notificationId);
      
      // Refresh notifications
      await fetchNotifications();
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-blue-50 border-blue-200',
      medium: 'bg-yellow-50 border-yellow-200',
      high: 'bg-orange-50 border-orange-200',
      urgent: 'bg-red-50 border-red-200'
    };
    return colors[priority] || 'bg-gray-50 border-gray-200';
  };

  const getPriorityIcon = (priority) => {
    const icons = {
      low: '🔵',
      medium: '🟡',
      high: '🟠',
      urgent: '🔴'
    };
    return icons[priority] || '⚪';
  };

  const getNotificationIcon = (notificationType) => {
    const icons = {
      mo_created: '🏭',
      mo_approved: '✅',
      mo_rejected: '❌',
      rm_allocated: '📦',
      process_assigned: '⚙️',
      batch_allocated: '📋',
      process_completed: '✅',
      quality_check_required: '🔍',
      fg_verification_required: '📋'
    };
    return icons[notificationType] || '🔔';
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
        disabled={loading}
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">Notifications</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            {unreadCount > 0 && (
              <p className="text-sm text-slate-600 mt-1">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-slate-600 mt-2">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-4xl mb-2">🔔</div>
                <p className="text-slate-600">No new notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors border-l-4 ${getPriorityColor(notification.priority)}`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 text-lg">
                        {getNotificationIcon(notification.notification_type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-slate-800 truncate">
                            {notification.title}
                          </h4>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-slate-500">
                              {formatTimeAgo(notification.created_at)}
                            </span>
                            <button
                              onClick={(e) => handleDismiss(notification.id, e)}
                              className="p-1 text-slate-400 hover:text-slate-600 rounded"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        
                        <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        
                        {notification.action_required && (
                          <div className="mt-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Action Required
                            </span>
                          </div>
                        )}
                        
                        {notification.related_mo && (
                          <div className="mt-2 text-xs text-slate-500">
                            MO: {notification.related_mo}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-4 border-t border-slate-200">
              <button
                onClick={() => router.push('/manager/notifications')}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View All Notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
