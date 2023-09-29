const multer = require('multer');
const mongoose = require('mongoose');
const sharp = require('sharp');
const Project = require('../models/projectModel');
const Category = require('../models/categoryModel');
const ApiQuery = require('../middlewares/apiquery');
const AppError = require('../middlewares/error');
const catchAsync = require('../middlewares/catchAsync');
const factory = require('./handlerFactory');
const fs = require('fs');
const path = require('path');
const { ObjectId } = require('mongodb');
const multerStorage = multer.memoryStorage();
const { parseISO, format, startOfMonth, endOfMonth } = require('date-fns');

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
exports.uploadGallery = upload.fields([{ name: 'images', maxCount: 6 }]);

exports.resizeImage = catchAsync(async (req, res, next) => {
  console.log(req.files.imageCover);
  if (!req.files.imageCover) return next();

  req.body.imageCover = `project-${req.params.id}-${Date.now()}-cover.jpeg`;

  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/projects/${req.body.imageCover}`);

  next();
});

exports.resizeGallery = catchAsync(async (req, res, next) => {
  if (!req.files.images) return next();
  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `project-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/projects/${filename}`);
      req.body.images.push(filename);
    })
  );
  next();
});

exports.getAllProjects = catchAsync(async (req, res, next) => {
  const userId = res.locals.user._id;
  const userRole = res.locals.user.role;

  let filterData = {};

  if (req.query.key) {
    const regex = new RegExp(req.query.key, 'i');
    filterData.name = { $regex: regex };
  }

  if (userRole === 'admin') {
    filterData.$or = [{ owner: userId }];
  } else {
    filterData.$or = [{ owner: userId }, { 'members.user': userId }];
  }

  const setLimit = 12;
  const limit = req.query.limit * 1 || setLimit;
  const page = req.query.page * 1 || 1;
  const skip = (page - 1) * limit;
  const projects = await Project.find(filterData).sort('-createdAt').skip(skip).limit(limit);
  const count = await Project.countDocuments();
  const totalPages = Math.ceil(count / limit);

  const formattedProjects = projects.map((project) => ({
    ...project._doc,
    formattedDate: format(new Date(project.createdAt), 'dd/MM/yyyy'),
  }));

  let message = '';
  if (req.query.m) {
    if (req.query.m === '1') {
      message = 'Project added';
    } else if (req.query.m === '2') {
      message = 'Project deleted';
    }
  }

  res.status(200).json({
    projects: formattedProjects,
    currentPage: page,
    page,
    limit,
    totalPages,
    message,
  });
});

exports.addProject = catchAsync(async (req, res, next) => {
  const categories = await Category.find({}).sort({ order: 1 });
  res.locals = { title: 'Add project' };
  res.render('Projects/add', {
    formData: '',
    message: '',
    categories: categories,
  });
});

exports.createProject = catchAsync(async (req, res, next) => {
  try {
    req.body._id = new mongoose.Types.ObjectId();
    await Project.create(req.body);
    res.redirect('/projects?m=1');
  } catch (err) {
    const categories = await Category.find().sort({ order: 1 });
    res.render('Projects/add', {
      status: 200,
      title: 'Add project',
      formData: req.body,
      message: err.message,
      categories,
    });
  }
});

exports.deleteProject = catchAsync(async (req, res, next) => {
  const doc = await Project.findByIdAndDelete(req.params.id);
  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }
  res.redirect('/projects?m=2');
});

exports.getProject = factory.getOne(Project, { path: 'reviews' });

exports.editProject = catchAsync(async (req, res, next) => {
  let query = await Project.findById(req.params.id);
  const doc = await query;

  console.log('doc.category');
  console.log(doc.category);

  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }
  const categories = await Category.find().sort({ order: 1 });

  let message = '';
  res.render('Projects/edit', {
    status: 200,
    title: 'Edit project',
    formData: doc,
    message,
    categories,
  });
});

exports.updateProject = catchAsync(async (req, res, next) => {
  const doc = await Project.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }
  res.redirect(doc._id);
});

exports.photoProject = catchAsync(async (req, res, next) => {
  let query = await Project.findById(req.params.id);
  const doc = await query;
  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }
  let message = '';
  res.render('Projects/photo', {
    status: 200,
    title: 'Photo project',
    formData: doc,
    message: message,
  });
});

exports.updatePhoto = catchAsync(async (req, res, next) => {
  const doc = await Project.findByIdAndUpdate(req.params.id, req.body);
  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }
  res.redirect('/project/photo/' + doc._id);
});

exports.updateGallery = catchAsync(async (req, res, next) => {
  const doc = await Project.updateOne({ _id: req.params.id }, { $push: { images: { $each: req.body.images } } });

  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }

  res.redirect('/project/photo/' + req.params.id);
});

exports.deleteGallery = catchAsync(async (req, res, next) => {
  let query = await Project.findById(req.body.id);
  const image = req.body.image;
  if (!image) {
    return next(new AppError('No document found with that ID', 404));
  }

  const index = query.images.indexOf(image);
  if (index > -1) {
    query.images.splice(index, 1);
  }

  const doc = await Project.updateOne({ _id: req.body.id }, { $set: { images: query.images } });

  let pathFile = path.join(__dirname, '/public/img/projects', image);
  pathFile = pathFile.replace('controllers', '');

  if (fs.existsSync(pathFile)) {
    fs.unlinkSync(pathFile);
    console.log('File deleted:', image);
  } else {
    console.log('File not exists:', image);
  }

  res.redirect('/project/photo/' + req.body.id);
});

exports.activeProject = catchAsync(async (req, res, next) => {
  const doc = await Project.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }
});
