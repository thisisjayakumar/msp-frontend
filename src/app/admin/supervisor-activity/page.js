"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import workCenterAPI from '@/components/API_Service/work-center-api';
import LoadingSpinner from '@/components/CommonComponents/ui/LoadingSpinner';
import { 
  ChartBarIcon, ClockIcon, CheckCircleIcon, 
  ArrowTrendingUpIcon, FunnelIcon, CalendarIcon
} from '@heroicons/react/24/outline';

export default function SupervisorActivityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('today'); // today, logs, summary
  const [todayLogs, setTodayLogs] = useState(null);
  const [allLogs, setAllLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [workCenters, setWorkCenters] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  
  // Filters
  const [filters, setFilters] = useState({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    end_date: new Date().toISOString().split('T')[0], // Today
    work_center_id: '',
    supervisor_id: '',
  });

  // Auth check
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('authToken');
      const userRole = localStorage.getItem('userRole');
      
      if (!token || !['admin', 'manager'].includes(userRole)) {
        router.push('/login');
        return;
      }
      
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      const [wcData, supervisorsData] = await Promise.all([
        workCenterAPI.workCenterMaster.getAll(),
        workCenterAPI.workCenterMaster.getSupervisors(),
      ]);

      if (!wcData.error) setWorkCenters(wcData);
      if (!supervisorsData.error) setSupervisors(supervisorsData);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  }, []);

  // Fetch today's logs
  const fetchTodayLogs = useCallback(async () => {
    try {
      const data = await workCenterAPI.activityLog.getToday();
      if (!data.error && data.logs) {
        setTodayLogs(data);
      }
    } catch (error) {
      console.error('Error fetching today logs:', error);
    }
  }, []);

  // Fetch all logs with filters
  const fetchAllLogs = useCallback(async () => {
    try {
      const cleanFilters = {};
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          cleanFilters[key] = value;
        }
      });

      const data = await workCenterAPI.activityLog.getAll(cleanFilters);
      if (!data.error) {
        setAllLogs(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      setAllLogs([]);
    }
  }, [filters]);

  // Fetch summary
  const fetchSummary = useCallback(async () => {
    try {
      const cleanFilters = {};
      if (filters.start_date) cleanFilters.start_date = filters.start_date;
      if (filters.end_date) cleanFilters.end_date = filters.end_date;

      const data = await workCenterAPI.activityLog.getSummary(cleanFilters);
      if (!data.error) {
        setSummary(data);
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  }, [filters.start_date, filters.end_date]);

  useEffect(() => {
    if (!loading) {
      fetchData();
    }
  }, [loading, fetchData]);

  useEffect(() => {
    if (!loading) {
      if (activeTab === 'today') {
        fetchTodayLogs();
      } else if (activeTab === 'logs') {
        fetchAllLogs();
      } else if (activeTab === 'summary') {
        fetchSummary();
      }
    }
  }, [loading, activeTab, fetchTodayLogs, fetchAllLogs, fetchSummary]);

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Supervisor Activity Logs</h1>
        <p className="text-slate-600 mt-1">Track supervisor performance and work center operations</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2">
        {[
          { id: 'today', label: "Today's Activity", icon: CalendarIcon },
          { id: 'logs', label: 'Activity Logs', icon: ChartBarIcon },
          { id: 'summary', label: 'Summary & Statistics', icon: ArrowTrendingUpIcon },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-slate-700 hover:bg-slate-50 shadow'
            }`}
          >
            <tab.icon className="h-5 w-5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Today's Activity Tab */}
      {activeTab === 'today' && todayLogs && (
        <div>
          {/* Today's Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Active Work Centers</p>
                  <p className="text-3xl font-bold text-slate-800 mt-2">
                    {todayLogs.logs?.length || 0}
                  </p>
                </div>
                <ChartBarIcon className="h-12 w-12 text-blue-500 opacity-50" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Total MOs</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">
                    {todayLogs.logs?.reduce((sum, log) => sum + log.mos_handled, 0) || 0}
                  </p>
                </div>
                <CheckCircleIcon className="h-12 w-12 text-blue-500 opacity-50" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Total Operations</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    {todayLogs.logs?.reduce((sum, log) => sum + log.total_operations, 0) || 0}
                  </p>
                </div>
                <ArrowTrendingUpIcon className="h-12 w-12 text-green-500 opacity-50" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Completed Ops</p>
                  <p className="text-3xl font-bold text-purple-600 mt-2">
                    {todayLogs.logs?.reduce((sum, log) => sum + log.operations_completed, 0) || 0}
                  </p>
                </div>
                <CheckCircleIcon className="h-12 w-12 text-purple-500 opacity-50" />
              </div>
            </div>
          </div>

          {/* Today's Activity Table */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600">
              <h3 className="text-lg font-bold text-white">Today's Work Center Activity</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Work Center</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Supervisor</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-600 uppercase">MOs Handled</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-600 uppercase">Total Ops</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-600 uppercase">Completed</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-600 uppercase">In Progress</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-600 uppercase">Time (min)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {todayLogs.logs && todayLogs.logs.length > 0 ? (
                    todayLogs.logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-slate-800">
                          {log.work_center_name}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700">
                          {log.active_supervisor_name}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                            {log.mos_handled}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-3 py-1 bg-slate-100 text-slate-800 rounded-full text-sm font-medium">
                            {log.total_operations}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                            {log.operations_completed}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
                            {log.operations_in_progress}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-slate-700">
                          {log.total_processing_time_minutes}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                        No activity recorded for today
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Activity Logs Tab */}
      {activeTab === 'logs' && (
        <div>
          {/* Filters */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <FunnelIcon className="h-6 w-6 text-slate-600" />
              <h3 className="text-lg font-semibold text-slate-800">Filters</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => handleFilterChange('start_date', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={filters.end_date}
                  onChange={(e) => handleFilterChange('end_date', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Work Center</label>
                <select
                  value={filters.work_center_id}
                  onChange={(e) => handleFilterChange('work_center_id', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Work Centers</option>
                  {workCenters.map((wc) => (
                    <option key={wc.id} value={wc.work_center.id}>
                      {wc.work_center.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Supervisor</label>
                <select
                  value={filters.supervisor_id}
                  onChange={(e) => handleFilterChange('supervisor_id', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Supervisors</option>
                  {supervisors.map((sup) => (
                    <option key={sup.id} value={sup.id}>
                      {sup.full_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Logs Table */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600">
              <h3 className="text-lg font-bold text-white">Activity Logs</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Work Center</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Supervisor</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-600 uppercase">MOs</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-600 uppercase">Operations</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-600 uppercase">Completed</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-600 uppercase">Time (min)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {allLogs.length > 0 ? (
                    allLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-slate-700">{log.date}</td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-800">
                          {log.work_center_name}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700">
                          {log.active_supervisor_name}
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-slate-700">{log.mos_handled}</td>
                        <td className="px-6 py-4 text-center text-sm text-slate-700">{log.total_operations}</td>
                        <td className="px-6 py-4 text-center text-sm text-slate-700">{log.operations_completed}</td>
                        <td className="px-6 py-4 text-center text-sm text-slate-700">
                          {log.total_processing_time_minutes}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                        No activity logs found for the selected filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Summary Tab */}
      {activeTab === 'summary' && summary && (
        <div>
          {/* Date Range Info */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Summary Period</h3>
                <p className="text-slate-600 mt-1">
                  {summary.date_range?.start} to {summary.date_range?.end}
                </p>
              </div>
              <div className="flex gap-4">
                <input
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => handleFilterChange('start_date', e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded-lg"
                />
                <input
                  type="date"
                  value={filters.end_date}
                  onChange={(e) => handleFilterChange('end_date', e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Supervisor Summary */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden mb-6">
            <div className="px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600">
              <h3 className="text-lg font-bold text-white">Supervisor Performance Summary</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Supervisor</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-600 uppercase">Days Active</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-600 uppercase">Total MOs</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-600 uppercase">Total Operations</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-600 uppercase">Completed</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-600 uppercase">Total Time (hrs)</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-600 uppercase">Avg/Day</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {summary.supervisor_summary && summary.supervisor_summary.length > 0 ? (
                    summary.supervisor_summary.map((sup, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-slate-800">
                          {sup.active_supervisor__first_name} {sup.active_supervisor__last_name}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                            {sup.total_days}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-slate-700">
                          {sup.total_mos || 0}
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-slate-700">
                          {sup.total_operations || 0}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                            {sup.total_completed || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-slate-700">
                          {sup.total_time ? Math.round(sup.total_time / 60) : 0}
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-slate-700">
                          {sup.total_days > 0 ? Math.round((sup.total_operations || 0) / sup.total_days) : 0}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                        No supervisor data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Work Center Summary */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-green-600 to-teal-600">
              <h3 className="text-lg font-bold text-white">Work Center Performance Summary</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Work Center</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-600 uppercase">Total MOs</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-600 uppercase">Total Operations</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-600 uppercase">Completed</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-600 uppercase">Completion Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {summary.work_center_summary && summary.work_center_summary.length > 0 ? (
                    summary.work_center_summary.map((wc, idx) => {
                      const completionRate = wc.total_operations > 0 
                        ? Math.round((wc.total_completed / wc.total_operations) * 100) 
                        : 0;
                      
                      return (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-slate-800">
                            {wc.work_center__name}
                          </td>
                          <td className="px-6 py-4 text-center text-sm text-slate-700">
                            {wc.total_mos || 0}
                          </td>
                          <td className="px-6 py-4 text-center text-sm text-slate-700">
                            {wc.total_operations || 0}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                              {wc.total_completed || 0}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-32 bg-slate-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    completionRate >= 80 ? 'bg-green-500' :
                                    completionRate >= 50 ? 'bg-amber-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${completionRate}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium text-slate-700">
                                {completionRate}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                        No work center data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

