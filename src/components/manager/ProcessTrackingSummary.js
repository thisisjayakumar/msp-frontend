"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  PlayIcon, 
  PauseIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  ClockIcon,
  ChevronRightIcon 
} from '@heroicons/react/24/outline';

// API Services
import processTrackingAPI from '@/components/API_Service/process-tracking-api';
import manufacturingAPI from '@/components/API_Service/manufacturing-api';

export default function ProcessTrackingSummary() {
  const router = useRouter();
  const [activeProcesses, setActiveProcesses] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({
    total_active: 0,
    in_progress: 0,
    completed_today: 0,
    overdue: 0
  });
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  
  // Use ref to prevent duplicate fetches
  const isFetching = useRef(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    const storedRole = localStorage.getItem('userRole');
    if (storedRole) {
      setUserRole(storedRole);
    }
  }, []);

  const resolveRolePath = () => {
    const role = userRole || localStorage.getItem('userRole');
    return role === 'production_head' ? 'production-head' : 'manager';
  };

  // Fetch process tracking data
  const fetchData = async () => {
    // Prevent duplicate fetches
    if (isFetching.current) {
      console.log('ProcessTrackingSummary: Already fetching, skipping...');
      return Promise.resolve();
    }

    isFetching.current = true;
    
    try {
      setLoading(true);
      
      // Get active MOs with process tracking
      const mosResponse = await manufacturingAPI.manufacturingOrders.getAll({
        status: 'in_progress',
        ordering: '-created_at',
        page_size: 10
      });

      // Check if response is valid
      if (mosResponse?.error) {
        console.warn('Error fetching MOs:', mosResponse.message);
        setLoading(false);
        return;
      }

      // Get process executions for active MOs - limit to 3 to prevent duplicate calls
      const mosList = Array.isArray(mosResponse?.results) ? mosResponse.results : [];
      const limitedMosList = mosList.slice(0, 3); // Only fetch for first 3 MOs
      const processPromises = limitedMosList.map(async (mo) => {
        try {
          const processData = await processTrackingAPI.getMOWithProcesses(mo.id);
          return processData;
        } catch (error) {
          console.error(`Error fetching processes for MO ${mo.mo_id}:`, error);
          return null;
        }
      });

      const processResults = await Promise.all(processPromises);
      const validProcesses = processResults.filter(Boolean);
      setActiveProcesses(validProcesses);

      // Get active alerts
      const alertsData = await processTrackingAPI.getActiveAlerts();
      const alertsList = alertsData?.error ? [] : (Array.isArray(alertsData) ? alertsData : []);
      setAlerts(alertsList.slice(0, 5)); // Show only top 5 alerts

      // Calculate stats
      const totalActive = validProcesses.length;
      const inProgress = validProcesses.filter(mo => 
        mo.process_executions?.some(exec => exec.status === 'in_progress')
      ).length;
      
      const today = new Date().toDateString();
      const completedToday = validProcesses.filter(mo => 
        mo.process_executions?.some(exec => 
          exec.status === 'completed' && 
          new Date(exec.actual_end_time).toDateString() === today
        )
      ).length;

      const overdue = validProcesses.filter(mo => 
        mo.process_executions?.some(exec => exec.is_overdue)
      ).length;

      setStats({
        total_active: totalActive,
        in_progress: inProgress,
        completed_today: completedToday,
        overdue: overdue
      });

      hasFetched.current = true;

    } catch (error) {
      console.error('Error fetching process tracking data:', error);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  };

  // Fetch data only once on mount
  useEffect(() => {
    let interval;
    
    // Initial fetch - only once
    if (!hasFetched.current) {
      console.log('ProcessTrackingSummary: Initial fetch');
      fetchData();
    }
    
    // Set up polling for updates (starts after component mounts)
    interval = setInterval(() => {
      console.log('ProcessTrackingSummary: Polling refresh');
      fetchData();
    }, 120000); // Poll every 120 seconds (2 minutes)
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, []); // Empty dependency array - only run once on mount

  const getStatusIcon = (status) => {
    const icons = {
      pending: ClockIcon,
      in_progress: PlayIcon,
      completed: CheckCircleIcon,
      on_hold: PauseIcon,
      failed: ExclamationTriangleIcon
    };
    return icons[status] || ClockIcon;
  };

  const getStatusColor = (status, isOverdue = false) => {
    if (isOverdue) return 'text-red-600';
    
    const colors = {
      pending: 'text-gray-600',
      in_progress: 'text-blue-600',
      completed: 'text-green-600',
      on_hold: 'text-yellow-600',
      failed: 'text-red-600'
    };
    return colors[status] || 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="text-center">
                <div className="h-8 bg-slate-200 rounded w-12 mx-auto mb-2"></div>
                <div className="h-4 bg-slate-200 rounded w-16 mx-auto"></div>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
          <span>🏭</span>
          <span>Process Tracking</span>
        </h3>
        <button
          onClick={() => router.push(`/${resolveRolePath()}/dashboard`)}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
        >
          <span>View All</span>
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-blue-50 rounded-xl">
          <div className="text-2xl font-bold text-blue-600 mb-1">
            {stats.total_active}
          </div>
          <div className="text-sm text-blue-700 font-medium">Active MOs</div>
        </div>
        
        <div className="text-center p-4 bg-orange-50 rounded-xl">
          <div className="text-2xl font-bold text-orange-600 mb-1">
            {stats.in_progress}
          </div>
          <div className="text-sm text-orange-700 font-medium">In Progress</div>
        </div>
        
        <div className="text-center p-4 bg-green-50 rounded-xl">
          <div className="text-2xl font-bold text-green-600 mb-1">
            {stats.completed_today}
          </div>
          <div className="text-sm text-green-700 font-medium">Completed Today</div>
        </div>
        
        <div className="text-center p-4 bg-red-50 rounded-xl">
          <div className="text-2xl font-bold text-red-600 mb-1">
            {stats.overdue}
          </div>
          <div className="text-sm text-red-700 font-medium">Overdue</div>
        </div>
      </div>

      {/* Active Processes */}
      {activeProcesses.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-slate-800 mb-3">Active Manufacturing Orders</h4>
          <div className="space-y-3">
            {activeProcesses.slice(0, 3).map((mo) => {
              const activeProcess = mo.active_process;
              const overallProgress = mo.overall_progress || 0;
              
              return (
                <div
                  key={mo.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                  onClick={() => router.push(`/${resolveRolePath()}/mo-detail/${mo.id}`)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-white rounded-lg border-2 border-slate-200 flex items-center justify-center">
                        <span className="text-sm font-bold text-slate-700">
                          {mo.mo_id?.split('-').pop()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="font-semibold text-slate-800 mb-1">
                        {mo.mo_id}
                      </div>
                      <div className="text-sm text-slate-600">
                        {mo.product_code_display} • Qty: {mo.quantity?.toLocaleString()}
                      </div>
                      {activeProcess && (
                        <div className="text-xs text-blue-600 mt-1">
                          Active: {activeProcess.process_name}
                        </div>
                      )}
                      {activeProcess?.batch_counts && (
                        <div className="text-xs text-slate-500 mt-2 flex flex-wrap gap-2">
                          <span className="px-2 py-1 bg-gray-100 rounded">📦 {activeProcess.batch_counts.total} batches</span>
                          {activeProcess.batch_counts.pending > 0 && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded">{activeProcess.batch_counts.pending} pending</span>
                          )}
                          {activeProcess.batch_counts.in_progress > 0 && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">{activeProcess.batch_counts.in_progress} in progress</span>
                          )}
                          {activeProcess.batch_counts.completed > 0 && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded">{activeProcess.batch_counts.completed} completed</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {/* Progress Circle */}
                    <div className="relative w-12 h-12">
                      <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 48 48">
                        <circle
                          cx="24"
                          cy="24"
                          r="20"
                          stroke="currentColor"
                          strokeWidth="3"
                          fill="none"
                          className="text-slate-200"
                        />
                        <circle
                          cx="24"
                          cy="24"
                          r="20"
                          stroke="currentColor"
                          strokeWidth="3"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 20}`}
                          strokeDashoffset={`${2 * Math.PI * 20 * (1 - overallProgress / 100)}`}
                          className="text-blue-600 transition-all duration-1000"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold text-slate-700">
                          {Math.round(overallProgress)}%
                        </span>
                      </div>
                    </div>

                    <ChevronRightIcon className="h-5 w-5 text-slate-400" />
                  </div>
                </div>
              );
            })}
          </div>
          
          {activeProcesses.length > 3 && (
            <div className="text-center mt-3">
              <button
                onClick={() => router.push(`/${resolveRolePath()}/dashboard`)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View {activeProcesses.length - 3} more active MOs
              </button>
            </div>
          )}
        </div>
      )}

      {/* Recent Alerts */}
      {alerts.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-slate-800 mb-3 flex items-center space-x-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
            <span>Recent Alerts</span>
          </h4>
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium text-red-800 text-sm">
                    {alert.title}
                  </div>
                  <div className="text-xs text-red-600 mt-1">
                    {new Date(alert.created_at).toLocaleString()}
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  alert.severity === 'critical' ? 'bg-red-100 text-red-700' :
                  alert.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {alert.severity_display}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {activeProcesses.length === 0 && alerts.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">🏭</div>
          <h4 className="text-lg font-medium text-slate-600 mb-2">No Active Processes</h4>
          <p className="text-slate-500 text-sm">
            Manufacturing orders with initialized processes will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
