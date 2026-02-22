const pool = require('../config/database');

class RouteModel {
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS routes (
        id SERIAL PRIMARY KEY,
        route_name VARCHAR(100) NOT NULL,
        start_location VARCHAR(100) NOT NULL,
        end_location VARCHAR(100) NOT NULL,
        start_latitude DECIMAL(10, 8),
        start_longitude DECIMAL(11, 8),
        end_latitude DECIMAL(10, 8),
        end_longitude DECIMAL(11, 8),
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
      
      // Add missing columns if they don't exist (for existing databases)
      const addColumnsQuery = `
        ALTER TABLE routes
        ADD COLUMN IF NOT EXISTS start_latitude DECIMAL(10, 8),
        ADD COLUMN IF NOT EXISTS start_longitude DECIMAL(11, 8),
        ADD COLUMN IF NOT EXISTS end_latitude DECIMAL(10, 8),
        ADD COLUMN IF NOT EXISTS end_longitude DECIMAL(11, 8);
      `;
      try {
        await pool.query(addColumnsQuery);
        console.log('✓ Coordinate columns added to routes table');
      } catch (altErr) {
        if (!altErr.message.includes('already exists')) {
          console.log('Columns may already exist');
        }
      }
    } catch (error) {
      console.error('Error creating routes table:', error);
    }
  }

  static async getAllRoutes() {
    const query = 'SELECT * FROM routes WHERE status != \'inactive\' ORDER BY route_name;';
    try {
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  static async getRouteById(id) {
    const query = 'SELECT * FROM routes WHERE id = $1;';
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async createRoute(routeName, startLocation, endLocation, baseFare, startLat, startLng, endLat, endLng, description = null) {
    const query = `
      INSERT INTO routes (route_name, start_location, end_location, base_fare, start_latitude, start_longitude, end_latitude, end_longitude, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;
    try {
      const params = [
        routeName, 
        startLocation, 
        endLocation, 
        baseFare, 
        startLat,
        startLng,
        endLat,
        endLng,
        description
      ];
      
      const result = await pool.query(query, params);
      return result.rows[0];
    } catch (error) {
      console.error('[RouteModel.createRoute] Error:', error);
      throw error;
    }
  }

  static async updateRoute(id, { routeName, startLocation, endLocation, baseFare, startLatitude, startLongitude, endLatitude, endLongitude, description, status }) {
    const query = `
      UPDATE routes
      SET
        route_name = COALESCE($1, route_name),
        start_location = COALESCE($2, start_location),
        end_location = COALESCE($3, end_location),
        base_fare = COALESCE($4, base_fare),
        start_latitude = COALESCE($5, start_latitude),
        start_longitude = COALESCE($6, start_longitude),
        end_latitude = COALESCE($7, end_latitude),
        end_longitude = COALESCE($8, end_longitude),
        description = COALESCE($9, description),
        status = COALESCE($10, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $11
      RETURNING *;
    `;

    try {
      const result = await pool.query(query, [
        routeName, 
        startLocation, 
        endLocation, 
        baseFare, 
        startLatitude, 
        startLongitude, 
        endLatitude, 
        endLongitude, 
        description, 
        status, 
        id
      ]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

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

  static async getTotalCount() {
    const query = 'SELECT COUNT(*) as count FROM routes WHERE status != \'inactive\';';
    try {
      const result = await pool.query(query);
      return result.rows[0].count || 0;
    } catch (error) {
      console.error('Error getting route count:', error);
      return 0;
    }
  }
}

module.exports = RouteModel;
