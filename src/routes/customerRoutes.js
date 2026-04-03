const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

// Save customer location (no authentication needed for public map)
router.post('/location', customerController.saveLocation);

// Get all customer locations
router.get('/locations', customerController.getLocations);

module.exports = router;
