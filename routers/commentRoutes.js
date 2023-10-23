const express = require('express');
const commentController = require('../controllers/commentController');
const authController = require('../controllers/authController');
const demoMode = require('../middlewares/demo_mode');
const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route('/comment/:id')
  .get(authController.protect, commentController.getComments);

router.route('/add/comment/').post(demoMode, authController.protect, commentController.createComment);

router
  .route('/delete/comment/')
  .post(demoMode, authController.protect, commentController.deleteComment);

router
  .route('/update/comment/')
  .post(authController.protect,  commentController.updateComment);

/*
router
  .route('/task/:id')
  .get(commentController.editTask)
  .post(demoMode, authController.protect, authController.restrictTo('admin'), commentController.updateTask);

*/

module.exports = router;
