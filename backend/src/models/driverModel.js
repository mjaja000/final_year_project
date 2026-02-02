const pool = require('../config/database');

class DriverModel {
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS drivers (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE NOT NULL,
        driving_license VARCHAR(100),
        assigned_vehicle_id INTEGER,
        documents JSONB,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (assigned_vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL
      );

      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='drivers' AND column_name='driving_license') THEN
          ALTER TABLE drivers ADD COLUMN driving_license VARCHAR(100);
        END IF;
      END
      $$;
    `;
    try {
      await pool.query(query);
      console.log('Drivers table created successfully');
    } catch (error) {
      console.error('Error creating drivers table:', error);
    }
  }

  static async createDriver({ userId, drivingLicense = null, assignedVehicleId = null, documents = null }) {
    const query = `
      INSERT INTO drivers (user_id, driving_license, assigned_vehicle_id, documents)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    try {
      const result = await pool.query(query, [userId, drivingLicense, assignedVehicleId, documents]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async getDriverByUserId(userId) {
    const query = 'SELECT d.*, u.username, u.name, u.phone, u.email, v.registration_number as vehicle_reg FROM drivers d LEFT JOIN users u on d.user_id = u.id LEFT JOIN vehicles v ON d.assigned_vehicle_id = v.id WHERE d.user_id = $1';
    try {
      const result = await pool.query(query, [userId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async getAllDrivers() {
    const query = 'SELECT d.*, u.username, u.name, u.phone, u.email, v.registration_number as vehicle_reg FROM drivers d LEFT JOIN users u on d.user_id = u.id LEFT JOIN vehicles v ON d.assigned_vehicle_id = v.id ORDER BY d.created_at DESC';
    try {
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  static async assignVehicle(userId, vehicleId) {
    const query = `
      UPDATE drivers SET assigned_vehicle_id = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 RETURNING *;
    `;
    try {
      const result = await pool.query(query, [vehicleId, userId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
}

module.exports = DriverModel;
