const db = require('../config/database');

// Store vehicle locations in memory for real-time tracking
// In production, use Redis or a similar caching solution for scalability
const vehicleLocations = new Map();

/**
 * Update driver/vehicle location
 */
exports.updateLocation = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { latitude, longitude, status, accuracy } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Get driver's assigned vehicle
    const driverResult = await db.query(
      'SELECT id, name, email, assigned_vehicle_id FROM users WHERE id = $1 AND role = $2',
      [userId, 'driver']
    );

    if (driverResult.rows.length === 0) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    const driver = driverResult.rows[0];
    const vehicleId = driver.assigned_vehicle_id;

    if (!vehicleId && latitude && longitude) {
      return res.status(400).json({ message: 'No vehicle assigned to driver' });
    }

    // Store location in memory cache
    if (latitude && longitude) {
      vehicleLocations.set(vehicleId, {
        id: vehicleId,
        driver_id: userId,
        driver_name: driver.name,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        accuracy: accuracy || null,
        is_online: status === 'online',
        last_update: new Date().toISOString()
      });

      // Optionally store in database for historical tracking
      await db.query(
        `INSERT INTO vehicle_locations (vehicle_id, driver_id, latitude, longitude, accuracy, recorded_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (vehicle_id) 
         DO UPDATE SET 
           driver_id = EXCLUDED.driver_id,
           latitude = EXCLUDED.latitude,
           longitude = EXCLUDED.longitude,
           accuracy = EXCLUDED.accuracy,
           recorded_at = NOW()`,
        [vehicleId, userId, latitude, longitude, accuracy || null]
      ).catch(err => {
        // Table might not exist, continue anyway
        console.log('vehicle_locations table not available:', err.message);
      });
    } else if (status === 'offline' && vehicleId) {
      // Remove from active locations when going offline
      vehicleLocations.delete(vehicleId);
    }

    res.json({
      success: true,
      message: 'Location updated',
      location: latitude && longitude ? { latitude, longitude } : null
    });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ message: 'Failed to update location' });
  }
};

/**
 * Get all active vehicle locations
 */
exports.getVehicleLocations = async (req, res) => {
  try {
    // Get locations from memory cache
    const locations = Array.from(vehicleLocations.values());

    // Enrich with vehicle details
    const enrichedLocations = await Promise.all(
      locations.map(async (loc) => {
        try {
          const vehicleResult = await db.query(
            'SELECT id, registration_number, vehicle_type, status FROM vehicles WHERE id = $1',
            [loc.id]
          );

          if (vehicleResult.rows.length > 0) {
            const vehicle = vehicleResult.rows[0];
            return {
              ...loc,
              registration_number: vehicle.registration_number,
              vehicle_type: vehicle.vehicle_type,
              status: vehicle.status
            };
          }
          return loc;
        } catch (err) {
          return loc;
        }
      })
    );

    res.json({
      success: true,
      count: enrichedLocations.length,
      vehicles: enrichedLocations.filter(v => v.is_online)
    });
  } catch (error) {
    console.error('Error fetching vehicle locations:', error);
    res.status(500).json({ message: 'Failed to fetch locations' });
  }
};

/**
 * Get specific vehicle location
 */
exports.getVehicleLocation = async (req, res) => {
  try {
    const { vehicleId } = req.params;

    const location = vehicleLocations.get(parseInt(vehicleId));

    if (!location) {
      return res.status(404).json({ message: 'Vehicle location not found' });
    }

    res.json({
      success: true,
      location
    });
  } catch (error) {
    console.error('Error fetching vehicle location:', error);
    res.status(500).json({ message: 'Failed to fetch location' });
  }
};

/**
 * Get nearby vehicles (within radius)
 */
exports.getNearbyVehicles = async (req, res) => {
  try {
    const { latitude, longitude, radius = 5 } = req.query; // radius in km

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude required' });
    }

    const userLat = parseFloat(latitude);
    const userLon = parseFloat(longitude);
    const searchRadius = parseFloat(radius);

    // Calculate distance using Haversine formula
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371; // Earth's radius in km
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLon = (lon2 - lon1) * (Math.PI / 180);
      
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
      
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    // Filter vehicles within radius
    const locations = Array.from(vehicleLocations.values());
    const nearbyVehicles = locations
      .filter(v => v.is_online)
      .map(v => ({
        ...v,
        distance: calculateDistance(userLat, userLon, v.latitude, v.longitude)
      }))
      .filter(v => v.distance <= searchRadius)
      .sort((a, b) => a.distance - b.distance);

    res.json({
      success: true,
      count: nearbyVehicles.length,
      vehicles: nearbyVehicles
    });
  } catch (error) {
    console.error('Error finding nearby vehicles:', error);
    res.status(500).json({ message: 'Failed to find nearby vehicles' });
  }
};

// Export vehicle locations map for use in socket events
exports.vehicleLocations = vehicleLocations;
