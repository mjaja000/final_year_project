const pool = require('../config/database');

class BookingModel {
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        trip_id INTEGER NOT NULL,
        passenger_name VARCHAR(200) NOT NULL,
        phone_number VARCHAR(30) NOT NULL,
        origin_stop VARCHAR(200),
        destination_stop VARCHAR(200),
        status VARCHAR(30) DEFAULT 'booked',
        ticket_code VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
      );
    `;
    try {
      await pool.query(query);
      console.log('Bookings table created successfully');
    } catch (error) {
      console.error('Error creating bookings table:', error);
    }
  }

  static async createBooking({ tripId, passengerName, phoneNumber, originStop = null, destinationStop = null, ticketCode = null }) {
    const query = `
      INSERT INTO bookings (trip_id, passenger_name, phone_number, origin_stop, destination_stop, ticket_code)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;
    `;
    try {
      const result = await pool.query(query, [tripId, passengerName, phoneNumber, originStop, destinationStop, ticketCode]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async getBookingsByTrip(tripId) {
    const query = 'SELECT * FROM bookings WHERE trip_id = $1 ORDER BY created_at ASC';
    const result = await pool.query(query, [tripId]);
    return result.rows;
  }

  static async getBookingById(id) {
    const query = 'SELECT * FROM bookings WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async updateStatus(id, status) {
    const query = `UPDATE bookings SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *;`;
    const result = await pool.query(query, [status, id]);
    return result.rows[0];
  }
}

module.exports = BookingModel;
