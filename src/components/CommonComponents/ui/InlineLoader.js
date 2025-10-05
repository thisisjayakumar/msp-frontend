"use client";

/**
 * Inline Loading Animation
 * A compact, modern loading indicator for inline use
 */
export default function InlineLoader({ message = "Loading...", size = "md" }) {
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32"
  };

  const dotSizes = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4"
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      {/* Animated spinner */}
      <div className={`relative ${sizeClasses[size]} mb-4`}>
        {/* Outer ring */}
        <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
        
        {/* Spinning gradient ring */}
        <div className="absolute inset-0 border-4 border-transparent border-t-blue-600 border-r-indigo-600 rounded-full animate-spin"></div>
        
        {/* Inner pulsing circle */}
        <div className="absolute inset-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full animate-pulse"></div>
        
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg 
            className="w-8 h-8 text-blue-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
            />
          </svg>
        </div>
      </div>

      {/* Loading text */}
      {message && (
        <div className="text-center">
          <p className="text-slate-700 font-medium mb-2">{message}</p>
          
          {/* Animated dots */}
          <div className="flex justify-center space-x-1">
            <div className={`${dotSizes[size]} bg-blue-500 rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></div>
            <div className={`${dotSizes[size]} bg-indigo-500 rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></div>
            <div className={`${dotSizes[size]} bg-blue-500 rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      )}
    </div>
  );
}
