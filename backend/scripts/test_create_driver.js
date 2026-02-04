// Simple test script to create a driver twice and show responses
// Usage: node scripts/test_create_driver.js

const API_BASE = process.env.API_URL || 'http://127.0.0.1:5000';

async function createDriver(payload) {
  try {
    const res = await fetch(`${API_BASE}/api/drivers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const body = await res.text();
    let parsed;
    try { parsed = JSON.parse(body); } catch (e) { parsed = body; }
    console.log(`STATUS: ${res.status}`);
    console.log('BODY:', parsed);
    return { status: res.status, body: parsed };
  } catch (err) {
    console.error('Request failed:', err.message || err);
    throw err;
  }
}

(async () => {
  // deterministic test payload
  const payload = {
    name: 'Test Driver',
    email: 'test.driver@example.com',
    phone: '07123456789',
    password: 'Driver@1234',
    driving_license: 'DL123456'
  };

  console.log('Attempt 1: Creating driver');
  await createDriver(payload);

  console.log('\nAttempt 2: Creating driver with same email/phone to reproduce duplicate');
  await createDriver(payload);

  console.log('\nTest completed');
})();
