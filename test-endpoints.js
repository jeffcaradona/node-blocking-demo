#!/usr/bin/env node

/**
 * Simple test script to verify endpoints work
 */

const BASE_URL = 'http://localhost:3000';

async function testEndpoint(endpoint) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`);
    const data = await response.json();
    console.log(`✓ ${endpoint}`);
    console.log(`  Status: ${response.status}`);
    console.log(`  Response: ${JSON.stringify(data).substring(0, 100)}...`);
    return true;
  } catch (error) {
    console.log(`✗ ${endpoint}: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('Testing Blocking App Endpoints...\n');
  
  const endpoints = [
    '/',
    '/slow-sync?iterations=1',
    '/compute?limit=100000',
    '/crypto?iterations=1000',
    '/busy-loop?duration=10',
    '/json-parse?size=100',
    '/multiple'
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const endpoint of endpoints) {
    if (await testEndpoint(endpoint)) {
      passed++;
    } else {
      failed++;
    }
    console.log('');
  }
  
  console.log(`\n✓ Passed: ${passed}/${endpoints.length}`);
  if (failed > 0) {
    console.log(`✗ Failed: ${failed}/${endpoints.length}`);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Test suite error:', error);
  process.exit(1);
});
