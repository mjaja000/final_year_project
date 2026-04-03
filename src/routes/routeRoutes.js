const express = require('express');
const RouteController = require('../controllers/routeController');
const { authMiddleware, authorizeRoles } = require('../middlewares/authMiddleware');

const router = express.Router();
const adminOnly = [authMiddleware, authorizeRoles(['admin'])];

// Public CRUD for routes (frontend expects no auth)
router.get('/', RouteController.getAll);
router.get('/:id', RouteController.getById);
router.post('/', adminOnly, RouteController.create);
router.put('/:id', adminOnly, RouteController.update);
router.delete('/:id', adminOnly, RouteController.remove);

module.exports = router;
