const express = require('express');
const fileController = require('../controllers/fileController');
const authController = require('../controllers/authController');
const demoMode = require('../middlewares/demo_mode');
const router = express.Router({ mergeParams: true });
const multer = require('multer');
const path = require('path'); 

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/tasks');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

router.use(authController.protect);

router.route('/file/:id').get(authController.protect, authController.restrictTo('admin'), fileController.getFile);

router.route('/add/file/').post(demoMode, authController.protect, upload.any(), fileController.createFile);

router
  .route('/delete/file/')
  .post(demoMode, authController.protect, authController.restrictTo('admin'), fileController.deleteFile);

router
  .route('/update/file/')
  .post(authController.protect, authController.restrictTo('admin'), fileController.updateFile);

  router
  .route('/download/:filename')
  .get(authController.protect, authController.restrictTo('admin'), fileController.download);

module.exports = router;
