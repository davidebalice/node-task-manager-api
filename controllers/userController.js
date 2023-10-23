const User = require('../models/userModel');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const catchAsync = require('../middlewares/catchAsync');
const mongoose = require('mongoose');
const factory = require('./handlerFactory');
const AppError = require('../middlewares/error');
const multer = require('multer');
const multerStorage = multer.memoryStorage();
const sharp = require('sharp');
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

exports.uploadPhotoUser = upload.single('photo');

exports.resizePhotoUser = catchAsync(async (req, res, next) => {
  console.log(req.file);
  if (!req.file) return next();
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  console.log('req.file.filename');
  console.log(req.file.filename);
  console.log(`${process.env.FILE_PATH}/uploads/users/${req.file.filename}`);
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`${process.env.FILE_PATH}/uploads/users/${req.file.filename}`);

  next();
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getUserByToken = catchAsync(async (req, res, next) => {
  if (req.cookies.jwt || res.locals.token) {
    try {
      let token = '';
      if (req.cookies.jwt) {
        token = req.cookies.jwt;
      } else {
        token = res.locals.token;
      }

      const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select(
        '-passwordChangedAt -passwordResetExpires -createdAt -passwordResetToken -passwordConfirm'
      );

      console.log(user);
      if (!user) {
        res.status(400).json({
          status: 'error',
          message: 'error',
        });
      }

      if (user.changedPasswordAfter(decoded.iat)) {
        res.status(400).json({
          status: 'error',
          message: 'error',
        });
      }

      res.status(200).json({
        user,
        demo: global.demo,
      });
    } catch (err) {
      res.status(400).json({
        status: 'error',
        message: 'error:' + err,
      });
    }
  }
  next();
});

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

  const setLimit = 10;
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
    res.status(200).json({
      status: 'error',
      message: err.message,
    });
  }
});

exports.editUser = catchAsync(async (req, res, next) => {
  let user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError('No document found with that ID', 404));
  }

  res.status(200).json({
    title: 'Edit user',
    status: 'success',
    user,
  });
});

exports.updateUser = catchAsync(async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!user) {
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

      const user = await User.findByIdAndUpdate(
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
  let query = await User.findById(req.params.id);
  const doc = await query;
  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }
});

exports.photoUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('photo');

  if (!user) {
    return next(new AppError('No document found with that ID', 404));
  }

  res.status(200).json({
    title: 'Photo user',
    status: 'success',
    user,
  });
});

exports.updatePhotoUser = catchAsync(async (req, res, next) => {
  if (req.file) {
    req.body.photo = req.file.filename;
  }
  console.log('req.body.photo');
  console.log(req.body.photo);
  const doc = await User.findByIdAndUpdate(req.params.id, req.body);

  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }
  res.status(200).json({
    title: 'Photo user',
    status: 'success',
    photo: req.file.filename,
  });
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) {
    return next(new AppError('No document found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
  });
});

exports.profileUpdate = catchAsync(async (req, res, next) => {
  if (req.cookies.jwt || res.locals.token) {
    try {
      let token = '';
      if (req.cookies.jwt) {
        token = req.cookies.jwt;
      } else {
        token = res.locals.token;
      }

      const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

      const updatedUser = await User.findByIdAndUpdate(decoded.id, req.body, {
        new: true,
        runValidators: true,
      }).select('-passwordChangedAt -passwordResetExpires -createdAt');

      res.status(200).json({
        status: 'success',
        user: updatedUser,
      });
    } catch (err) {
      res.status(400).json({
        status: 'error',
        message: 'error:' + err,
      });
    }
  }
});

exports.profilePassword = catchAsync(async (req, res, next) => {
  if (req.cookies.jwt || res.locals.token) {
    try {
      let token = '';
      if (req.cookies.jwt) {
        token = req.cookies.jwt;
      } else {
        token = res.locals.token;
      }
      const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
      const { password, passwordConfirm } = req.body;

      if (password !== passwordConfirm) {
        return res.status(200).json({ status: 'error', message: 'Password not match' });
      } else {
        const hashedPassword = await bcrypt.hash(password, 10);
        const hashedPasswordConfirm = await bcrypt.hash(passwordConfirm, 10);

        const user = await User.findByIdAndUpdate(
          decoded.id,
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
  }
});

exports.updatePhotoUser = catchAsync(async (req, res, next) => {
  if (req.cookies.jwt || res.locals.token) {
    try {
      let token = '';
      if (req.cookies.jwt) {
        token = req.cookies.jwt;
      } else {
        token = res.locals.token;
      }
      const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
      const { password, passwordConfirm } = req.body;

      if (req.file) {
        req.body.photo = req.file.filename;
      }

      const user = await User.findByIdAndUpdate(
        decoded.id,
        { photo: req.body.photo },
        {
          new: true,
          runValidators: true,
        }
      );

      res.status(200).json({
        status: 'success',
        message: 'success',
        photo: req.body.photo,
      });
    } catch (err) {
      console.log(err.message);
      res.status(200).json({
        status: 'error',
        message: err.message,
      });
    }
  }
});
