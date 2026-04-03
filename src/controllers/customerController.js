const CustomerLocationModel = require('../models/customerLocationModel');

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
    const userAgent = req.get('user-agent') || null;

    // Store location in memory
    customerLocations.set(customerId, {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      timestamp: timestamp || new Date().toISOString(),
      clientIp
    });

    // Save to database for historical tracking
    try {
      await CustomerLocationModel.saveLocation(
        latitude,
        longitude,
        clientIp,
        userAgent
      );
    } catch (dbError) {
      console.log('Database save error (non-critical):', dbError.message);
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
