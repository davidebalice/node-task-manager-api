const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const authController = require('../controllers/authController');
const demoMode = require('../middlewares/demo_mode');
const User = require('../models/userModel');

router.route('/categories').get(authController.protect, categoryController.getAllCategories);

router
  .route('/add/category')
  .get(authController.protect, categoryController.addCategory)
  .post(demoMode, authController.protect, authController.restrictTo('admin'), categoryController.createCategory);

router
  .route('/category/:id')
  .get(categoryController.editCategory)
  .post(demoMode, authController.protect, authController.restrictTo('admin'), categoryController.updateCategory);

router
  .route('/category/photo/:id')
  .get(categoryController.photoCategory)
  .post(
    demoMode,
    authController.protect,
    authController.restrictTo('admin'),
    categoryController.uploadImage,
    categoryController.resizeImage,
    categoryController.updatePhoto
  );

router
  .route('/category/delete/:id')
  .post(demoMode, authController.protect, authController.restrictTo('admin'), categoryController.deleteCategory);

router
  .route('/move/category')
  .post(demoMode, authController.protect, authController.restrictTo('admin'), categoryController.moveCategory);

router
  .route('/active/category/:id')
  .post(demoMode, authController.protect, authController.restrictTo('admin'), categoryController.activeCategory);

module.exports = router;
