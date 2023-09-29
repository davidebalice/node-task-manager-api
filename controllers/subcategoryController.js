const multer = require('multer');
const mongoose = require('mongoose');
const sharp = require('sharp');
const Subcategory = require('../models/subcategoryModel');
const Category = require('../models/categoryModel');
const ApiQuery = require('../utils/apiquery');
const AppError = require('../utils/error');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const { ObjectId } = require('mongodb');

exports.getAllSubcategories = catchAsync(async (req, res, next) => {
  let filterData = {};
  let queryKey = '';
  let queryCat = '';
  if (req.query.key) {
    queryKey = req.query.key;
    const regex = new RegExp(req.query.key, 'i');
    filterData.name = { $regex: regex };
  }
  if (req.query.category) {
    queryCat = req.query.category;
    filterData.category = req.query.category;
  }
  const setLimit = 20;
  const limit = req.query.limit * 1 || setLimit;
  const page = req.query.page * 1 || 1;
  const skip = (page - 1) * limit;
  const categories = await Category.find().sort({ order: 1 });
  const subcategories = await Subcategory.find(filterData)
    .sort('order')
    .skip(skip)
    .limit(limit)
    .populate({
      path: 'category',
      select: 'name',
    });

  const count = await Subcategory.countDocuments();
  const totalPages = Math.ceil(count / limit);

  let message = '';
  if (req.query.m) {
    if (req.query.m === '1') {
      message = 'Subcategory added';
    } else if (req.query.m === '2') {
      message = 'Subcategory deleted';
    }
  }

  //?viewType=json
  const viewType = req.query.viewType;
  if (viewType === 'json') {
    res.json(subcategories);
  } else {
    console.log(subcategories);
    res.render('Subcategories/subcategories', {
      title: 'Subcategories',
      subcategories,
      categories,
      currentPage: page,
      page,
      limit,
      totalPages,
      message,
      queryKey,
      queryCat,
    });
  }
});

exports.getSubcategoryByCatId = catchAsync(async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const subcategories = await Subcategory.find({ category: categoryId });
    res.json(subcategories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error' });
  }
});

exports.addSubcategory = catchAsync(async (req, res, next) => {
  res.locals = { title: 'Add subcategory' };
  const categories = await Category.find().sort({ order: 1 });
  res.render('Subcategories/add', { formData: '', message: '', categories });
});

exports.createSubcategory = catchAsync(async (req, res, next) => {
  try {
    await Subcategory.create(req.body);
    res.redirect('/subcategories?m=1');
  } catch (err) {
    const categories = await Category.find().sort({ order: 1 });
    res.render('Subcategories/add', {
      status: 200,
      title: 'Add subcategory',
      formData: req.body,
      message: err.message,
      categories,
    });
  }
});

exports.deleteSubcategory = catchAsync(async (req, res, next) => {
  const doc = await Subcategory.findByIdAndDelete(req.params.id);

  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }
  res.redirect('/subcategories?m=2');
});

exports.getSubcategory = factory.getOne(Subcategory, { path: 'reviews' });

exports.editSubcategory = catchAsync(async (req, res, next) => {
  let query = await Subcategory.findById(req.params.id);

  const doc = await query;

  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }

  let message = '';
  res.render('Subcategories/edit', {
    status: 200,
    title: 'Edit subcategory',
    formData: doc,
    message: message,
  });
});

exports.updateSubcategory = catchAsync(async (req, res, next) => {
  const doc = await Subcategory.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }
  res.redirect(doc._id);
});

exports.moveSubcategory = catchAsync(async (req, res, next) => {
  try {
    const { subcategoryId, direction } = req.body;

    const subcategory = await Subcategory.findById(subcategoryId);

    if (!subcategory) {
      return res.status(404).json({ message: 'Subcategory not found' });
    }

    const subcategories = await Subcategory.find().sort({ order: 1 }).exec();
    const currentIndex = subcategories.findIndex(
      (subcat) => subcat.id === subcategoryId
    );

    if (direction === 'up' && currentIndex > 0) {
      const tempOrder = subcategories[currentIndex].order;
      subcategories[currentIndex].order = subcategories[currentIndex - 1].order;
      subcategories[currentIndex - 1].order = tempOrder;
    } else if (
      direction === 'down' &&
      currentIndex < subcategories.length - 1
    ) {
      const tempOrder = subcategories[currentIndex].order;
      subcategories[currentIndex].order = subcategories[currentIndex + 1].order;
      subcategories[currentIndex + 1].order = tempOrder;
    } else {
      return res.status(400).json({ message: 'error' });
    }

    subcategories.sort((a, b) => a.order - b.order);

    subcategories.forEach((subcat, index) => {
      subcat.order = index + 1;
    });

    await Promise.all(
      subcategories.map((subcat) =>
        Subcategory.findOneAndUpdate(
          { _id: subcat._id },
          { order: subcat.order }
        )
      )
    );

    res.status(200).json({ message: 'ok' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'error' });
  }
});

exports.activeSubcategory = catchAsync(async (req, res, next) => {
  const doc = await Subcategory.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }
});
