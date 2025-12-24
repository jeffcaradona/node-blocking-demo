/**
 * Quick smoke test to verify both servers are responding
 */

async function testServer(name, port) {
  try {
    const response = await fetch(`http://localhost:${port}/`);
    const data = await response.json();
    console.log(`✅ ${name} (port ${port}): ${data.service}`);
    return true;
  } catch (error) {
    console.log(`❌ ${name} (port ${port}): ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('Testing server connectivity...\n');
  
  const blocking = await testServer('Blocking App', 3000);
  const nonBlocking = await testServer('Non-Blocking App', 3001);
  
  if (blocking && nonBlocking) {
    console.log('\n✓ Both servers responding correctly');
    process.exit(0);
  } else {
    console.log('\n✗ One or more servers not responding');
    process.exit(1);
  }
}

main();
