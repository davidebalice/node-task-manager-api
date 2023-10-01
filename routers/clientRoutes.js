const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const bodyParser = require('body-parser');
const demoMode = require('../middlewares/demo_mode');
const urlencodeParser = bodyParser.urlencoded({ extended: false });
const authController = require('../controllers/authController');

router.route('/clients').get(clientController.getAllClients).post(demoMode, clientController.createClient);

router
  .route('/add/client')
  .get(authController.protect, function (req, res) {
    res.locals = { title: 'Add client' };
    res.render('Clients/add', { formData: '', message: '' });
  })
  .post(
    demoMode,
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    clientController.createClient
  );

router
  .route('/client/:id')
  .get(clientController.editClient)
  .post(
    demoMode,
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    clientController.updateClient
  );

router
  .route('/client/photo/:id')
  .get(clientController.photoClient)
  .post(
    demoMode,
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    clientController.uploadClientPhoto,
    clientController.resizeClientPhoto,
    clientController.updatePhoto
  );

module.exports = router;



