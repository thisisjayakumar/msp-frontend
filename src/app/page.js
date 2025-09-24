import Link from "next/link";
import Button from "@/components/CommonComponents/ui/Button";
import { APP_CONFIG } from "@/components/config";
import { ROLE_HIERARCHY, getRoleConfig } from "@/components/config/roles";

export default function Home() {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Welcome to{" "}
            <span className="text-blue-600">{APP_CONFIG.name}</span>
          </h1>
          {/* <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            A production-grade Next.js application with modern tooling, 
            beautiful UI components, and best practices built-in.
          </p> */}
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Choose Your Role to Access</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {ROLE_HIERARCHY.map((role) => {
                const config = getRoleConfig(role.key);
                return (
                  <Link key={role.key} href={role.path}>
                    <div className="group bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-blue-300 cursor-pointer">
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 mx-auto transition-colors duration-300"
                        style={{ backgroundColor: `${config.primaryColor}20` }}
                      >
                        <div 
                          className="w-6 h-6"
                          style={{ color: config.primaryColor }}
                        >
                          {/* Role icon placeholder */}
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {config.title}
                      </h4>
                      <p className="text-sm text-gray-600 mb-3">
                        {config.subtitle}
                      </p>
                      <Button 
                        size="sm" 
                        className="w-full text-sm"
                        style={{ 
                          backgroundColor: config.primaryColor,
                          borderColor: config.primaryColor 
                        }}
                      >
                        Access {role.label} Portal
                      </Button>
                    </div>
                  </Link>
                );
              })}
            </div>
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
