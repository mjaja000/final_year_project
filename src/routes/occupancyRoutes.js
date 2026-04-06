const express = require('express');
const OccupancyController = require('../controllers/occupancyController');
const { authMiddleware, authorizeRoles } = require('../middlewares/authMiddleware');

const router = express.Router();
const adminOnly = [authMiddleware, authorizeRoles(['admin'])];

// Public routes (for dashboard)
router.get('/routes', OccupancyController.getAllRoutes);
router.get('/all', OccupancyController.getAllOccupancyStatuses);
router.get('/:vehicleId', OccupancyController.getOccupancyStatus);
router.put('/:vehicleId', adminOnly, OccupancyController.updateOccupancyCount);
router.delete('/:vehicleId', adminOnly, OccupancyController.deleteOccupancy);

// Protected routes
router.use(authMiddleware);

// FR3: Occupancy Reporting (driver interface: "Seats Available" / "Full" buttons)
router.post('/status', OccupancyController.updateOccupancyStatus);

module.exports = router;
