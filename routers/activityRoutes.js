const express = require('express');
const activityController = require('../controllers/activityController');
const authController = require('../controllers/authController');
const demoMode = require('../middlewares/demo_mode');
const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route('/task/:id')
  .get(authController.protect, authController.restrictTo('admin'), activityController.getAllActivities);
router
  .route('/activity/update-status')
  .post(authController.protect, authController.restrictTo('admin'), activityController.updateStatus);

/*
router
  .route('/task/:id')
  .get(taskController.editTask)
  .post(demoMode, authController.protect, authController.restrictTo('admin'), taskController.updateTask);

router
  .route('/task/delete/:id')
  .post(demoMode, authController.protect, authController.restrictTo('admin', 'lead-guide'), taskController.deleteTask);
*/

module.exports = router;
