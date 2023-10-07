const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const bodyParser = require('body-parser');
const demoMode = require('../middlewares/demo_mode');
const urlencodeParser = bodyParser.urlencoded({ extended: false });

router.route('/signup').post(demoMode, bodyParser.raw({ type: 'application/json' }), authController.signup);

router.use(authController.protect);

router.patch('/updateMyPassword', authController.updatePassword);
router.patch('/updateMe', userController.uploadPhotoUser, userController.resizePhotoUser, userController.updateMe);
router.delete('/deleteMe', userController.deleteMe);

router.route('/forgotPassword').post(demoMode, authController.forgotPassword);
router.route('/resetPassword/:token').patch(demoMode, authController.resetPassword);
router.route('/updatePassword').patch(demoMode, authController.updatePassword);
router.route('/updateUser').patch(demoMode, userController.updateUser);

router
  .route('/user/img/:filename')
  .get(authController.protect, authController.restrictTo('admin'), userController.userImg);

router
  .route('/user/delete/:id')
  .post(demoMode, authController.protect, authController.restrictTo('admin'), userController.deleteUser);

router.use(authController.restrictTo('admin'));

router.route('/users').get(authController.protect, authController.restrictTo('admin'), userController.getUsers);

router
  .route('/add/user')
  .post(demoMode, authController.protect, authController.restrictTo('admin'), userController.createUser);

router
  .route('/user/:id')
  .get(authController.protect, authController.restrictTo('admin'), userController.editUser)
  .post(demoMode, authController.protect, authController.restrictTo('admin'), userController.updateUser);

router
  .route('/user/photo/:id')
  .get(authController.protect, authController.restrictTo('admin'), userController.photoUser)
  .post(
    demoMode,
    authController.protect,
    authController.restrictTo('admin'),
    userController.uploadPhotoUser,
    userController.resizePhotoUser,
    userController.updatePhotoUser
  );

router
  .route('/user/password/:id')
  .post(demoMode, authController.protect, authController.restrictTo('admin'), userController.updatePassword);

router
  .route('/send/email/user')
  .post(demoMode, authController.protect, authController.restrictTo('admin'), userController.userEmail);

router
  .route('/user/password/:id')
  .get(userController.editPassword)
  .post(demoMode, authController.protect, authController.restrictTo('admin'), userController.updatePassword);

module.exports = router;
