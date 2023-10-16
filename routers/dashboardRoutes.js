const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const authController = require('../controllers/authController');

const router = express.Router();

router.get('/dashboard', authController.protect, dashboardController.dashboard);
router.get('/getdemomode', authController.protect, dashboardController.getDemoMode);

module.exports = router;
