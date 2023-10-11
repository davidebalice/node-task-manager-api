const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const authController = require('../controllers/authController');

const router = express.Router();

router.get('/dashboard', authController.protect, dashboardController.dashboard);

module.exports = router;
