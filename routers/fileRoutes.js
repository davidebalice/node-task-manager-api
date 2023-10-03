const express = require('express');
const fileController = require('../controllers/fileController');
const authController = require('../controllers/authController');
const demoMode = require('../middlewares/demo_mode');
const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route('/file/:id')
  .get(authController.protect, authController.restrictTo('admin'), fileController.getFile);



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
