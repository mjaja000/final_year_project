const express = require('express');
const TripController = require('../controllers/tripController');
const { authMiddleware, authorizeRoles } = require('../middlewares/authMiddleware');

const router = express.Router();
const adminOnly = [authMiddleware, authorizeRoles(['admin'])];

router.post('/', adminOnly, TripController.createTrip);
router.get('/', TripController.listTrips);
router.get('/:id', TripController.getTrip);
router.patch('/:id/status', adminOnly, TripController.updateStatus);

// Create booking for a trip (office)
router.post('/:id/book', TripController.createBooking);

module.exports = router;
