const pool = require('../config/database');

class OccupancyModel {
  // Create vehicle occupancy status table
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS vehicle_occupancy (
        id SERIAL PRIMARY KEY,
        vehicle_id INTEGER NOT NULL,
        driver_id INTEGER,
        occupancy_status VARCHAR(20) DEFAULT 'available',
        current_occupancy INTEGER DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
        FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE SET NULL,
        UNIQUE(vehicle_id)
      );
      -- Ensure newer columns/constraints for existing tables
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehicle_occupancy' AND column_name='current_occupancy') THEN
          ALTER TABLE vehicle_occupancy ADD COLUMN current_occupancy INTEGER DEFAULT 0;
        END IF;
        -- Allow driver_id to be nullable
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehicle_occupancy' AND column_name='driver_id' AND is_nullable='NO') THEN
          ALTER TABLE vehicle_occupancy ALTER COLUMN driver_id DROP NOT NULL;
          ALTER TABLE vehicle_occupancy DROP CONSTRAINT IF EXISTS vehicle_occupancy_driver_id_fkey;
          ALTER TABLE vehicle_occupancy ADD CONSTRAINT vehicle_occupancy_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE SET NULL;
        END IF;
      END
      $$;
    `;
    try {
      await pool.query(query);
      console.log('Vehicle occupancy status table created successfully');
    } catch (error) {
      console.error('Error creating vehicle occupancy table:', error);
    }
  }

  // Update occupancy status (Available/Full)
  static async updateOccupancyStatus(vehicleId, driverId, status) {
    const query = `
      INSERT INTO vehicle_occupancy (vehicle_id, driver_id, occupancy_status)
      VALUES ($1, $2, $3)
      ON CONFLICT (vehicle_id) 
      DO UPDATE SET occupancy_status = $3, updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;
    try {
      const result = await pool.query(query, [vehicleId, driverId, status]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Update numeric occupancy (maps to available/full based on capacity)
  static async updateOccupancyCount(vehicleId, driverId, currentOccupancy, capacity) {
    const status = currentOccupancy >= capacity ? 'full' : 'available';
    const query = `
      INSERT INTO vehicle_occupancy (vehicle_id, driver_id, occupancy_status, current_occupancy)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (vehicle_id)
      DO UPDATE SET occupancy_status = $3, current_occupancy = $4, updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;
    try {
      const result = await pool.query(query, [vehicleId, driverId, status, currentOccupancy]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Get vehicle occupancy status
  static async getOccupancyStatus(vehicleId) {
    const query = 'SELECT * FROM vehicle_occupancy WHERE vehicle_id = $1;';
    try {
      const result = await pool.query(query, [vehicleId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Get all occupancy statuses
  static async getAllOccupancyStatuses() {
    const query = `
      SELECT vo.*, v.registration_number, v.vehicle_type, v.capacity, v.route_id,
        u.name as driver_name,
        r.route_name, r.start_location, r.end_location, r.base_fare
      FROM vehicle_occupancy vo
      JOIN vehicles v ON vo.vehicle_id = v.id
      LEFT JOIN users u ON vo.driver_id = u.id
      LEFT JOIN routes r ON v.route_id = r.id
      ORDER BY vo.updated_at DESC;
    `;
    try {
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = OccupancyModel;
