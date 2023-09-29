const express = require('express');
const viewsController = require('../controllers/viewsController');
const authController = require('../controllers/authController');

const router = express.Router();
router.use(viewsController.alerts);

//router.get('/', authController.isLoggedIn, viewsController.index);
router.get('/event/:slug', authController.isLoggedIn, viewsController.getEvent);
router.get('/login', authController.isLoggedIn, viewsController.getLoginForm);
router.get('/me', authController.protect, viewsController.getAccount);
router.get('/my-events', authController.protect, viewsController.getMyEvents);

router.post(
  '/submit-user-data',
  authController.protect,
  viewsController.updateUserData
);

module.exports = router;
