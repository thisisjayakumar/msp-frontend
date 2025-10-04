"use client";

import { useState, useEffect } from 'react';
import Card from '../CommonComponents/ui/Card';

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

    // Animate all stats
    Object.entries(stats).forEach(([key, value]) => {
      if (typeof value === 'number') {
        animateNumber(value, key);
      }
    });
  }, [stats]);

  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Products',
      value: animatedStats.total_products || stats.total_products || 0,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'Total products in system'
    },
    {
      title: 'In Stock',
      value: animatedStats.products_with_stock || stats.products_with_stock || 0,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Products with available stock'
    },
    {
      title: 'Out of Stock',
      value: animatedStats.products_out_of_stock || stats.products_out_of_stock || 0,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      ),
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      description: 'Products with zero stock'
    },
    {
      title: 'No Stock Record',
      value: animatedStats.products_no_stock_record || stats.products_no_stock_record || 0,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      description: 'Products without stock records'
    },
    {
      title: 'Stock Records',
      value: animatedStats.total_stock_records || stats.total_stock_records || 0,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      description: 'Total stock balance records'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
      {statCards.map((stat, index) => (
        <Card key={index} className={`p-6 ${stat.bgColor} border-l-4 border-l-current ${stat.color}`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">
                {stat.title}
              </p>
              <p className={`text-3xl font-bold ${stat.color} mb-1`}>
                {stat.value.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">
                {stat.description}
              </p>
            </div>
            <div className={`${stat.color} opacity-80`}>
              {stat.icon}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
