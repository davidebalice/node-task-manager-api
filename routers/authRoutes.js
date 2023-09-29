const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const bodyParser = require('body-parser');
const demoMode = require('../middlewares/demo_mode');
const urlencodeParser = bodyParser.urlencoded({ extended: false });

router
  .route('/login')
  .get(function (req, res) {
    res.locals = { title: 'Login' };
    res.render('Auth/auth-login', {
      message: req.flash('message'),
      error: req.flash('error'),
    });
  })
  .post(urlencodeParser, authController.login);

router.route('/logout').get(authController.logout);

module.exports = router;
