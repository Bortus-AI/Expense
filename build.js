const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Starting build process for bunny.net deployment...');

try {
  // Install dependencies
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  // Install backend dependencies
  console.log('📦 Installing backend dependencies...');
  execSync('cd backend && npm install', { stdio: 'inherit' });
  
  // Install frontend dependencies
  console.log('📦 Installing frontend dependencies...');
  execSync('cd frontend && npm install', { stdio: 'inherit' });
  
  // Build frontend
  console.log('🔨 Building frontend...');
  execSync('cd frontend && node ./node_modules/.bin/react-scripts build', { stdio: 'inherit' });
  
  console.log('✅ Build completed successfully!');
  console.log('📁 Frontend build is ready in: frontend/build/');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
} 