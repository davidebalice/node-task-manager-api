const express = require('express');
const activityController = require('../controllers/activityController');
const authController = require('../controllers/authController');
const demoMode = require('../middlewares/demo_mode');
const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route('/activity/update-status')
  .post(authController.protect, authController.restrictTo('admin'), activityController.updateStatus);

router
  .route('/update/activity/')
  .post(authController.protect, authController.restrictTo('admin'), activityController.updateActivity);

router
  .route('/add/activity/')
  .post(authController.protect, authController.restrictTo('admin'), activityController.createActivity);

router
  .route('/delete/activity/')
  .post(authController.protect, authController.restrictTo('admin'), activityController.deleteActivity);

module.exports = router;
