const express = require('express');
const DriverController = require('../controllers/driverController');

const router = express.Router();

// Admin creates a driver
router.post('/', DriverController.createDriver);
router.get('/', DriverController.listDrivers);
router.post('/assign', DriverController.assignVehicle);

module.exports = router;
