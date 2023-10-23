const express = require('express');
const activityController = require('../controllers/activityController');
const authController = require('../controllers/authController');
const demoMode = require('../middlewares/demo_mode');
const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route('/activity/update-status')
  .post(authController.protect, activityController.updateStatus);

router
  .route('/update/activity/')
  .post(authController.protect, activityController.updateActivity);

router
  .route('/add/activity/')
  .post(authController.protect, activityController.createActivity);

router
  .route('/delete/activity/')
  .post(authController.protect, activityController.deleteActivity);

module.exports = router;
