const express = require('express');
const screenshotController = require('../controllers/screenshotController');
const authController = require('../controllers/authController');
const demoMode = require('../middlewares/demo_mode');
const router = express.Router({ mergeParams: true });
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/screenshots');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

router.use(authController.protect);

router
  .route('/screenshot/:id')
  .get(authController.protect, authController.restrictTo('admin'), screenshotController.getScreenshot);

router
  .route('/add/screenshot/')
  .post(demoMode, authController.protect, upload.any(), screenshotController.createScreenshot);

router
  .route('/delete/screenshot/')
  .post(demoMode, authController.protect, authController.restrictTo('admin'), screenshotController.deleteScreenshot);

router
  .route('/update/screenshot/')
  .post(authController.protect, authController.restrictTo('admin'), screenshotController.updateScreenshot);

router
  .route('/screenshot/:filename')
  .get(authController.protect, authController.restrictTo('admin'), screenshotController.download);

router
  .route('/screenshot/img/:filename')
  .get(authController.protect, authController.restrictTo('admin'), screenshotController.screenshotImg);

module.exports = router;
