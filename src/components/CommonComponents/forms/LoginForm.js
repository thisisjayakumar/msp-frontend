"use client";

import { useState } from "react";
import Link from "next/link";
import Button from "@/components/CommonComponents/ui/Button";
import Input from "@/components/CommonComponents/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/CommonComponents/ui/Card";
import { getRoleConfig } from "@/components/config/roles";

export default function LoginForm({ 
  role = 'operator',
  onSubmit,
  showForgotPassword = true,
  className = ""
}) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const roleConfig = getRoleConfig(role);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    if (!formData.password) {
      newErrors.password = "Password is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      // Call the onSubmit prop if provided, otherwise use default behavior
      if (onSubmit) {
        await onSubmit({ ...formData, role });
      } else {
        // Default behavior - simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        console.log("Login attempt:", { ...formData, role });
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrors({ general: error.message || "Login failed. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleIcon = () => {
    const iconMap = {
      'shield-check': (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      ),
      'briefcase': (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h8z" />
      ),
      'users': (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a4 4 0 11-8 0 4 4 0 018 0z" />
      ),
      'building-storefront': (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2h8m8 0V7a2 2 0 00-2-2H5a2 2 0 00-2 2v2m16 0L3 9" />
      ),
      'cog': (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      )
    };
    
    return iconMap[roleConfig.icon] || iconMap['cog'];
  };

  return (
    <div className={`w-full max-w-md ${className}`}>
      {/* Logo/Brand Section */}
      <div className="text-center mb-8">
        <div 
          className="inline-flex items-center justify-center w-20 h-20 backdrop-blur-sm rounded-2xl mb-6 shadow-2xl border border-white/20"
          style={{ 
            backgroundColor: `${roleConfig.primaryColor}20` // 20% opacity
          }}
        >
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {getRoleIcon()}
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">{roleConfig.title}</h1>
        <p className="text-blue-200/80 text-lg">{roleConfig.subtitle}</p>
        <p className="text-blue-200/60 text-sm mt-2">{roleConfig.description}</p>
      </div>

      {/* Glassmorphism Login Card */}
      <Card className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-white text-2xl font-semibold">Welcome Back</CardTitle>
          <CardDescription className="text-blue-200/80 text-base">
            Sign in to access your {roleConfig.label?.toLowerCase() || 'user'} dashboard
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.general && (
              <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-200 text-sm">
                {errors.general}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-2">
                  Email Address
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={handleInputChange}
                  error={errors.email}
                  disabled={isLoading}
                  className="backdrop-blur-sm bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-blue-400 focus:ring-blue-400/20"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white/90 mb-2">
                  Password
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                  error={errors.password}
                  disabled={isLoading}
                  className="backdrop-blur-sm bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-blue-400 focus:ring-blue-400/20"
                />
              </div>
            </div>

            {showForgotPassword && (
              <div className="flex items-center justify-center">
                <Link 
                  href={`/${role}/forgot-password`}
                  className="text-sm text-blue-300 hover:text-blue-200 transition-colors duration-200 underline underline-offset-4"
                >
                  Forgot password?
                </Link>
              </div>
            )}

            <Button
              type="submit"
              className="w-full backdrop-blur-sm text-white font-medium py-3 px-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl border border-white/10"
              style={{
                background: `linear-gradient(to right, ${roleConfig.primaryColor}CC, ${roleConfig.secondaryColor}CC)`,
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </div>
              ) : (
                `Sign In as ${roleConfig.label || 'User'}`
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
