// Common configuration file for future use
// This file can be used to store application-wide configuration settings

export const APP_CONFIG = {
  name: 'Microspring',
  version: '1.0.0',
  description: 'Precision, Performance, Perfection',
  
  // API Configuration
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api',
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
  },
  
  // Authentication Configuration
  auth: {
    tokenKey: 'authToken',
    refreshTokenKey: 'refreshToken',
    tokenExpiry: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  },
  
  // UI Configuration
  ui: {
    theme: {
      primary: '#2563eb', // blue-600
      secondary: '#64748b', // slate-500
      success: '#059669', // emerald-600
      warning: '#d97706', // amber-600
      error: '#dc2626', // red-600
    },
    breakpoints: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
  },
  
  // Feature Flags
  features: {
    enableSocialLogin: true,
    enableEmailVerification: true,
    enableTwoFactorAuth: false,
    enableDarkMode: true,
  },
  
  // External Services
  services: {
    analytics: {
      googleAnalyticsId: process.env.NEXT_PUBLIC_GA_ID,
    },
    monitoring: {
      sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    },
  },
  
  // Validation Rules
  validation: {
    password: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: false,
    },
    email: {
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
  },
};

// Environment-specific configurations
export const ENV_CONFIG = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
};

// Routes configuration
export const ROUTES = {
  HOME: '/',
  LOGIN: '/operator', // Default to operator login
  DASHBOARD: '/pages/dashboard',
  PROFILE: '/pages/profile',
  SETTINGS: '/pages/settings',
  // Add more routes as needed
};

export default APP_CONFIG;
