#!/usr/bin/env node
/**
 * Wrapper que carrega .env e executa scripts
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Carregar .env manualmente
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
}

// Executar o script passado como argumento
const scriptPath = process.argv[2];
if (!scriptPath) {
  console.error('Uso: node run-with-env.js <script-path> [args...]');
  process.exit(1);
}

const args = process.argv.slice(3);
const result = spawn('npx', ['tsx', scriptPath, ...args], {
  cwd: __dirname,
  stdio: 'inherit',
  env: process.env,
});

result.on('exit', code => {
  process.exit(code || 0);
});
