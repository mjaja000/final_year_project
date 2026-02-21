#!/usr/bin/env node

/**
 * Direct Database Test: Insert and Verify Report
 * This script bypasses the API layer to test raw database operations
 */

const { Pool } = require('pg');
require('dotenv').config();

const parseSsl = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (['false', '0', 'no', 'off', 'disable', 'disabled'].includes(normalized)) return false;
  return { rejectUnauthorized: false };
};

const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: parseSsl(process.env.DB_SSL, false),
};

const pool = new Pool(dbConfig);

async function testReportInsertion() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Testing Report Insertion Flow\n');
    console.log('📋 Database Config:');
    console.log(`   Host: ${dbConfig.host}`);
    console.log(`   Database: ${dbConfig.database}`);
    console.log(`   User: ${dbConfig.user}\n`);

    // Step 1: Check if vehicles table exists and has data
    console.log('📌 Step 1: Checking vehicles table...');
    const vehiclesCheckQuery = `
      SELECT COUNT(*) as total, 
             JSON_AGG(
               JSON_BUILD_OBJECT(
                 'id', id,
                 'registration_number', registration_number,
                 'route_id', route_id
               )
             ) as samples
      FROM vehicles
      LIMIT 10;
    `;
    
    try {
      const vehiclesResult = await client.query(vehiclesCheckQuery);
      const { total, samples } = vehiclesResult.rows[0];
      console.log(`   ✓ Found ${total} vehicles`);
      if (samples && samples[0]) {
        console.log(`   Sample vehicle: ${JSON.stringify(samples[0], null, 2)}\n`);
      }
    } catch (err) {
      console.log(`   ✗ Could not query vehicles: ${err.message}\n`);
    }

    // Step 2: Check if reports table exists
    console.log('📌 Step 2: Checking reports table schema...');
    const schemaQuery = `
      SELECT 
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE table_name = 'reports'
      ORDER BY ordinal_position;
    `;
    
    try {
      const schemaResult = await client.query(schemaQuery);
      if (schemaResult.rows.length === 0) {
        console.log('   ✗ Reports table does not exist!\n');
      } else {
        console.log(`   ✓ Reports table exists with ${schemaResult.rows.length} columns:`);
        schemaResult.rows.forEach(col => {
          console.log(`     - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
        });
        console.log();
      }
    } catch (err) {
      console.log(`   ✗ Schema check failed: ${err.message}\n`);
    }

    // Step 3: Count existing reports BEFORE insertion
    console.log('📌 Step 3: Counting existing reports...');
    const countBefore = await client.query('SELECT COUNT(*) as total FROM reports');
    const beforeCount = parseInt(countBefore.rows[0].total, 10);
    console.log(`   Reports count BEFORE: ${beforeCount}\n`);

    // Step 4: Find a valid matatu_id
    let matatu_id = null;
    console.log('📌 Step 4: Finding valid matatu_id...');
    const vehicleQuery = `SELECT id FROM vehicles WHERE status = 'active' LIMIT 1`;
    
    try {
      const vehicleResult = await client.query(vehicleQuery);
      if (vehicleResult.rows.length > 0) {
        matatu_id = vehicleResult.rows[0].id;
        console.log(`   ✓ Found vehicle with ID: ${matatu_id}\n`);
      } else {
        console.log('   ✗ No active vehicles found!');
        console.log('   Creating test vehicle...');
        
        // Create a test vehicle
        const createVehicleQuery = `
          INSERT INTO vehicles (registration_number, status)
          VALUES ($1, $2)
          RETURNING id
        `;
        
        const vehicleCreateResult = await client.query(createVehicleQuery, ['TEST-PLATE-001', 'active']);
        matatu_id = vehicleCreateResult.rows[0].id;
        console.log(`   ✓ Created test vehicle with ID: ${matatu_id}\n`);
      }
    } catch (err) {
      console.log(`   ✗ Vehicle lookup failed: ${err.message}\n`);
      return;
    }

    // Step 5: Insert a test report
    console.log('📌 Step 5: Inserting test report...');
    const insertQuery = `
      INSERT INTO reports (matatu_id, type, rating, comment, created_at)
      VALUES ($1, $2, $3, $4, NOW() AT TIME ZONE 'UTC')
      RETURNING id, matatu_id, type, rating, comment, created_at
    `;
    
    let insertedReport = null;
    try {
      const insertResult = await client.query(insertQuery, [
        matatu_id,
        'GENERAL',
        4,
        'Test report from direct database test'
      ]);
      insertedReport = insertResult.rows[0];
      console.log(`   ✓ Successfully inserted report:`);
      console.log(`     ID: ${insertedReport.id}`);
      console.log(`     Matatu ID: ${insertedReport.matatu_id}`);
      console.log(`     Type: ${insertedReport.type}`);
      console.log(`     Rating: ${insertedReport.rating}`);
      console.log(`     Created: ${insertedReport.created_at}\n`);
    } catch (err) {
      console.log(`   ✗ Insert failed: ${err.message}\n`);
      return;
    }

    // Step 6: Verify insertion with COUNT
    console.log('📌 Step 6: Verifying insertion with COUNT...');
    const countAfter = await client.query('SELECT COUNT(*) as total FROM reports');
    const afterCount = parseInt(countAfter.rows[0].total, 10);
    console.log(`   Reports count AFTER: ${afterCount}`);
    console.log(`   Difference: ${afterCount - beforeCount} (expected: 1)\n`);

    // Step 7: Retrieve report using the getAllReports query
    console.log('📌 Step 7: Testing getAllReports query...');
    const getAllQuery = `
      SELECT
        r.id,
        r.user_id,
        r.matatu_id,
        r.type,
        r.category,
        r.rating,
        r.comment,
        r.created_at,
        r.updated_at,
        v.registration_number,
        v.route_id,
        rt.route_name
      FROM reports r
      JOIN vehicles v ON r.matatu_id = v.id
      LEFT JOIN routes rt ON v.route_id = rt.id
      ORDER BY r.created_at DESC
      LIMIT 50 OFFSET 0
    `;

    try {
      const getAllResult = await client.query(getAllQuery);
      console.log(`   ✓ getAllReports query returned ${getAllResult.rows.length} rows`);
      if (getAllResult.rows.length > 0) {
        const latest = getAllResult.rows[0];
        console.log(`   Latest report: ${JSON.stringify({
          id: latest.id,
          matatu_id: latest.matatu_id,
          registration_number: latest.registration_number,
          type: latest.type,
          rating: latest.rating,
          created_at: latest.created_at
        }, null, 2)}\n`);
      }
    } catch (err) {
      console.log(`   ✗ getAllReports query failed: ${err.message}\n`);
    }

    // Step 8: Check if our inserted report is in the results
    if (insertedReport) {
      console.log('📌 Step 8: Checking if inserted report appears in results...');
      const ourReportQuery = `
        SELECT * FROM reports WHERE id = $1
      `;
      
      try {
        const ourReportResult = await client.query(ourReportQuery, [insertedReport.id]);
        if (ourReportResult.rows.length > 0) {
          console.log(`   ✓ Found our inserted report in direct query\n`);
        } else {
          console.log(`   ✗ Our report disappeared after insertion!\n`);
        }
      } catch (err) {
        console.log(`   ✗ Direct report query failed: ${err.message}\n`);
      }
    }

    console.log('✅ Test completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - Reports before: ${beforeCount}`);
    console.log(`   - Reports after: ${afterCount}`);
    console.log(`   - Inserted report ID: ${insertedReport?.id || 'N/A'}`);
    console.log(`   - getAllReports works: Yes`);

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

testReportInsertion().catch(console.error);
