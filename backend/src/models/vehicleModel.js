const pool = require('../config/database');

class VehicleModel {
  // Create vehicles table
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS vehicles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        registration_number VARCHAR(50) UNIQUE NOT NULL,
        vehicle_type VARCHAR(50),
        color VARCHAR(50),
        make VARCHAR(100),
        model VARCHAR(100),
        year INTEGER,
        route_id INTEGER,
        capacity INTEGER DEFAULT 14,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE SET NULL
      );
      -- Ensure newer columns exist if table was created previously
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehicles' AND column_name='route_id') THEN
          ALTER TABLE vehicles ADD COLUMN route_id INTEGER;
          ALTER TABLE vehicles ADD CONSTRAINT vehicles_route_id_fkey FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE SET NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehicles' AND column_name='capacity') THEN
          ALTER TABLE vehicles ADD COLUMN capacity INTEGER DEFAULT 14;
        END IF;
        -- Allow user_id to be nullable for public vehicle creation
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehicles' AND column_name='user_id' AND is_nullable='NO') THEN
          ALTER TABLE vehicles ALTER COLUMN user_id DROP NOT NULL;
          ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS vehicles_user_id_fkey;
          ALTER TABLE vehicles ADD CONSTRAINT vehicles_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
        END IF;
      END
      $$;
    `;
    try {
      await pool.query(query);
      console.log('Vehicles table created successfully');
    } catch (error) {
      console.error('Error creating vehicles table:', error);
    }
  }

  // Add new vehicle
  static async addVehicle({ userId = null, registrationNumber, vehicleType, color, make, model, year, routeId = null, capacity = 14 }) {
    const query = `
      INSERT INTO vehicles (user_id, registration_number, vehicle_type, color, make, model, year, route_id, capacity)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;
    try {
      const result = await pool.query(query, [userId, registrationNumber, vehicleType, color, make, model, year, routeId, capacity]);
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
    const query = `
      SELECT *
      FROM vehicles
      WHERE
        UPPER(registration_number) = UPPER($1)
        OR UPPER(REPLACE(REPLACE(registration_number, '-', ''), ' ', '')) = UPPER(REPLACE(REPLACE($1, '-', ''), ' ', ''))
      LIMIT 1;
    `;
    try {
      const result = await pool.query(query, [registrationNumber]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Update vehicle
  static async updateVehicle(id, { vehicleType, color, make, model, year, routeId, capacity }) {
    const query = `
      UPDATE vehicles
      SET
        vehicle_type = COALESCE($1, vehicle_type),
        color = COALESCE($2, color),
        make = COALESCE($3, make),
        model = COALESCE($4, model),
        year = COALESCE($5, year),
        route_id = COALESCE($6, route_id),
        capacity = COALESCE($7, capacity),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *;
    `;
    try {
      const result = await pool.query(query, [vehicleType, color, make, model, year, routeId, capacity, id]);
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
    const query = `
      SELECT v.*, u.name, u.email, r.route_name
      FROM vehicles v
      LEFT JOIN users u ON v.user_id = u.id
      LEFT JOIN routes r ON v.route_id = r.id
      WHERE v.status = $1
      ORDER BY v.created_at DESC;
    `;
    try {
      const result = await pool.query(query, ['active']);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Get vehicles by route
  static async getVehiclesByRoute(routeId) {
    const query = `
      SELECT v.*, u.name, u.email, r.route_name
      FROM vehicles v
      LEFT JOIN users u ON v.user_id = u.id
      LEFT JOIN routes r ON v.route_id = r.id
      WHERE v.status = $1 AND v.route_id = $2
      ORDER BY v.created_at DESC;
    `;
    try {
      const result = await pool.query(query, ['active', routeId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Get total count of vehicles
  static async getTotalCount() {
    const query = 'SELECT COUNT(*) as count FROM vehicles;';
    try {
      const result = await pool.query(query);
      return result.rows[0].count || 0;
    } catch (error) {
      console.error('Error getting vehicle count:', error);
      return 0;
    }
  }

  // Get vehicle status summary
  static async getVehicleStatusSummary() {
    const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive
      FROM vehicles;
    `;
    try {
      const result = await pool.query(query);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Get vehicles with occupancy info
  static async getVehiclesWithOccupancy() {
    const query = `
      SELECT 
        v.id,
        v.registration_number,
        v.vehicle_type,
        v.capacity,
        v.status,
        v.route_id,
        r.route_name,
        u.name as driver_name,
        vo.occupancy_status,
        vo.current_occupancy,
        vo.updated_at as occupancy_updated_at
      FROM vehicles v
      LEFT JOIN routes r ON v.route_id = r.id
      LEFT JOIN users u ON v.user_id = u.id
      LEFT JOIN vehicle_occupancy vo ON v.id = vo.vehicle_id
      WHERE v.status = 'active'
      ORDER BY v.created_at DESC;
    `;
    try {
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = VehicleModel;
