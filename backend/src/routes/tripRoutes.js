const express = require('express');
const TripController = require('../controllers/tripController');

const router = express.Router();

router.post('/', TripController.createTrip);
router.get('/', TripController.listTrips);
router.get('/:id', TripController.getTrip);
router.patch('/:id/status', TripController.updateStatus);

// Create booking for a trip (office)
router.post('/:id/book', TripController.createBooking);

module.exports = router;
