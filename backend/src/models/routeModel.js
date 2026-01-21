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
    const query = 'SELECT * FROM routes ORDER BY route_name;';
    try {
      const result = await pool.query(query);
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
  static async createRoute(routeName, startLocation, endLocation, baseFare, description = null) {
    const query = `
      INSERT INTO routes (route_name, start_location, end_location, base_fare, description)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    try {
      const result = await pool.query(query, [routeName, startLocation, endLocation, baseFare, description]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Update route
  static async updateRoute(id, { routeName, startLocation, endLocation, baseFare, description, status }) {
    const query = `
      UPDATE routes
      SET
        route_name = COALESCE($1, route_name),
        start_location = COALESCE($2, start_location),
        end_location = COALESCE($3, end_location),
        base_fare = COALESCE($4, base_fare),
        description = COALESCE($5, description),
        status = COALESCE($6, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *;
    `;

    try {
      const result = await pool.query(query, [routeName, startLocation, endLocation, baseFare, description, status, id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Delete (soft-delete) route
  static async deleteRoute(id) {
    const query = `
      UPDATE routes
      SET status = 'inactive', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *;
    `;

    try {
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
}

module.exports = RouteModel;
