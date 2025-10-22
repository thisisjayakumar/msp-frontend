'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NotificationCenter() {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all'); // all, unread, action_required

  useEffect(() => {
    fetchNotifications();
    // Set up real-time updates (polling every 30 seconds)
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      const url = filter === 'all' 
        ? '/api/notifications/workflow-notifications/' 
        : `/api/notifications/workflow-notifications/?is_read=${filter === 'unread' ? 'false' : 'true'}&action_required=${filter === 'action_required' ? 'true' : 'false'}`;
      
      const response = await fetch(url);
      const data = await response.json();
      setNotifications(data.results || []);
      
      // Count unread notifications
      const unread = (data.results || []).filter(n => !n.is_read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`/api/notifications/workflow-notifications/${notificationId}/mark_read/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Update local state
        setNotifications(notifications.map(n => 
          n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        ));
        setUnreadCount(Math.max(0, unreadCount - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/workflow-notifications/mark_all_read/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setNotifications(notifications.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      'mo_created': '📋',
      'mo_approved': '✅',
      'mo_rejected': '❌',
      'rm_allocation_required': '📦',
      'rm_allocated': '📦',
      'process_assigned': '👤',
      'process_reassigned': '🔄',
      'batch_allocated': '📊',
      'batch_received': '📥',
      'process_started': '▶️',
      'process_completed': '🏁',
      'quality_check_required': '🔍',
      'fg_verification_required': '✅',
      'ready_for_dispatch': '🚚',
    };
    return icons[type] || '📢';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'low': 'text-gray-500',
      'medium': 'text-blue-600',
      'high': 'text-orange-600',
      'urgent': 'text-red-600',
    };
    return colors[priority] || 'text-gray-500';
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleNotificationClick = (notification) => {
    // Mark as read if not already read
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    // Navigate based on notification type
    if (notification.related_mo) {
      router.push(`/manager/mo-details/${notification.related_mo}`);
    } else if (notification.related_batch) {
      router.push(`/operator/batch-details/${notification.related_batch}`);
    } else if (notification.related_process_assignment) {
      router.push(`/production-head/process-details/${notification.related_process_assignment}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
              <p className="mt-1 text-sm text-gray-500">
                {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
              </p>
            </div>
            <div className="flex space-x-4">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Mark All Read
                </button>
              )}
              <button
                onClick={() => router.back()}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'all', label: 'All', count: notifications.length },
                { key: 'unread', label: 'Unread', count: unreadCount },
                { key: 'action_required', label: 'Action Required', count: notifications.filter(n => n.action_required).length },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    filter === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                      filter === tab.key ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white shadow rounded-lg">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.828 7l2.586 2.586a2 2 0 002.828 0L12 7H4.828z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filter === 'all' ? 'You have no notifications yet.' : 
                 filter === 'unread' ? 'All notifications have been read.' :
                 'No notifications require action.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-6 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notification.is_read ? 'bg-blue-50 border-l-4 border-blue-400' : ''
                  }`}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">{getNotificationIcon(notification.notification_type)}</span>
                    </div>
                    <div className="ml-4 flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className={`text-sm font-medium ${
                          !notification.is_read ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </h3>
                        <div className="flex items-center space-x-2">
                          {notification.action_required && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Action Required
                            </span>
                          )}
                          <span className={`text-xs ${getPriorityColor(notification.priority)}`}>
                            {notification.priority}
                          </span>
                          <span className="text-xs text-gray-500">
                            {getTimeAgo(notification.created_at)}
                          </span>
                        </div>
                      </div>
                      <p className={`mt-1 text-sm ${
                        !notification.is_read ? 'text-gray-900' : 'text-gray-600'
                      }`}>
                        {notification.message}
                      </p>
                      {notification.related_mo && (
                        <p className="mt-1 text-xs text-gray-500">
                          MO: {notification.related_mo.mo_id}
                        </p>
                      )}
                      {notification.related_batch && (
                        <p className="mt-1 text-xs text-gray-500">
                          Batch: {notification.related_batch.batch_id}
                        </p>
                      )}
                    </div>
                    {!notification.is_read && (
                      <div className="flex-shrink-0 ml-4">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
