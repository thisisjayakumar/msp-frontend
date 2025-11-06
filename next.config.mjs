/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable output file tracing for Docker
  output: 'standalone',

  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['@/components', '@/lib', '@/utils'],
  },

  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Configure for production deployment
    unoptimized: true,
  },

  // Compression
  compress: true,

  // Production optimizations
  poweredByHeader: false,

  // Security headers
  async headers() {
    const securityHeaders = [
      {
        key: 'X-Frame-Options',
        value: 'DENY',
      },
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },
      {
        key: 'Referrer-Policy',
        value: 'origin-when-cross-origin',
      },
      {
        key: 'X-XSS-Protection',
        value: '1; mode=block',
      },
    ];

    // Add HTTPS headers in production
    if (process.env.NODE_ENV === 'production') {
      securityHeaders.push(
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains; preload',
        },
        {
          key: 'Content-Security-Policy',
          value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;",
        }
      );
    }

    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },

  // Environment variables validation
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },

  // Webpack configuration for production
  webpack: (config, { isServer, dev }) => {
    // Production optimizations
    if (!dev) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      };
    }

    return config;
  },
};

export default nextConfig;
