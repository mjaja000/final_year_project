const pool = require('../config/database');

class OccupancyModel {
  // Create vehicle occupancy status table
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS vehicle_occupancy (
        id SERIAL PRIMARY KEY,
        vehicle_id INTEGER NOT NULL,
        driver_id INTEGER NOT NULL,
        occupancy_status VARCHAR(20) DEFAULT 'available',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
        FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(vehicle_id)
      );
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
      SELECT vo.*, v.registration_number, v.vehicle_type, u.name as driver_name
      FROM vehicle_occupancy vo
      JOIN vehicles v ON vo.vehicle_id = v.id
      JOIN users u ON vo.driver_id = u.id
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
