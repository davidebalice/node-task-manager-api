const mongoose = require('mongoose');
const multer = require('multer');
const multerStorage = multer.memoryStorage();
const moment = require('moment');
const sharp = require('sharp');
const Task = require('../models/taskModel');
const File = require('../models/fileModel');
const Project = require('../models/projectModel');
const factory = require('./handlerFactory');
const AppError = require('../middlewares/error');
const catchAsync = require('../middlewares/catchAsync');
const ApiQuery = require('../middlewares/apiquery');
const fs = require('fs');
const path = require('path');
const { ObjectId } = require('mongodb');

exports.getFile = catchAsync(async (req, res, next) => {
  try {
    let filterData = { task_id: req.params.id };
    if (req.query.key) {
      const regex = new RegExp(req.query.key, 'i');
      filterData = { project_id: req.params.id, name: { $regex: regex } };
    }
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 10;
    const skip = (page - 1) * limit;
    const files = await File.find(filterData).sort('-createdAt').skip(skip).limit(limit);
    const task = await Task.findOne({ _id: req.params.id }).populate('project_id');

    const formattedFile = files.map((file) => {
      const formattedDate = moment(file.createdAt).format('DD/MM/YYYY');
      const formattedDeadline = moment(file.deadline).format('DD/MM/YYYY');
      return { ...file._doc, formattedDate, formattedDeadline };
    });

    const count = await File.countDocuments();
    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      title: 'File',
      files: formattedFile,
      task,
    });
  } catch (err) {
    res.status(200).json({
      message: err.message,
    });
  }
});

async function getFilesData(res, taskId, title, status) {
  try {
    let filterData = { task_id: taskId };
    const files = await File.find(filterData).sort('-createdAt');
    res.status(200).json({
      title: title,
      status: status,
      files,
    });
  } catch (err) {
    console.error(err);
    throw err;
  }
}

exports.createFile = catchAsync(async (req, res, next) => {
  try {
    req.body._id = new mongoose.Types.ObjectId();
    req.body.owner = res.locals.user._id;
    /*
    console.log('req.body.name');
    console.log(req.body.name);
    console.log('req.body.file');
    console.log(req.body.files);
    console.log('req.file');
    console.log(req.file);
    console.log('req.files');
    console.log(req.files);

    console.log('req.files');
    console.log(req.files);
*/
    /*
  res.status(200).json({
      reqtest: 'test',
      reqfiles: req.files,
      reqbodyfiles: req.body.files,
      reqbodyname: req.body.name,
      reqbody: req.body,
    });


*/

    console.log(req.body.task_id);
    console.log(req.body.project_id);

    const fileNames = req.files.map((file) => file.originalname);
    console.log(fileNames);

    for (const file of req.files) {
      const tempPath = file.path;
      const destinationPath = path.join('./uploads', file.filename);
      fs.renameSync(tempPath, destinationPath);
    }

    for (const fileName of req.files) {
      const tempPath = fileName.path;
      const destinationPath = path.join('./uploads', fileName.filename);
      const fileParts = destinationPath.split('/');
      const newFileName = fileParts[fileParts.length - 1].replace('uploads\\', '');
      console.log(newFileName);
      console.log(newFileName);
      const file = await File.create({
        name: req.body.name,
        file: newFileName,
        owner: req.body.owner,
        task_id: req.body.task_id,
        project_id: req.body.project_id,
        owner: res.locals.user._id,
      });
    }

    await getFilesData(res, req.body.task_id, 'File created', 'success');
  } catch (err) {
    console.log(err);
    //await getFilesData(res, req.body.task_id, 'File error', 'error');
  }
});

exports.deleteFile = catchAsync(async (req, res, next) => {
  console.log(req.body.id);
  const doc = await File.findByIdAndDelete(req.body.id);
  await getFilesData(res, req.body.task_id, 'File deleted', 'success');
  if (!doc) {
    await getFilesData(res, req.body.task_id, 'File error', 'error');
  }
});

exports.updateFile = catchAsync(async (req, res, next) => {
  try {
    const fileId = req.body.id;
    const name = req.body.name;

    console.log(fileId);
    console.log(name);

    const file = await File.findOne({ _id: fileId });

    if (!file) {
      return res.status(404).json({
        message: 'File not found',
      });
    }

    file.name = name;
    try {
      await file.save();
    } catch (error) {
      console.error('Error:', error);
    }

    await getFilesData(res, file.task_id, 'File created', 'success');
  } catch (err) {
    await getFilesData(res, file.task_id, 'File error', 'error');
  }
});
/*
exports.uploadImage = upload.fields([{ name: 'imageCover', maxCount: 1 }]);
exports.uploadGallery = upload.fields([{ name: 'images', maxCount: 6 }]);
*/
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
