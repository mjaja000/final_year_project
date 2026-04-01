const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const DriverController = require('../controllers/driverController');
const { authMiddleware } = require('../middlewares/authMiddleware');

const router = express.Router();

// Inline admin guard keeps this route file self-contained without extra dependencies.
const adminOnly = (req, res, next) => {
  if (req.userRole !== 'admin') return res.status(403).json({ message: 'Admin only' });
  next();
};

const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'drivers');
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '.jpg').toLowerCase();
    const safeExt = ext && ext.length <= 5 ? ext : '.jpg';
    cb(null, `driver-${req.params.userId}-${Date.now()}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!/^image\/(jpeg|jpg|png|webp)$/i.test(file.mimetype)) {
      return cb(new Error('Only JPG, PNG, or WEBP images are allowed'));
    }
    cb(null, true);
  },
});

// Public read-only list of drivers
router.get('/public', DriverController.listDriversPublic);

// Admin creates a driver
router.post('/', authMiddleware, adminOnly, DriverController.createDriver);
router.get('/', authMiddleware, adminOnly, DriverController.listDrivers);
router.post('/assign', authMiddleware, adminOnly, DriverController.assignVehicle);
router.get('/:userId/assignment-status', authMiddleware, adminOnly, DriverController.getDriverAssignmentStatus);
// Update or delete specific driver (by user id)
router.put('/:userId', authMiddleware, adminOnly, DriverController.updateDriver);
router.delete('/:userId', authMiddleware, adminOnly, DriverController.deleteDriver);
router.post('/:userId/photo', authMiddleware, adminOnly, upload.single('photo'), DriverController.uploadDriverPhoto);
// Reset password (admin action) - admin only
router.post('/:userId/reset_password', authMiddleware, adminOnly, DriverController.resetPassword);
// Admin: view recent reset logs
router.get('/resets', authMiddleware, adminOnly, DriverController.getResetLogs);

// Driver-specific endpoints
router.get('/me/trip', authMiddleware, DriverController.getMyActiveTrip);
router.get('/me/trip/bookings', authMiddleware, DriverController.getBookingsForMyTrip);
router.get('/me/occupancy', authMiddleware, DriverController.getMyAssignedVehicleOccupancy);
router.post('/me/occupancy', authMiddleware, DriverController.updateMyAssignedVehicleOccupancy);
router.post('/me/trip/:tripId/occupancy', authMiddleware, DriverController.adjustOccupancy);
router.get('/me/tickets', authMiddleware, DriverController.getMyVehicleTickets);
router.post('/me/add-passenger-payment', authMiddleware, DriverController.addPassengerPayment);

// Driver location update
const locationController = require('../controllers/locationController');
router.post('/location', authMiddleware, locationController.updateLocation);

module.exports = router;
