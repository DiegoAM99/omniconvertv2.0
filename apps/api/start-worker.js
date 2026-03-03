// Simple worker starter with better logging
const { spawn } = require('child_process');
const path = require('path');

console.log('🔄 Starting Conversion Worker...');
console.log('📁 Working directory:', __dirname);

const tsxPath = path.join(__dirname, '..', '..', 'node_modules', 'tsx', 'dist', 'loader.mjs');

const worker = spawn('node', [
  '--import',
  `file:///${tsxPath.replace(/\\/g, '/')}`,
  path.join(__dirname, 'src', 'worker.ts')
], {
  cwd: __dirname,
  stdio: 'inherit',
  env: { ...process.env, FORCE_COLOR: '1' }
});

worker.on('error', (error) => {
  console.error('❌ Worker failed to start:', error);
  process.exit(1);
});

worker.on('exit', (code) => {
  console.log(`⚠️  Worker exited with code ${code}`);
  process.exit(code || 0);
});

console.log('✅ Worker process spawned with PID:', worker.pid);
