const pool = require('../config/database');

class VehicleModel {
  // Create vehicles table
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS vehicles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        registration_number VARCHAR(50) UNIQUE NOT NULL,
        vehicle_type VARCHAR(50),
        color VARCHAR(50),
        make VARCHAR(100),
        model VARCHAR(100),
        year INTEGER,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `;
    try {
      await pool.query(query);
      console.log('Vehicles table created successfully');
    } catch (error) {
      console.error('Error creating vehicles table:', error);
    }
  }

  // Add new vehicle
  static async addVehicle(userId, registrationNumber, vehicleType, color, make, model, year) {
    const query = `
      INSERT INTO vehicles (user_id, registration_number, vehicle_type, color, make, model, year)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    try {
      const result = await pool.query(query, [userId, registrationNumber, vehicleType, color, make, model, year]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Get user vehicles
  static async getUserVehicles(userId) {
    const query = 'SELECT * FROM vehicles WHERE user_id = $1 AND status = $2 ORDER BY created_at DESC;';
    try {
      const result = await pool.query(query, [userId, 'active']);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Get vehicle by ID
  static async getVehicleById(id) {
    const query = 'SELECT * FROM vehicles WHERE id = $1;';
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Get vehicle by registration
  static async getVehicleByRegistration(registrationNumber) {
    const query = 'SELECT * FROM vehicles WHERE registration_number = $1;';
    try {
      const result = await pool.query(query, [registrationNumber]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Update vehicle
  static async updateVehicle(id, vehicleType, color, make, model, year) {
    const query = `
      UPDATE vehicles
      SET vehicle_type = $1, color = $2, make = $3, model = $4, year = $5, updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *;
    `;
    try {
      const result = await pool.query(query, [vehicleType, color, make, model, year, id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Delete vehicle
  static async deleteVehicle(id) {
    const query = 'UPDATE vehicles SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id;';
    try {
      const result = await pool.query(query, ['inactive', id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Get all vehicles
  static async getAllVehicles() {
    const query = 'SELECT v.*, u.name, u.email FROM vehicles v JOIN users u ON v.user_id = u.id WHERE v.status = $1;';
    try {
      const result = await pool.query(query, ['active']);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = VehicleModel;
