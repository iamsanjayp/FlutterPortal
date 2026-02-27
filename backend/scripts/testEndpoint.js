// Quick test to check if session endpoint is accessible
import fetch from 'node-fetch';

async function testEndpoint() {
  try {
    console.log('Testing /api/session/current-problem endpoint...\n');
    
    const response = await fetch('http://localhost:5000/api/session/current-problem?level=3A');
    console.log('Status:', response.status, response.statusText);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('\nResponse body:', text);
    
    if (response.status === 401) {
      console.log('\n⚠️  Expected: Authentication required (401 error is normal without login)');
    } else if (response.status === 404) {
      console.log('\n❌ ERROR: Route not found! Session routes may not be loaded.');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testEndpoint();
