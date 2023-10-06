const User = require('../models/userModel');
const catchAsync = require('../middlewares/catchAsync');
const mongoose = require('mongoose');
const factory = require('./handlerFactory');
const AppError = require('../middlewares/error');
const multer = require('multer');
const sharp = require('sharp');
const multerStorage = multer.memoryStorage();
const path = require('path');
const bcrypt = require('bcrypt');

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

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/assets/images/users/${req.file.filename}`);

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
  req.params.id = req.user.id;
  next();
};

exports.getUsers = catchAsync(async (req, res, next) => {
  const userId = res.locals.user._id;
  const userRole = res.locals.user.role;

  let filterData = {};

  if (req.query.key) {
    const regex = new RegExp(req.query.key, 'i');
    filterData.name = { $regex: regex };
  }
  /*
  if (userRole === 'admin') {
    filterData.$or = [{ owner: userId }];
  } else {
    filterData.$or = [{ owner: userId }, { 'members.user': userId }];
  }
*/
  const setLimit = 12;
  const limit = req.query.limit * 1 || setLimit;
  const page = req.query.page * 1 || 1;
  const skip = (page - 1) * limit;
  const users = await User.find(filterData).sort({ role: 1, createdAt: -1 }).skip(skip).limit(limit);
  const count = await User.countDocuments();
  const totalPages = Math.ceil(count / limit);

  res.status(200).json({
    users,
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

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.userImg = catchAsync(async (req, res, next) => {
  const filename = req.params.filename;
  const filePath = path.join(process.env.FILE_PATH, 'uploads/users', filename);
  res.sendFile(filePath);
});

exports.userEmail = catchAsync(async (req, res, next) => {
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

exports.editUser = catchAsync(async (req, res, next) => {
  let query = await User.findById(req.params.id);

  const doc = await query;

  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }
  let message = '';
  res.render('Users/edit', {
    status: 200,
    title: 'Edit user',
    formData: doc,
    message: message,
  });
});

exports.updateUser = catchAsync(async (req, res, next) => {
  const doc = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }

  res.redirect(doc._id);
});

exports.photoUser = catchAsync(async (req, res, next) => {
  let query = await User.findById(req.params.id);

  const doc = await query;

  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }
  let message = '';
  res.render('User/photo', {
    status: 200,
    title: 'Photo user',
    formData: doc,
    message: message,
  });
});

exports.updatePhoto = catchAsync(async (req, res, next) => {
  req.body.photo = req.file.filename;
  const doc = await User.findByIdAndUpdate(req.params.id, req.body);

  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }
  res.redirect('/user/photo/' + doc._id);
});

exports.createUser = catchAsync(async (req, res, next) => {
  try {
    req.body._id = new mongoose.Types.ObjectId();
    const { password, passwordConfirm, name, surname, role, email } = req.body;

    if (password !== passwordConfirm) {
      return res.status(200).json({ status: 'error', message: 'Password not match' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedPasswordConfirm = await bcrypt.hash(passwordConfirm, 10);
    await User.create({ name, surname, role, email, password: hashedPassword, passwordConfirm: hashedPasswordConfirm });

    res.status(200).json({
      status: 'success',
      message: 'success',
    });
  } catch (err) {
    console.log(err);
    res.status(200).json({
      status: 'error',
      message: err.message,
    });
  }
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  const doc = await User.findByIdAndDelete(req.params.id);
  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }
  res.redirect('/users?m=2');
});

exports.editPassword = catchAsync(async (req, res, next) => {
  let query = await User.findById(req.params.id);
  const doc = await query;
  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }
  res.render('Users/password', {
    status: 200,
    title: 'Edit password',
    formData: doc,
    message: '',
  });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  try {
    const doc = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }
    const message = 'password updated';
    res.render('Users/password', {
      status: 200,
      title: 'Update password',
      formData: doc,
      message: message,
    });
  } catch (err) {
    const doc = await User.findById(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc) {
      // return next(new AppError('No document found with that ID', 404));
    }
    res.render('Users/password', {
      status: 200,
      title: 'Update password',
      formData: doc,
      message: err.message,
    });
  }
});

exports.photoUser = catchAsync(async (req, res, next) => {
  let query = await User.findById(req.params.id);

  // if (popOptions) query = query.populate(popOptions);
  const doc = await query;
  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }
  let message = '';
  res.render('Users/photo', {
    status: 200,
    title: 'Photo user',
    formData: doc,
    message: message,
  });
});
