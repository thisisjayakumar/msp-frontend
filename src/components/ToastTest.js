"use client";

import { useState } from 'react';
import { toast } from '@/utils/notifications';

/**
 * Test component for react-hot-toast notifications
 * Use this to verify the new toast system is working properly
 */
export default function ToastTest() {
  const [isVisible, setIsVisible] = useState(false);

  const testNotifications = () => {
    // Test success notification
    toast.success('Test Success', 'This is a success notification');
    
    setTimeout(() => {
      // Test info notification
      toast.info('Test Info', 'This is an info notification');
    }, 1000);
    
    setTimeout(() => {
      // Test warning notification
      toast.warning('Test Warning', 'This is a warning notification');
    }, 2000);
    
    setTimeout(() => {
      // Test error notification
      toast.error('Test Error', 'This is an error notification');
    }, 3000);
    
    setTimeout(() => {
      // Test navigation notification
      toast.navigation.redirecting('Test Destination');
    }, 4000);
  };

  const testPONotification = () => {
    toast.po.created({
      po_id: 'TEST001',
      total_amount: '25000.00'
    });
  };

  const testMONotification = () => {
    toast.mo.created({
      mo_id: 'TEST001',
      quantity: 100
    });
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors z-50"
      >
        🧪 Test Toast
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border p-4 space-y-2 z-50 max-w-xs">
      <h3 className="text-sm font-semibold mb-2">Toast Test</h3>
      
      <button
        onClick={testNotifications}
        className="w-full px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
      >
        Test All Types
      </button>
      
      <button
        onClick={testPONotification}
        className="w-full px-3 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
      >
        Test PO Notification
      </button>
      
      <button
        onClick={testMONotification}
        className="w-full px-3 py-2 bg-purple-500 text-white rounded text-sm hover:bg-purple-600 transition-colors"
      >
        Test MO Notification
      </button>
      
      <button
        onClick={() => setIsVisible(false)}
        className="w-full px-3 py-2 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors"
      >
        Close
      </button>
    </div>
  );
}
