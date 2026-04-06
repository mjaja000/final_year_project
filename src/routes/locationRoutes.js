const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Update driver location (requires authentication)
router.post('/location', authenticateToken, locationController.updateLocation);

// Get all vehicle locations (public for map display)
router.get('/locations', locationController.getVehicleLocations);

// Get specific vehicle location
router.get('/locations/:vehicleId', locationController.getVehicleLocation);

// Get nearby vehicles
router.get('/nearby', locationController.getNearbyVehicles);

module.exports = router;
