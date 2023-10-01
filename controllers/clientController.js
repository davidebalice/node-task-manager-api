const Client = require('../models/clientModel');
const catchAsync = require('../middlewares/catchAsync');
const mongoose = require('mongoose');
const factory = require('./handlerFactory');
const AppError = require('../middlewares/error');
const multer = require('multer');
const sharp = require('sharp');
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

exports.uploadClientPhoto = upload.single('photo');

exports.resizeClientPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  req.file.filename = `client-${req.client.id}-${Date.now()}.jpeg`;
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/assets/images/clients/${req.file.filename}`);

  next();
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.client.id;
  next();
};

exports.getAllClients = catchAsync(async (req, res, next) => {
  let filterData = {};
  if (req.query.key) {
    const regex = new RegExp(req.query.key, 'i');
    filterData = { name: { $regex: regex } };
  }
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 10;
  const skip = (page - 1) * limit;
  const clients = await Client.find(filterData).sort('-createdAt').skip(skip).limit(limit);
  const count = await Client.countDocuments();
  const totalPages = Math.ceil(count / limit);
  let message = '';
  if (req.query.m) {
    if (req.query.m === '1') {
      message = 'Client added';
    } else if (req.query.m === '2') {
      message = 'Client deleted';
    }
  }
  res.render('Clients/clients', {
    title: 'Clients',
    clients,
    page,
    limit,
    totalPages,
    message,
  });
});

exports.editClient = catchAsync(async (req, res, next) => {
  let query = await Client.findById(req.params.id);

  const doc = await query;

  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }
  let message = '';
  res.render('Clients/edit', {
    status: 200,
    title: 'Edit client',
    formData: doc,
    message: message,
  });
});

exports.updateClient = catchAsync(async (req, res, next) => {
  const doc = await Client.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }

  res.redirect(doc._id);
});

exports.photoClient = catchAsync(async (req, res, next) => {
  let query = await Client.findById(req.params.id);

  // if (popOptions) query = query.populate(popOptions);
  const doc = await query;

  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }
  let message = '';
  res.render('Client/photo', {
    status: 200,
    title: 'Photo client',
    formData: doc,
    message: message,
  });
});

exports.updatePhoto = catchAsync(async (req, res, next) => {
  req.body.photo = req.file.filename;
  const doc = await Client.findByIdAndUpdate(req.params.id, req.body);

  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }
  res.redirect('/client/photo/' + doc._id);
});

exports.createClient = catchAsync(async (req, res, next) => {
  try {
    req.body._id = new mongoose.Types.ObjectId();
    await Client.create(req.body);
    res.redirect('/clients?m=1');
  } catch (err) {
    res.render('Clients/add', {
      status: 200,
      title: 'Add client',
      formData: req.body,
      message: err.message,
    });
  }
});

exports.deleteClient = catchAsync(async (req, res, next) => {
  const doc = await Client.findByIdAndDelete(req.params.id);
  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }
  res.redirect('/clients?m=2');
});

exports.editPassword = catchAsync(async (req, res, next) => {
  let query = await Client.findById(req.params.id);
  const doc = await query;
  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }
  res.render('Clients/password', {
    status: 200,
    title: 'Edit password',
    formData: doc,
    message: '',
  });
});

exports.photoClient = catchAsync(async (req, res, next) => {
  let query = await Client.findById(req.params.id);

  // if (popOptions) query = query.populate(popOptions);
  const doc = await query;
  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }
  let message = '';
  res.render('Clients/photo', {
    status: 200,
    title: 'Photo client',
    formData: doc,
    message: message,
  });
});
