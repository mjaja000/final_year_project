const pool = require('../config/database');

class TripModel {
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS trips (
        id SERIAL PRIMARY KEY,
        vehicle_id INTEGER NOT NULL,
        route_id INTEGER NOT NULL,
        sacco_id INTEGER,
        capacity INTEGER DEFAULT 14,
        current_occupancy INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'scheduled',
        start_time TIMESTAMP,
        end_time TIMESTAMP,
        origin VARCHAR(255),
        destination VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
        FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE
      );

      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trips' AND column_name='current_occupancy') THEN
          ALTER TABLE trips ADD COLUMN current_occupancy INTEGER DEFAULT 0;
        END IF;
      END
      $$;
    `;
    try {
      await pool.query(query);
      console.log('Trips table created successfully');
    } catch (error) {
      console.error('Error creating trips table:', error);
    }
  }

  static async createTrip({ vehicleId, routeId, saccoId = null, capacity = 14, startTime = null, origin = null, destination = null }) {
    const query = `
      INSERT INTO trips (vehicle_id, route_id, sacco_id, capacity, start_time, origin, destination)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;
    `;
    try {
      const result = await pool.query(query, [vehicleId, routeId, saccoId, capacity, startTime, origin, destination]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async getTripById(id) {
    const query = `SELECT t.*, v.registration_number, r.route_name FROM trips t LEFT JOIN vehicles v ON t.vehicle_id = v.id LEFT JOIN routes r ON t.route_id = r.id WHERE t.id = $1`;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async incrementOccupancy(tripId) {
    const query = `
      UPDATE trips
      SET current_occupancy = current_occupancy + 1,
          updated_at = CURRENT_TIMESTAMP,
          status = CASE WHEN current_occupancy + 1 >= capacity THEN 'full' WHEN current_occupancy + 1 > 0 THEN 'boarding' ELSE status END
      WHERE id = $1
      RETURNING *;
    `;
    const result = await pool.query(query, [tripId]);
    return result.rows[0];
  }

  static async decrementOccupancy(tripId) {
    const query = `
      UPDATE trips
      SET current_occupancy = GREATEST(0, current_occupancy - 1),
          updated_at = CURRENT_TIMESTAMP,
          status = CASE WHEN current_occupancy - 1 <= 0 THEN 'scheduled' ELSE status END
      WHERE id = $1
      RETURNING *;
    `;
    const result = await pool.query(query, [tripId]);
    return result.rows[0];
  }

  static async updateStatus(tripId, status) {
    const query = `UPDATE trips SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *;`;
    const result = await pool.query(query, [status, tripId]);
    return result.rows[0];
  }

  static async getTripsByRoute(routeId) {
    const query = `SELECT t.*, v.registration_number, v.capacity FROM trips t LEFT JOIN vehicles v ON t.vehicle_id = v.id WHERE t.route_id = $1 ORDER BY t.start_time ASC`;
    const result = await pool.query(query, [routeId]);
    return result.rows;
  }

  static async getAvailableTrips() {
    const query = `SELECT t.*, v.registration_number, v.capacity FROM trips t LEFT JOIN vehicles v ON t.vehicle_id = v.id WHERE t.status != 'completed' ORDER BY t.start_time ASC`;
    const result = await pool.query(query);
    return result.rows;
  }
}

module.exports = TripModel;
