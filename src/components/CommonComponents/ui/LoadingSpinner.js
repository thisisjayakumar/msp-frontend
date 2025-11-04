"use client";

export function LoadingSpinner({ size = "medium", text = "Loading..." }) {
  const sizeClasses = {
    small: "w-4 h-4",
    medium: "w-8 h-8",
    large: "w-12 h-12"
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="flex flex-col items-center space-y-4">
        <div className={`${sizeClasses[size]} animate-spin`}>
          <div className="w-full h-full border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
        </div>
        <p className="text-slate-600 font-medium">{text}</p>
      </div>
    </div>
  );
}

export default LoadingSpinner;
