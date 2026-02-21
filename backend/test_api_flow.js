#!/usr/bin/env node

/**
 * API End-to-End Test: Verify Complete Report Submission Flow
 * Tests from ComplaintDemo submission through admin retrieval
 */

const http = require('http');

const BASE_URL = 'http://localhost:5000';

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    try {
      const url = new URL(path, BASE_URL);
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const req = http.request(url, options, (res) => {
        let responseData = '';
        
        res.on('data', chunk => {
          responseData += chunk;
        });

        res.on('end', () => {
          try {
            const parsed = responseData ? JSON.parse(responseData) : null;
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: parsed || responseData,
              raw: responseData
            });
          } catch (e) {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: responseData,
              raw: responseData
            });
          }
        });
      });

      req.on('error', reject);

      if (data) {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

async function testAPI() {
  console.log('🔍 API End-to-End Test: Report Submission Flow\n');

  try {
    // Step 1: Health check
    console.log('📌 Step 1: Health check...');
    const healthRes = await makeRequest('GET', '/health');
    console.log(`   Status: ${healthRes.status} ${healthRes.status === 200 ? '✓' : '✗'}`);
    if (healthRes.status !== 200) {
      console.log('   ✗ Backend not responding!');
      return;
    }
    console.log(`   Response: ${JSON.stringify(healthRes.body)}\n`);

    // Step 2: Get vehicles list
    console.log('📌 Step 2: Fetching vehicles list...');
    const vehiclesRes = await makeRequest('GET', '/api/vehicles?limit=10');
    console.log(`   Status: ${vehiclesRes.status}`);
    
    let testPlateNumber = null;
    if (vehiclesRes.body?.vehicles && vehiclesRes.body.vehicles.length > 0) {
      testPlateNumber = vehiclesRes.body.vehicles[0].registration_number;
      console.log(`   ✓ Found ${vehiclesRes.body.vehicles.length} vehicles`);
      console.log(`   Test plate: ${testPlateNumber}\n`);
    } else {
      console.log('   ✗ No vehicles returned!');
      console.log(`   Response: ${JSON.stringify(vehiclesRes.body)}\n`);
      return;
    }

    // Step 3: Get reports count BEFORE
    console.log('📌 Step 3: Getting reports count before submission...');
    const countBefore = await makeRequest('GET', '/api/admin/reports?limit=1');
    const beforeCount = countBefore.body?.total || 0;
    console.log(`   Status: ${countBefore.status}`);
    console.log(`   Reports count: ${beforeCount}\n`);

    // Step 4: Submit a report via API (simulating ComplaintDemo)
    console.log('📌 Step 4: Submitting report (ComplaintDemo flow)...');
    const reportPayload = {
      plateNumber: testPlateNumber,
      reportType: 'GENERAL',
      rating: 5,
      details: 'Test report from API test - completed successfully via complaint demo'
    };
    
    console.log(`   Payload: ${JSON.stringify(reportPayload, null, 2)}`);
    
    const submitRes = await makeRequest('POST', '/api/reports', reportPayload);
    console.log(`   Status: ${submitRes.status}`);
    console.log(`   Response: ${JSON.stringify(submitRes.body, null, 2)}\n`);

    if (submitRes.status < 200 || submitRes.status >= 300) {
      console.log('   ✗ Report submission failed!');
      return;
    }

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 5: Get reports count AFTER
    console.log('📌 Step 5: Getting reports count after submission...');
    const countAfter = await makeRequest('GET', '/api/admin/reports?limit=1000');
    const afterCount = countAfter.body?.total || 0;
    console.log(`   Status: ${countAfter.status}`);
    console.log(`   Reports count: ${afterCount}`);
    console.log(`   Difference: ${afterCount - beforeCount} (expected: 1)\n`);

    // Step 6: Verify report appears in admin list
    if (afterCount > beforeCount) {
      console.log('📌 Step 6: Report appeared in admin list! ✓');
      
      if (countAfter.body?.reports && countAfter.body.reports.length > 0) {
        const latest = countAfter.body.reports[0];
        console.log(`   Latest report: ${JSON.stringify({
          id: latest.id,
          matatu_id: latest.matatu_id,
          registration_number: latest.registration_number,
          type: latest.type,
          rating: latest.rating,
          created_at: latest.created_at
        }, null, 2)}\n`);
      }
    } else {
      console.log('📌 Step 6: Report NOT in admin list! ✗\n');
      
      console.log('📌 Step 6b: Debugging - checking raw admin response...');
      console.log(`   Full response: ${JSON.stringify(countAfter.body, null, 2)}\n`);
    }

    // Step 7: Test vehicle-specific reports endpoint
    if (vehiclesRes.body?.vehicles && vehiclesRes.body.vehicles.length > 0) {
      const vehicleId = vehiclesRes.body.vehicles[0].id;
      console.log(`📌 Step 7: Testing vehicle-specific endpoint (vehicle ID: ${vehicleId})...`);
      
      const matatuRes = await makeRequest('GET', `/api/reports/matatu/${vehicleId}?limit=100`);
      console.log(`   Status: ${matatuRes.status}`);
      const matatuCount = matatuRes.body?.total || 0;
      console.log(`   Reports for this vehicle: ${matatuCount}`);
      
      if (matatuCount > 0) {
        console.log(`   ✓ Vehicle reports endpoint works\n`);
      } else {
        console.log(`   ✗ No reports found for vehicle\n`);
      }
    }

    console.log('✅ API test completed\n');
    console.log('📊 Summary:');
    console.log(`   - Backend responding: Yes`);
    console.log(`   - Vehicles available: ${testPlateNumber ? 'Yes' : 'No'}`);
    console.log(`   - Report submission: ${submitRes.status < 300 ? 'Success' : 'Failed'}`);
    console.log(`   - Report persisted in admin: ${afterCount > beforeCount ? 'Yes' : 'No'}`);

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testAPI().catch(console.error);
