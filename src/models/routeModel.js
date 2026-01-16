const pool = require('../config/database');

class RouteModel {
  // Create routes table
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS routes (
        id SERIAL PRIMARY KEY,
        route_name VARCHAR(100) NOT NULL,
        start_location VARCHAR(100) NOT NULL,
        end_location VARCHAR(100) NOT NULL,
        base_fare DECIMAL(10, 2) NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    try {
      await pool.query(query);
      console.log('Routes table created successfully');
    } catch (error) {
      console.error('Error creating routes table:', error);
    }
  }

  // Get all routes
  static async getAllRoutes() {
    const query = 'SELECT * FROM routes WHERE status = $1 ORDER BY route_name;';
    try {
      const result = await pool.query(query, ['active']);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Get route by ID
  static async getRouteById(id) {
    const query = 'SELECT * FROM routes WHERE id = $1;';
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Create route (admin only)
  static async createRoute(routeName, startLocation, endLocation, baseFare) {
    const query = `
      INSERT INTO routes (route_name, start_location, end_location, base_fare)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    try {
      const result = await pool.query(query, [routeName, startLocation, endLocation, baseFare]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
}

module.exports = RouteModel;
