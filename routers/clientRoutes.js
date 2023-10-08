const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const authController = require('../controllers/authController');
const bodyParser = require('body-parser');
const demoMode = require('../middlewares/demo_mode');
const urlencodeParser = bodyParser.urlencoded({ extended: false });

router.use(authController.protect);

router
  .route('/client/img/:filename')
  .get(authController.protect, authController.restrictTo('admin'), clientController.clientImg);

router
  .route('/client/delete/:id')
  .post(demoMode, authController.protect, authController.restrictTo('admin'), clientController.deleteClient);

router.route('/clients').get(authController.protect, authController.restrictTo('admin'), clientController.getClients);

router
  .route('/add/client')
  .post(demoMode, authController.protect, authController.restrictTo('admin'), clientController.createClient);

router
  .route('/client/:id')
  .get(authController.protect, authController.restrictTo('admin'), clientController.editClient)
  .post(demoMode, authController.protect, authController.restrictTo('admin'), clientController.updateClient);

router
  .route('/client/photo/:id')
  .get(authController.protect, authController.restrictTo('admin'), clientController.photoClient)
  .post(
    demoMode,
    authController.protect,
    authController.restrictTo('admin'),
    clientController.uploadPhotoClient,
    clientController.resizePhotoClient,
    clientController.updatePhotoClient
  );

router
  .route('/client/password/:id')
  .post(demoMode, authController.protect, authController.restrictTo('admin'), clientController.updatePassword);

router
  .route('/send/email/client')
  .post(demoMode, authController.protect, authController.restrictTo('admin'), clientController.clientEmail);

router
  .route('/client/password/:id')
  .get(clientController.editPassword)
  .post(demoMode, authController.protect, authController.restrictTo('admin'), clientController.updatePassword);

module.exports = router;
