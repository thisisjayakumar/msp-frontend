"use client";

import { useState } from 'react';
import { toast } from '@/utils/notifications';

/**
 * Test component for NotifyX notifications
 * Use this to verify NotifyX is working properly
 */
export default function NotifyXTest() {
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
      // Test navigation notification
      toast.navigation.redirecting('Test Destination');
    }, 3000);
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
        className="fixed bottom-4 right-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
      >
        🧪 Test NotifyX
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border p-4 space-y-2 z-50">
      <h3 className="text-sm font-semibold mb-2">NotifyX Test</h3>
      <div className="space-y-2">
        <button
          onClick={testNotifications}
          className="w-full px-3 py-1.5 bg-blue-600 text-white rounded text-sm"
        >
          Test All Types
        </button>
        <button
          onClick={testPONotification}
          className="w-full px-3 py-1.5 bg-purple-600 text-white rounded text-sm"
        >
          Test PO Created
        </button>
        <button
          onClick={testMONotification}
          className="w-full px-3 py-1.5 bg-green-600 text-white rounded text-sm"
        >
          Test MO Created
        </button>
        <button
          onClick={() => setIsVisible(false)}
          className="w-full px-3 py-1.5 bg-gray-600 text-white rounded text-sm"
        >
          Close
        </button>
      </div>
    </div>
  );
}
