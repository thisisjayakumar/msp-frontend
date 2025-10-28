"use client";

import { useState, useEffect } from 'react';

export default function DashboardStats({ stats }) {
  const [animatedStats, setAnimatedStats] = useState({});

  // Animate numbers on mount
  useEffect(() => {
    if (!stats) return;

    const animateNumber = (target, key) => {
      let current = 0;
      const increment = target / 20;
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        setAnimatedStats(prev => ({ ...prev, [key]: Math.floor(current) }));
      }, 50);
    };

    // Animate MO stats
    if (stats.manufacturingOrders) {
      Object.entries(stats.manufacturingOrders).forEach(([key, value]) => {
        if (typeof value === 'number') {
          animateNumber(value, `mo_${key}`);
        } else if (typeof value === 'object' && value !== null) {
          Object.entries(value).forEach(([subKey, subValue]) => {
            if (typeof subValue === 'number') {
              animateNumber(subValue, `mo_${key}_${subKey}`);
            }
          });
        }
      });
    }

    // Animate PO stats
    if (stats.purchaseOrders) {
      Object.entries(stats.purchaseOrders).forEach(([key, value]) => {
        if (typeof value === 'number') {
          animateNumber(value, `po_${key}`);
        }
      });
    }
  }, [stats]);

  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 animate-pulse">
            <div className="h-4 bg-slate-200 rounded mb-4"></div>
            <div className="h-8 bg-slate-200 rounded mb-2"></div>
            <div className="h-3 bg-slate-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  const moStats = stats.manufacturingOrders || {};
  const poStats = stats.purchaseOrders || {};
  
  // Check if PO stats have permission error
  const hasPOError = poStats.error === 'Permission denied';

  const statCards = [
    // Manufacturing Orders
    {
      title: "Total MOs",
      value: animatedStats.mo_total || 0,
      icon: "🏭",
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-700"
    },
    {
      title: "In Progress",
      value: animatedStats.mo_in_progress || 0,
      icon: "⚡",
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
      textColor: "text-orange-700"
    },
    {
      title: "Completed MOs",
      value: animatedStats.mo_completed || 0,
      icon: "✅",
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      textColor: "text-green-700"
    },
    {
      title: "Overdue MOs",
      value: animatedStats.mo_overdue || 0,
      icon: "⚠️",
      color: "from-red-500 to-red-600",
      bgColor: "bg-red-50",
      textColor: "text-red-700"
    },
    // Purchase Orders
    {
      title: "Total POs",
      value: hasPOError ? "N/A" : (animatedStats.po_total || 0),
      icon: "📦",
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      textColor: "text-purple-700",
      subtitle: hasPOError ? "Access Restricted" : undefined
    },
    {
      title: "GM Approved",
      value: hasPOError ? "N/A" : (animatedStats.po_gm_approved || 0),
      icon: "👍",
      color: "from-indigo-500 to-indigo-600",
      bgColor: "bg-indigo-50",
      textColor: "text-indigo-700",
      subtitle: hasPOError ? "Access Restricted" : undefined
    },
    {
      title: "Completed POs",
      value: hasPOError ? "N/A" : (animatedStats.po_completed || 0),
      icon: "📋",
      color: "from-teal-500 to-teal-600",
      bgColor: "bg-teal-50",
      textColor: "text-teal-700",
      subtitle: hasPOError ? "Access Restricted" : undefined
    },
    {
      title: "Total Value",
      value: hasPOError ? "N/A" : `₹${(animatedStats.po_total_value || 0).toLocaleString()}`,
      icon: "💰",
      color: "from-emerald-500 to-emerald-600",
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-700",
      subtitle: hasPOError ? "Access Restricted" : undefined
    }
  ];

  return (
    <div className="space-y-8">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <div
            key={index}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 p-6 hover:shadow-2xl hover:shadow-slate-300/50 transition-all duration-300 group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl ${card.bgColor} flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300`}>
                {card.icon}
              </div>
              <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${card.color} opacity-60`}></div>
            </div>
            <div className="space-y-1">
              <p className="text-slate-500 text-sm font-medium">{card.title}</p>
              <p className={`text-3xl font-bold ${card.textColor}`}>
                {typeof card.value === 'string' ? card.value : card.value.toLocaleString()}
              </p>
              {card.subtitle && (
                <p className="text-xs text-red-500 font-medium">{card.subtitle}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Priority Breakdown */}
      {moStats.by_priority && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 p-6">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center space-x-2">
            <span>📊</span>
            <span>Manufacturing Orders by Priority</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-red-50 rounded-xl p-4 border border-red-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-600 font-medium">High Priority</p>
                  <p className="text-2xl font-bold text-red-700">
                    {animatedStats.mo_by_priority_high || 0}
                  </p>
                </div>
                <div className="text-2xl">🔥</div>
              </div>
            </div>
            <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-600 font-medium">Medium Priority</p>
                  <p className="text-2xl font-bold text-yellow-700">
                    {animatedStats.mo_by_priority_medium || 0}
                  </p>
                </div>
                <div className="text-2xl">⚡</div>
              </div>
            </div>
            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 font-medium">Low Priority</p>
                  <p className="text-2xl font-bold text-green-700">
                    {animatedStats.mo_by_priority_low || 0}
                  </p>
                </div>
                <div className="text-2xl">📝</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 p-6">
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center space-x-2">
          <span>⚡</span>
          <span>Quick Actions</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-4 hover:from-green-600 hover:to-green-700 transition-all duration-300 group">
            <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">📊</div>
            <p className="font-medium">Reports</p>
          </button>
          <button className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl p-4 hover:from-orange-600 hover:to-orange-700 transition-all duration-300 group">
            <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">⚙️</div>
            <p className="font-medium">Settings</p>
          </button>
        </div>
      </div>
    </div>
  );
}
