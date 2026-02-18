const express = require('express');
const DriverController = require('../controllers/driverController');
const { authMiddleware } = require('../middlewares/authMiddleware');

const router = express.Router();

// Public read-only list of drivers
router.get('/public', DriverController.listDriversPublic);

// Admin creates a driver
router.post('/', authMiddleware, DriverController.createDriver);
router.get('/', authMiddleware, DriverController.listDrivers);
router.post('/assign', authMiddleware, DriverController.assignVehicle);
// Update or delete specific driver (by user id)
router.put('/:userId', authMiddleware, DriverController.updateDriver);
router.delete('/:userId', authMiddleware, DriverController.deleteDriver);
// Reset password (admin action) - admin only
const adminOnly = (req, res, next) => {
  if (req.userRole !== 'admin') return res.status(403).json({ message: 'Admin only' });
  next();
};
router.post('/:userId/reset_password', authMiddleware, adminOnly, DriverController.resetPassword);
// Admin: view recent reset logs
router.get('/resets', authMiddleware, adminOnly, DriverController.getResetLogs);

// Driver-specific endpoints
router.get('/me/trip', authMiddleware, DriverController.getMyActiveTrip);
router.get('/me/trip/bookings', authMiddleware, DriverController.getBookingsForMyTrip);
router.post('/me/trip/:tripId/occupancy', authMiddleware, DriverController.adjustOccupancy);

module.exports = router;
