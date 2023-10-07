const Client = require('../models/clientModel');
const catchAsync = require('../middlewares/catchAsync');
const mongoose = require('mongoose');
const factory = require('./handlerFactory');
const AppError = require('../middlewares/error');
const multer = require('multer');
const sharp = require('sharp');

const path = require('path');
const bcrypt = require('bcrypt');

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

exports.uploadPhotoClient = upload.single('photo');

exports.resizePhotoClient = catchAsync(async (req, res, next) => {
  console.log(req.file);
  if (!req.file) return next();
  req.file.filename = `client-${req.client.id}-${Date.now()}.jpeg`;
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`${process.env.FILE_PATH}/uploads/clients/${req.file.filename}`);

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

exports.getClients = catchAsync(async (req, res, next) => {
  let filterData = {};

  if (req.query.key) {
    const regex = new RegExp(req.query.key, 'i');
    filterData.name = { $regex: regex };
  }

  const setLimit = 12;
  const limit = req.query.limit * 1 || setLimit;
  const page = req.query.page * 1 || 1;
  const skip = (page - 1) * limit;
  const clients = await Client.find(filterData).sort({ createdAt: -1 }).skip(skip).limit(limit);
  const count = await Client.countDocuments();
  const totalPages = Math.ceil(count / limit);

  res.status(200).json({
    clients,
    currentPage: page,
    page,
    limit,
    totalPages,
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError('This route is not for password updates. Please use /updateMyPassword.', 400));
  }

  const filteredBody = filterObj(req.body, 'surname', 'name', 'email');
  if (req.file) filteredBody.photo = req.file.filename;

  const updatedClient = await Client.findByIdAndUpdate(req.client.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      client: updatedClient,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await Client.findByIdAndUpdate(req.client.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.clientImg = catchAsync(async (req, res, next) => {
  const filename = req.params.filename;
  const filePath = path.join(process.env.FILE_PATH, 'uploads/clients', filename);
  res.sendFile(filePath);
});

exports.clientEmail = catchAsync(async (req, res, next) => {
  const Email = require('../middlewares/email');

  const text = req.body.data.text;
  const subject = req.body.data.subject;
  const emailTo = req.body.data.email;
  const email = new Email(text, subject, emailTo);

  try {
    await email.send();
    res.status(200).json({ message: 'Email sended' });
    console.log('Email sended');
  } catch (error) {
    console.error('Error', error);
    res.status(500).json({ message: 'Error' });
  }
});

exports.createClient = catchAsync(async (req, res, next) => {
  try {
    req.body._id = new mongoose.Types.ObjectId();

    await Client.create(req.body);

    res.status(200).json({
      status: 'success',
      message: 'success',
    });
  } catch (err) {
    res.status(200).json({
      status: 'error',
      message: err.message,
    });
  }
});

exports.editClient = catchAsync(async (req, res, next) => {
  let client = await Client.findById(req.params.id);

  if (!client) {
    return next(new AppError('No document found with that ID', 404));
  }

  res.status(200).json({
    title: 'Edit client',
    status: 'success',
    client,
  });
});

exports.updateClient = catchAsync(async (req, res, next) => {
  try {
    const client = await Client.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!client) {
      return next(new AppError('No document found with that ID', 404));
    }
    res.status(200).json({
      status: 'success',
      message: 'success',
    });
  } catch (err) {
    res.status(200).json({
      status: 'error',
      message: err.message,
    });
  }
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  try {
    const { password, passwordConfirm } = req.body;

    console.log(password);
    console.log(passwordConfirm);

    if (password !== passwordConfirm) {
      return res.status(200).json({ status: 'error', message: 'Password not match' });
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const hashedPasswordConfirm = await bcrypt.hash(passwordConfirm, 10);

      const client = await Client.findByIdAndUpdate(
        req.params.id,
        { password: hashedPassword, passwordConfirm: hashedPasswordConfirm },
        {
          new: true,
          runValidators: true,
        }
      );

      res.status(200).json({
        status: 'success',
        message: 'success',
      });
    }
  } catch (err) {
    console.log(err.message);
    res.status(200).json({
      status: 'error',
      message: err.message,
    });
  }
});

exports.editPassword = catchAsync(async (req, res, next) => {
  let query = await Client.findById(req.params.id);
  const doc = await query;
  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }
});

exports.photoClient = catchAsync(async (req, res, next) => {
  const client = await Client.findById(req.params.id).select('photo');

  if (!client) {
    return next(new AppError('No document found with that ID', 404));
  }

  res.status(200).json({
    title: 'Photo client',
    status: 'success',
    client,
  });
});

exports.updatePhotoClient = catchAsync(async (req, res, next) => {
  if (req.file) {
    req.body.photo = req.file.filename;
  }
  console.log('req.body.photo');
  console.log(req.body.photo);
  const doc = await Client.findByIdAndUpdate(req.params.id, req.body);

  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }
  res.status(200).json({
    title: 'Photo client',
    status: 'success',
    photo: req.file.filename,
  });
});

exports.deleteClient = catchAsync(async (req, res, next) => {
  const client = await Client.findByIdAndDelete(req.params.id);
  if (!client) {
    return next(new AppError('No document found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
  });
});
