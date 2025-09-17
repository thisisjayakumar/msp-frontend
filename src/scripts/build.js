#!/usr/bin/env node

/**
 * Build script for the Microspring frontend application
 * This script can be used for custom build processes, pre-build checks, etc.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Microspring Frontend Build Process...\n');

// Check if required files exist
const requiredFiles = [
  'package.json',
  'next.config.mjs',
  'src/app/layout.js',
  'src/app/page.js'
];

console.log('📋 Checking required files...');
for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(process.cwd(), file))) {
    console.error(`❌ Required file missing: ${file}`);
    process.exit(1);
  }
}
console.log('✅ All required files present\n');

// Check for environment variables
console.log('🔧 Checking environment configuration...');
const requiredEnvVars = [
  // Add required environment variables here
  // 'NEXT_PUBLIC_API_BASE_URL'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.warn(`⚠️  Environment variable ${envVar} is not set`);
  }
}

try {
  console.log('🏗️  Running Next.js build...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('\n✅ Build completed successfully!');
  
  // Additional post-build tasks can be added here
  console.log('📦 Build artifacts ready for deployment');
  
} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
}

console.log('\n🎉 Microspring Frontend build process completed!');
