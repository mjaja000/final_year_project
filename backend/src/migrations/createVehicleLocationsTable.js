const pool = require('../config/database');

async function createVehicleLocationsTable() {
  const client = await pool.connect();
  
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS vehicle_locations (
        id SERIAL PRIMARY KEY,
        vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
        driver_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        accuracy DECIMAL(10, 2),
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(vehicle_id)
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_vehicle_locations_vehicle_id 
      ON vehicle_locations(vehicle_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_vehicle_locations_recorded_at 
      ON vehicle_locations(recorded_at DESC);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_vehicle_locations_coordinates 
      ON vehicle_locations(latitude, longitude);
    `);

    console.log('✓ Vehicle locations table created successfully');
  } catch (error) {
    console.error('Error creating vehicle_locations table:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { createVehicleLocationsTable };
