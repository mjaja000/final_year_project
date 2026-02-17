const express = require('express');
const OccupancyController = require('../controllers/occupancyController');
const { authMiddleware } = require('../middlewares/authMiddleware');

const router = express.Router();

// Public routes (for dashboard)
router.get('/routes', OccupancyController.getAllRoutes);
router.get('/all', OccupancyController.getAllOccupancyStatuses);
router.get('/:vehicleId', OccupancyController.getOccupancyStatus);
router.put('/:vehicleId', OccupancyController.updateOccupancyCount);
router.delete('/:vehicleId', OccupancyController.deleteOccupancy);

// Protected routes
router.use(authMiddleware);

// FR3: Occupancy Reporting (driver interface: "Seats Available" / "Full" buttons)
router.post('/status', OccupancyController.updateOccupancyStatus);

module.exports = router;
