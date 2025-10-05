"use client";

/**
 * Modern Dashboard Loading Animation
 * A beautiful, animated loading screen for dashboards
 */
export default function DashboardLoader({ message = "Loading Dashboard..." }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="text-center">
        {/* Animated Logo/Icon Container */}
        <div className="relative w-32 h-32 mx-auto mb-8">
          {/* Outer rotating ring */}
          <div className="absolute inset-0 border-4 border-blue-200 rounded-full animate-spin-slow"></div>
          
          {/* Middle pulsing ring */}
          <div className="absolute inset-2 border-4 border-indigo-300 rounded-full animate-pulse"></div>
          
          {/* Inner rotating ring (opposite direction) */}
          <div className="absolute inset-4 border-4 border-blue-400 rounded-full animate-spin-reverse"></div>
          
          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg 
              className="w-12 h-12 text-blue-600 animate-bounce-slow" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" 
              />
            </svg>
          </div>
        </div>

        {/* Loading Text */}
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-slate-800 animate-fade-in">
            {message}
          </h2>
          
          {/* Animated dots */}
          <div className="flex justify-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>

          {/* Progress bar */}
          <div className="w-64 h-2 bg-slate-200 rounded-full overflow-hidden mx-auto mt-6">
            <div className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 animate-progress"></div>
          </div>

          {/* Subtitle */}
          <p className="text-sm text-slate-600 mt-4 animate-fade-in-delayed">
            Preparing your workspace...
          </p>
        </div>

        {/* Floating particles effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400 rounded-full animate-float-1 opacity-60"></div>
          <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-indigo-400 rounded-full animate-float-2 opacity-40"></div>
          <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-blue-300 rounded-full animate-float-3 opacity-50"></div>
          <div className="absolute bottom-1/3 right-1/3 w-2 h-2 bg-indigo-300 rounded-full animate-float-4 opacity-60"></div>
        </div>
      </div>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes spin-reverse {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes progress {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in-delayed {
          0% {
            opacity: 0;
          }
          50% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }

        @keyframes float-1 {
          0%, 100% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(20px, -20px);
          }
        }

        @keyframes float-2 {
          0%, 100% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(-30px, 30px);
          }
        }

        @keyframes float-3 {
          0%, 100% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(25px, 25px);
          }
        }

        @keyframes float-4 {
          0%, 100% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(-20px, -30px);
          }
        }

        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }

        .animate-spin-reverse {
          animation: spin-reverse 4s linear infinite;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }

        .animate-progress {
          animation: progress 1.5s ease-in-out infinite;
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-fade-in-delayed {
          animation: fade-in-delayed 2s ease-out;
        }

        .animate-float-1 {
          animation: float-1 6s ease-in-out infinite;
        }

        .animate-float-2 {
          animation: float-2 8s ease-in-out infinite;
        }

        .animate-float-3 {
          animation: float-3 7s ease-in-out infinite;
        }

        .animate-float-4 {
          animation: float-4 9s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
