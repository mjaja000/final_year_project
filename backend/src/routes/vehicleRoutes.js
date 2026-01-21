const express = require('express');
const VehicleController = require('../controllers/vehicleController');

const router = express.Router();

// Public vehicle endpoints
router.get('/', VehicleController.getAll);
router.get('/:id', VehicleController.getById);
router.get('/route/:routeId', VehicleController.getByRoute);
router.post('/', VehicleController.create);
router.put('/:id', VehicleController.update);
router.delete('/:id', VehicleController.remove);

module.exports = router;
