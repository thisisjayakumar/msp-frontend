"use client";

import LoginForm from "@/components/CommonComponents/forms/LoginForm";
import { getRoleConfig } from "@/components/config/roles";

export default function RoleLoginLayout({ 
  role, 
  onLogin,
  showForgotPassword = true 
}) {
  const roleConfig = getRoleConfig(role);

  const handleLogin = async (loginData) => {
    if (onLogin) {
      return await onLogin(loginData);
    }
    
    // Default login behavior
    console.log(`${roleConfig.label || 'User'} login attempt:`, loginData);
    
    // Here you would typically make an API call to authenticate
    // For now, we'll simulate a successful login
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Redirect to role-specific dashboard or handle success
    // Use router for client-side navigation instead of window.location
    window?.location?.replace(`/${role}/dashboard`);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Dynamic Glassmorphism Background based on role */}
      <div 
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${roleConfig.primaryColor}40, ${roleConfig.secondaryColor}20, #1e293b)`
        }}
      >
        {/* Animated background elements */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div 
            className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"
            style={{ backgroundColor: roleConfig.primaryColor }}
          ></div>
          <div 
            className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"
            style={{ backgroundColor: roleConfig.secondaryColor }}
          ></div>
          <div 
            className="absolute bottom-1/4 left-1/3 w-96 h-96 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"
            style={{ backgroundColor: roleConfig.primaryColor }}
          ></div>
        </div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
      </div>
      
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <LoginForm 
          role={role}
          onSubmit={handleLogin}
          showForgotPassword={showForgotPassword}
        />
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
