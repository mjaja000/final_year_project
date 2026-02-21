const db = require('../config/database');

// Store customer locations in memory for real-time tracking
const customerLocations = new Map();

/**
 * Save customer/user location
 */
exports.saveLocation = async (req, res) => {
  try {
    const { latitude, longitude, timestamp } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    // Generate a temporary customer ID based on IP or session
    // For now, use a combination of IP and timestamp
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    const customerId = `customer_${clientIp}_${new Date().getHours()}`;

    // Store location in memory
    customerLocations.set(customerId, {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      timestamp: timestamp || new Date().toISOString(),
      clientIp
    });

    // Optionally save to database for historical tracking
    try {
      await db.query(
        `INSERT INTO customer_locations (latitude, longitude, recorded_at, client_ip)
         VALUES ($1, $2, $3, $4)`,
        [parseFloat(latitude), parseFloat(longitude), new Date(), clientIp]
      ).catch(err => {
        // Table might not exist, continue anyway
        console.log('customer_locations table not available:', err.message);
      });
    } catch (dbError) {
      console.log('Database save attempt:', dbError.message);
    }

    res.json({
      success: true,
      message: 'Customer location saved',
      location: { latitude, longitude }
    });
  } catch (error) {
    console.error('Error saving customer location:', error);
    res.status(500).json({ message: 'Failed to save location' });
  }
};

/**
 * Get customer locations
 */
exports.getLocations = async (req, res) => {
  try {
    const locations = Array.from(customerLocations.values());
    res.json({
      success: true,
      locations,
      count: locations.length
    });
  } catch (error) {
    console.error('Error fetching customer locations:', error);
    res.status(500).json({ message: 'Failed to fetch locations' });
  }
};
