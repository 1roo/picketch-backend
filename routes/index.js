const express = require('express');
const router = express.Router();
const controller = require('../controllers/userController');

// GET /api
router.get('/', controller.getLogin);

module.exports = router;
