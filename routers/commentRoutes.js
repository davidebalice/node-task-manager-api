const express = require('express');
const commentController = require('../controllers/commentController');
const authController = require('../controllers/authController');
const demoMode = require('../middlewares/demo_mode');
const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route('/comment/:id')
  .get(authController.protect, authController.restrictTo('admin'), commentController.getComments);

router.route('/add/comment/').post(demoMode, authController.protect, commentController.createComment);

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
