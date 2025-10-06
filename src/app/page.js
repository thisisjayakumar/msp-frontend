"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from "next/link";
import Button from "@/components/CommonComponents/ui/Button";
import { APP_CONFIG } from "@/components/config";
import { ROLE_HIERARCHY, getRoleConfig } from "@/components/config/roles";

export default function Home() {
  const router = useRouter();

  // Check if user is already authenticated and redirect to their dashboard
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole');
    
    if (token && userRole) {
      const roleConfig = getRoleConfig(userRole);
      if (roleConfig) {
        const dashboardPath = `${roleConfig.path}/dashboard`;
        router.replace(dashboardPath);
      }
    }
  }, [router]);

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Welcome to{" "}
            <span className="text-blue-600">{APP_CONFIG.name}</span>
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Comprehensive inventory management system for manufacturing operations
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <Link href="/login">
              <Button 
                size="lg" 
                className="px-8 py-4 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Sign In to Your Account
              </Button>
            </Link>
          </div>

          {/* Supported Roles Section */}
          <div className="mt-16">
            <h3 className="text-2xl font-semibold text-gray-800 mb-8 text-center">Supported User Roles</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 max-w-6xl mx-auto">
              {ROLE_HIERARCHY.map((role) => {
                const config = getRoleConfig(role.key);
                return (
                  <div key={role.key} className="group bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 text-center">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center mb-3 mx-auto transition-colors duration-300"
                      style={{ backgroundColor: `${config.primaryColor}20` }}
                    >
                      <div 
                        className="w-6 h-6"
                        style={{ color: config.primaryColor }}
                      >
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    </div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">
                      {role.label}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {config.subtitle}
                    </p>
                  </div>
                );
              })}
            </div>
            <p className="text-center text-gray-600 mt-8 text-sm">
              All roles use the same login portal with automatic routing to role-specific dashboards
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      {/* <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Built for Production
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Everything you need to build modern web applications with confidence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Fast & Modern
            </h3>
            <p className="text-gray-600">
              Built with Next.js 15, React 19, and Tailwind CSS for optimal performance and developer experience.
            </p>
          </div>

          {/* Feature 2 
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Production Ready
            </h3>
            <p className="text-gray-600">
              Includes ESLint, proper folder structure, reusable components, and production optimizations out of the box.
            </p>
          </div>

          {/* Feature 3 
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Responsive Design
            </h3>
            <p className="text-gray-600">
              Mobile-first responsive design with beautiful UI components that work seamlessly across all devices.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section 
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-blue-600 rounded-2xl px-8 py-12 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to get started?
            </h2>
            <p className="text-blue-100 mb-8 text-lg">
              Start building your next project with this production-ready template.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/admin">
                <Button variant="outline" size="lg" className="bg-white text-blue-600 hover:bg-gray-50 border-white">
                  Admin Access
                </Button>
              </Link>
              <Link href="/manager">
                <Button variant="outline" size="lg" className="bg-white text-blue-600 hover:bg-gray-50 border-white">
                  Manager Access
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>*/}
    </div>
  );
}
