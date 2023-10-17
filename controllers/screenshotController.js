const mongoose = require('mongoose');
const multer = require('multer');
const multerStorage = multer.memoryStorage();
const moment = require('moment');
const sharp = require('sharp');
const Task = require('../models/taskModel');
const Screenshot = require('../models/screenshotModel');
const Project = require('../models/projectModel');
const factory = require('./handlerFactory');
const AppError = require('../middlewares/error');
const catchAsync = require('../middlewares/catchAsync');
const ApiQuery = require('../middlewares/apiquery');
const fs = require('fs');
const path = require('path');
const { ObjectId } = require('mongodb');

exports.getScreenshot = catchAsync(async (req, res, next) => {
  try {
    let filterData = { task_id: req.params.id };
    if (req.query.key) {
      const regex = new RegExp(req.query.key, 'i');
      filterData = { project_id: req.params.id, name: { $regex: regex } };
    }
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 10;
    const skip = (page - 1) * limit;
    const screenshots = await Screenshot.find(filterData).sort('-createdAt').skip(skip).limit(limit);
    const task = await Task.findOne({ _id: req.params.id }).populate('project_id');

    const formattedScreenshot = screenshots.map((screenshot) => {
      const formattedDate = moment(screenshot.createdAt).format('DD/MM/YYYY');
      const formattedDeadline = moment(screenshot.deadline).format('DD/MM/YYYY');
      return { ...screenshot._doc, formattedDate, formattedDeadline };
    });

    const count = await Screenshot.countDocuments();
    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      title: 'Screenshot',
      screenshots: formattedScreenshot,
      task,
    });
  } catch (err) {
    res.status(200).json({
      message: err.message,
    });
  }
});

async function getScreenshotsData(res, taskId, title, status) {
  try {
    let filterData = { task_id: taskId };
    const screenshots = await Screenshot.find(filterData).sort('-createdAt');
    res.status(200).json({
      title: title,
      status: status,
      screenshots,
    });
  } catch (err) {
    console.error(err);
    throw err;
  }
}

exports.createScreenshot = catchAsync(async (req, res, next) => {
  try {
    req.body._id = new mongoose.Types.ObjectId();
    req.body.owner = res.locals.user._id;

    const screenshotNames = req.files.map((file) => file.originalname);

    for (const file of req.files) {
      const tempPath = file.path;
      const destinationPath = path.join('./uploads/screenshots', file.filename);
      fs.renameSync(tempPath, destinationPath);
    }

    for (const fileName of req.files) {
      const tempPath = fileName.path;

      const screenshot = await Screenshot.create({
        name: req.body.name,
        file: fileName.filename,
        owner: req.body.owner,
        task_id: req.body.task_id,
        project_id: req.body.project_id,
        owner: res.locals.user._id,
      });
    }

    await getScreenshotsData(res, req.body.task_id, 'Screenshot created', 'success');
  } catch (err) {
    console.log(err);
    await getScreenshotsData(res, req.body.task_id, 'Screenshot error', 'error');
  }
});

exports.deleteScreenshot = catchAsync(async (req, res, next) => {
  const doc = await Screenshot.findByIdAndDelete(req.body.id);

  try {
    fs.unlinkSync(`./uploads/screenshot/${doc.file}`);
  } catch (err) {
    console.error('Error:', err);
  }

  await getScreenshotsData(res, req.body.task_id, 'Screenshot deleted', 'success');
  if (!doc) {
    await getScreenshotsData(res, req.body.task_id, 'Screenshot error', 'error');
  }
});

exports.updateScreenshot = catchAsync(async (req, res, next) => {
  try {
    const screenshotId = req.body.id;
    const name = req.body.name;

    console.log(screenshotId);
    console.log(name);

    const screenshot = await Screenshot.findOne({ _id: screenshotId });

    if (!screenshot) {
      return res.status(404).json({
        message: 'Screenshot not found',
      });
    }

    screenshot.name = name;
    try {
      await screenshot.save();
    } catch (error) {
      console.error('Error:', error);
    }

    await getScreenshotsData(res, screenshot.task_id, 'Screenshot created', 'success');
  } catch (err) {
    await getScreenshotsData(res, screenshot.task_id, 'Screenshot error', 'error');
  }
});

exports.download = catchAsync(async (req, res, next) => {
  const filename = req.params.filename;
  const filePath = path.join(process.env.FILE_PATH, 'uploads/screenshots', filename);

  res.download(filePath, (err) => {
    if (err) {
      res.status(500).json({ error: 'Error download file.' });
    }
  });
});

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

exports.screenshotImg = catchAsync(async (req, res, next) => {
  const filename = req.params.filename;
  const filePath = path.join(process.env.FILE_PATH, 'uploads/screenshots', filename);
  res.sendFile(filePath);
});
