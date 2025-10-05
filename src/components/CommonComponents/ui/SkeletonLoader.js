"use client";

/**
 * Skeleton Loader Components
 * Modern skeleton loading placeholders for content
 */

// Card Skeleton
export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="h-5 bg-slate-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2"></div>
        </div>
        <div className="h-8 w-8 bg-slate-200 rounded-full"></div>
      </div>
      
      <div className="space-y-3 mb-4">
        <div className="h-4 bg-slate-200 rounded w-full"></div>
        <div className="h-4 bg-slate-200 rounded w-5/6"></div>
        <div className="h-4 bg-slate-200 rounded w-4/6"></div>
      </div>
      
      <div className="flex space-x-2">
        <div className="h-9 bg-slate-200 rounded flex-1"></div>
        <div className="h-9 bg-slate-200 rounded flex-1"></div>
      </div>
    </div>
  );
}

// Table Row Skeleton
export function TableRowSkeleton() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-4">
        <div className="h-4 bg-slate-200 rounded w-24"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-slate-200 rounded w-32"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-slate-200 rounded w-20"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-6 bg-slate-200 rounded-full w-16"></div>
      </td>
      <td className="px-6 py-4">
        <div className="flex space-x-2">
          <div className="h-8 w-8 bg-slate-200 rounded"></div>
          <div className="h-8 w-8 bg-slate-200 rounded"></div>
        </div>
      </td>
    </tr>
  );
}

// Stats Card Skeleton
export function StatsCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="h-4 bg-slate-200 rounded w-24 mb-3"></div>
          <div className="h-8 bg-slate-200 rounded w-16 mb-2"></div>
          <div className="h-3 bg-slate-200 rounded w-32"></div>
        </div>
        <div className="h-12 w-12 bg-slate-200 rounded-full"></div>
      </div>
    </div>
  );
}

// Product Card Skeleton (specific for RM dashboard)
export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-6 animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="h-6 bg-slate-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2"></div>
        </div>
        <div className="h-6 w-20 bg-slate-200 rounded-full"></div>
      </div>

      {/* Details */}
      <div className="space-y-3 mb-4 pb-4 border-b border-slate-100">
        <div className="flex justify-between">
          <div className="h-4 bg-slate-200 rounded w-24"></div>
          <div className="h-4 bg-slate-200 rounded w-32"></div>
        </div>
        <div className="flex justify-between">
          <div className="h-4 bg-slate-200 rounded w-20"></div>
          <div className="h-4 bg-slate-200 rounded w-28"></div>
        </div>
        <div className="flex justify-between">
          <div className="h-4 bg-slate-200 rounded w-28"></div>
          <div className="h-4 bg-slate-200 rounded w-24"></div>
        </div>
      </div>

      {/* Stock Info */}
      <div className="mb-4">
        <div className="h-5 bg-slate-200 rounded w-32 mb-2"></div>
        <div className="h-4 bg-slate-200 rounded w-40"></div>
      </div>

      {/* Actions */}
      <div className="flex space-x-2">
        <div className="h-10 bg-slate-200 rounded flex-1"></div>
        <div className="h-10 bg-slate-200 rounded flex-1"></div>
      </div>
    </div>
  );
}

// Grid of Product Cards Skeleton
export function ProductGridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

// Dashboard Stats Grid Skeleton
export function DashboardStatsSkeleton({ count = 5 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
      {Array.from({ length: count }).map((_, index) => (
        <StatsCardSkeleton key={index} />
      ))}
    </div>
  );
}

export default {
  CardSkeleton,
  TableRowSkeleton,
  StatsCardSkeleton,
  ProductCardSkeleton,
  ProductGridSkeleton,
  DashboardStatsSkeleton
};
