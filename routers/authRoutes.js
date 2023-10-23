const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const bodyParser = require('body-parser');
const urlencodeParser = bodyParser.urlencoded({ extended: false });

router.route('/login').post(urlencodeParser, authController.login);
router.route('/logout').get(authController.logout);
router.route('/get/user').post(authController.protect, userController.getUserByToken);

module.exports = router;
