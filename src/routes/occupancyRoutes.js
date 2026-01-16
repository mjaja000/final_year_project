const express = require('express');
const OccupancyController = require('../controllers/occupancyController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Public routes (for dashboard)
router.get('/routes', OccupancyController.getAllRoutes);
router.get('/all', OccupancyController.getAllOccupancyStatuses);

// Protected routes
router.use(authMiddleware);

// FR3: Occupancy Reporting (driver interface: "Seats Available" / "Full" buttons)
router.post('/status', OccupancyController.updateOccupancyStatus);

// Get occupancy status for a vehicle
router.get('/vehicle/:vehicleId', OccupancyController.getOccupancyStatus);

module.exports = router;
