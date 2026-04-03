const express = require('express');
const VehicleController = require('../controllers/vehicleController');
const { authMiddleware, authorizeRoles } = require('../middlewares/authMiddleware');

const router = express.Router();
const adminOnly = [authMiddleware, authorizeRoles(['admin'])];

// Public vehicle endpoints
router.get('/', VehicleController.getAll);
router.get('/route/:routeId', VehicleController.getByRoute);
// Keep :id after specific route patterns to avoid shadowing /route/:routeId.
router.get('/:id', VehicleController.getById);
router.post('/', adminOnly, VehicleController.create);
router.put('/:id', adminOnly, VehicleController.update);
router.delete('/:id', adminOnly, VehicleController.remove);

module.exports = router;
