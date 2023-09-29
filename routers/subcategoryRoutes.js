const express = require('express');
const router = express.Router();
const subcategoryController = require('../controllers/subcategoryController');
const authController = require('../controllers/authController');
const demoMode = require('../utils/demo_mode');
const User = require('../models/userModel');

router
  .route('/subcategories')
  .get(authController.protect, subcategoryController.getAllSubcategories);

router
  .route('/add/subcategory')
  .get(authController.protect, subcategoryController.addSubcategory)
  .post(
    demoMode,
    authController.protect,
    authController.restrictTo('admin'),
    subcategoryController.createSubcategory
  );

router
  .route('/subcategories/:categoryId')
  .get(authController.protect, subcategoryController.getSubcategoryByCatId);

router
  .route('/subcategory/:id')
  .get(subcategoryController.editSubcategory)
  .post(
    demoMode,
    authController.protect,
    authController.restrictTo('admin'),
    subcategoryController.updateSubcategory
  );

router
  .route('/subcategory/delete/:id')
  .post(
    demoMode,
    authController.protect,
    authController.restrictTo('admin'),
    subcategoryController.deleteSubcategory
  );

router
  .route('/move/subcategory')
  .post(
    demoMode,
    authController.protect,
    authController.restrictTo('admin'),
    subcategoryController.moveSubcategory
  );

router
  .route('/active/subcategory/:id')
  .post(
    demoMode,
    authController.protect,
    authController.restrictTo('admin'),
    subcategoryController.activeSubcategory
  );

module.exports = router;
