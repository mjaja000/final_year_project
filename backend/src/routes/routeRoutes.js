const express = require('express');
const RouteController = require('../controllers/routeController');

const router = express.Router();

// Public CRUD for routes (frontend expects no auth)
router.get('/', RouteController.getAll);
router.get('/:id', RouteController.getById);
router.post('/', RouteController.create);
router.put('/:id', RouteController.update);
router.delete('/:id', RouteController.remove);

module.exports = router;
