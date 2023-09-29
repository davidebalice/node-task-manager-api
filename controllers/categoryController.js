const multer = require('multer');
const mongoose = require('mongoose');
const sharp = require('sharp');
const Category = require('../models/categoryModel');
const ApiQuery = require('../middlewares/apiquery');
const AppError = require('../middlewares/error');
const catchAsync = require('../middlewares/catchAsync');
const factory = require('./handlerFactory');
const fs = require('fs');
const path = require('path');
const { ObjectId } = require('mongodb');
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadImage = upload.fields([{ name: 'imageCover', maxCount: 1 }]);

exports.resizeImage = catchAsync(async (req, res, next) => {
  console.log(req.files.imageCover);
  if (!req.files.imageCover) return next();

  req.body.imageCover = `category-${req.params.id}-${Date.now()}-cover.jpeg`;

  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/category/${req.body.imageCover}`);

  next();
});

exports.getAllCategories = catchAsync(async (req, res, next) => {
  let filterData = {};
  if (req.query.key) {
    const regex = new RegExp(req.query.key, 'i');
    filterData = { name: { $regex: regex } };
  }
  const setLimit = 20;
  const limit = req.query.limit * 1 || setLimit;
  const page = req.query.page * 1 || 1;
  const skip = (page - 1) * limit;
  const categories = await Category.find(filterData).sort('order').skip(skip).limit(limit);
  const count = await Category.countDocuments();
  const totalPages = Math.ceil(count / limit);

  let message = '';
  if (req.query.m) {
    if (req.query.m === '1') {
      message = 'Category added';
    } else if (req.query.m === '2') {
      message = 'Category deleted';
    }
  }

  //?viewType=json
  const viewType = req.query.viewType;
  if (viewType === 'json') {
    console.log(categories);
    res.json(categories);
  } else {
    res.render('Categories/categories', {
      title: 'Categories',
      categories,
      currentPage: page,
      page,
      limit,
      totalPages,
      message,
    });
  }
});

exports.addCategory = catchAsync(async (req, res, next) => {
  res.locals = { title: 'Add category' };
  res.render('Categories/add', { formData: '', message: '' });
});

exports.createCategory = catchAsync(async (req, res, next) => {
  try {
    await Category.create(req.body);
    res.redirect('/categories?m=1');
  } catch (err) {
    res.render('Categories/add', {
      status: 200,
      title: 'Add category',
      formData: req.body,
      message: err.message,
    });
  }
});

exports.deleteCategory = catchAsync(async (req, res, next) => {
  const doc = await Category.findByIdAndDelete(req.params.id);

  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }
  res.redirect('/categories?m=2');
});

exports.getCategory = factory.getOne(Category, { path: 'reviews' });

exports.editCategory = catchAsync(async (req, res, next) => {
  let query = await Category.findById(req.params.id);

  const doc = await query;

  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }

  let message = '';
  res.render('Categories/edit', {
    status: 200,
    title: 'Edit category',
    formData: doc,
    message: message,
  });
});

exports.updateCategory = catchAsync(async (req, res, next) => {
  const doc = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }
  res.redirect(doc._id);
});

exports.photoCategory = catchAsync(async (req, res, next) => {
  let query = await Category.findById(req.params.id);
  const doc = await query;

  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }
  let message = '';
  res.render('Categories/photo', {
    status: 200,
    title: 'Photo category',
    formData: doc,
    message: message,
  });
});

exports.updatePhoto = catchAsync(async (req, res, next) => {
  const doc = await Category.findByIdAndUpdate(req.params.id, req.body);

  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }

  res.redirect('/category/photo/' + doc._id);
});

exports.moveCategory = catchAsync(async (req, res, next) => {
  try {
    const { categoryId, direction } = req.body;

    const category = await Category.findById(categoryId);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const categories = await Category.find().sort({ order: 1 }).exec();
    const currentIndex = categories.findIndex((cat) => cat.id === categoryId);

    if (direction === 'up' && currentIndex > 0) {
      const tempOrder = categories[currentIndex].order;
      categories[currentIndex].order = categories[currentIndex - 1].order;
      categories[currentIndex - 1].order = tempOrder;
    } else if (direction === 'down' && currentIndex < categories.length - 1) {
      const tempOrder = categories[currentIndex].order;
      categories[currentIndex].order = categories[currentIndex + 1].order;
      categories[currentIndex + 1].order = tempOrder;
    } else {
      return res.status(400).json({ message: 'error' });
    }

    categories.sort((a, b) => a.order - b.order);

    categories.forEach((cat, index) => {
      cat.order = index + 1;
    });

    await Promise.all(categories.map((cat) => Category.findOneAndUpdate({ _id: cat._id }, { order: cat.order })));

    res.status(200).json({ message: 'ok' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'error' });
  }
});

exports.activeCategory = catchAsync(async (req, res, next) => {
  const doc = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }
});
