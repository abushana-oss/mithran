const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

console.log('🚀 Building production Next.js app with static assets...');

try {
  // Clean and build
  console.log('📦 Building Next.js...');
  execSync('next build', { stdio: 'inherit' });
  
  // Copy static assets to standalone build
  console.log('📁 Copying static assets...');
  const staticSrc = '.next/static';
  const staticDest = '.next/standalone/.next/static';
  
  if (fs.existsSync(staticSrc)) {
    fs.copySync(staticSrc, staticDest);
    console.log('✅ Static assets copied');
  }
  
  // Copy public folder
  const publicSrc = 'public';
  const publicDest = '.next/standalone/public';
  
  if (fs.existsSync(publicSrc)) {
    fs.copySync(publicSrc, publicDest);
    console.log('✅ Public folder copied');
  }
  
  console.log('🎉 Production build complete!');
  console.log('Run: node .next/standalone/server.js');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}