#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Backend Setup...\n');

const checks = [
  {
    name: 'package.json exists',
    check: () => fs.existsSync(path.join(__dirname, '../package.json')),
  },
  {
    name: 'node_modules installed',
    check: () => fs.existsSync(path.join(__dirname, '../node_modules')),
  },
  {
    name: '.env file exists',
    check: () => fs.existsSync(path.join(__dirname, '../.env')),
  },
  {
    name: 'tsconfig.json exists',
    check: () => fs.existsSync(path.join(__dirname, '../tsconfig.json')),
  },
  {
    name: '.eslintrc.json exists',
    check: () => fs.existsSync(path.join(__dirname, '../.eslintrc.json')),
  },
  {
    name: '.prettierrc.json exists',
    check: () => fs.existsSync(path.join(__dirname, '../.prettierrc.json')),
  },
  {
    name: 'Husky hooks installed',
    check: () => fs.existsSync(path.join(__dirname, '../.husky/pre-commit')),
  },
  {
    name: 'src directory exists',
    check: () => fs.existsSync(path.join(__dirname, '../src')),
  },
];

let allPassed = true;

checks.forEach((check) => {
  const passed = check.check();
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${check.name}`);
  if (!passed) {
    allPassed = false;
  }
});

console.log('\n' + '='.repeat(50));

if (allPassed) {
  console.log('✅ All checks passed! Backend setup is complete.\n');
  console.log('Next steps:');
  console.log('1. Edit .env file with your configuration');
  console.log('2. Start MongoDB: brew services start mongodb-community');
  console.log('3. Run: npm run dev\n');
  process.exit(0);
} else {
  console.log('❌ Some checks failed. Please review the setup.\n');
  console.log('Run: npm install');
  console.log('Or check SETUP.md for detailed instructions.\n');
  process.exit(1);
}
