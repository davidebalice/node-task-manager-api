const mongoose = require('mongoose');
const moment = require('moment');
const sharp = require('sharp');
const Task = require('../models/taskModel');
const Comment = require('../models/commentModel');
const File = require('../models/fileModel');
const Activity = require('../models/activityModel');
const Project = require('../models/projectModel');
const factory = require('./handlerFactory');
const AppError = require('../middlewares/error');
const catchAsync = require('../middlewares/catchAsync');
const ApiQuery = require('../middlewares/apiquery');
const fs = require('fs');
const path = require('path');
const { ObjectId } = require('mongodb');

exports.setProjectUserIds = (req, res, next) => {
  if (!req.body.project) req.body.project_id = req.params.projectId;
  if (!req.body.user) req.body.user_id = req.user.id;
  next();
};

exports.getAllTasks = catchAsync(async (req, res, next) => {
  let filterData = { project_id: req.params.id };
  if (req.query.key) {
    const regex = new RegExp(req.query.key, 'i');
    filterData = { project_id: req.params.id, name: { $regex: regex } };
  }
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 10;
  const skip = (page - 1) * limit;
  const tasks = await Task.find(filterData).sort('-createdAt').skip(skip).limit(limit);

  const formattedTasks = tasks.map((task) => {
    const formattedDate = moment(task.createdAt).format('DD/MM/YYYY');
    const formattedDeadline = moment(task.deadline).format('DD/MM/YYYY');
    return { ...task._doc, formattedDate, formattedDeadline };
  });

  const count = await Task.countDocuments();
  const totalPages = Math.ceil(count / limit);
  let message = '';
  if (req.query.m) {
    if (req.query.m === '1') {
      message = 'Task added';
    } else if (req.query.m === '2') {
      message = 'Task deleted';
    }
  }

  res.status(200).json({
    title: 'Tasks',
    tasks: formattedTasks,
  });
});

exports.getTask = catchAsync(async (req, res, next) => {
  try {
    let filterData = { task_id: req.params.id };
    if (req.query.key) {
      const regex = new RegExp(req.query.key, 'i');
      filterData = { project_id: req.params.id, name: { $regex: regex } };
    }

    const activities = await Activity.find(filterData).sort('-createdAt');
    const comments = await Comment.find(filterData).sort('-createdAt');
    const files = await File.find(filterData).sort('-createdAt');
    const task = await Task.findOne({ _id: req.params.id }).populate('project_id');

    const formattedActivity = activities.map((activity) => {
      const formattedDate = moment(activity.createdAt).format('DD/MM/YYYY');
      const formattedDeadline = moment(activity.deadline).format('DD/MM/YYYY');
      return { ...activity._doc, formattedDate, formattedDeadline };
    });

    const countActivity = await Activity.countDocuments();
    const countComments = await Comment.countDocuments();
    const countFiles = await File.countDocuments();

    res.status(200).json({
      title: 'Task detail',
      activities: formattedActivity,
      task,
      comments,
      files,
      countActivity,
      countComments,
      countFiles,
    });
  } catch (err) {
    res.status(200).json({
      message: err.message,
    });
  }
});

exports.editTask = catchAsync(async (req, res, next) => {
  let query = await Task.findById(req.params.id)
    .populate({
      path: 'project_id',
      select: 'name _id',
    })
    .populate({
      path: 'user_id',
      select: 'name surname _id',
    });

  const doc = await query;

  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }

  const formattedDate = moment(doc.createdAt).format('DD/MM/YYYY HH:mm');
  doc.user_id.name = doc.user_id.name.charAt(0).toUpperCase() + doc.user_id.name.slice(1).toLowerCase();
  doc.user_id.surname = doc.user_id.surname.charAt(0).toUpperCase() + doc.user_id.surname.slice(1).toLowerCase();

  let message = '';
  res.render('Tasks/edit', {
    status: 200,
    title: 'Edit task',
    formData: {
      ...doc.toObject(),
      createdAt: formattedDate,
    },
    message: message,
  });
});

exports.updateTask = catchAsync(async (req, res, next) => {
  const doc = await Task.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }
  res.redirect(doc._id);
});

exports.deleteTask = catchAsync(async (req, res, next) => {
  const doc = await Task.findByIdAndDelete(req.params.id);
  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }
  res.redirect('/tasks?m=2');
});
