const express = require('express');
const taskController = require('../controllers/taskController');
const authController = require('../controllers/authController');
const demoMode = require('../middlewares/demo_mode');
const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router.route('/tasks').get(authController.protect, authController.restrictTo('admin'), taskController.getAllTasks);

router
  .route('/task/:id')
  .get(taskController.editTask)
  .post(demoMode, authController.protect, authController.restrictTo('admin'), taskController.updateTask);

router
  .route('/task/delete/:id')
  .post(demoMode, authController.protect, authController.restrictTo('admin', 'lead-guide'), taskController.deleteTask);

module.exports = router;
