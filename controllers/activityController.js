const mongoose = require('mongoose');
const moment = require('moment');
const sharp = require('sharp');
const Task = require('../models/taskModel');
const Activity = require('../models/activityModel');
const Comment = require('../models/commentModel');
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

async function getActivityData(res, taskId, title, status) {
  try {
    let filterData = { task_id: taskId };
    const activities = await Activity.find(filterData).sort('-createdAt');
    const formattedActivity = await activities.map((activity) => {
      const formattedDate = moment(activity.createdAt).format('DD/MM/YYYY');
      const formattedDeadline = moment(activity.deadline).format('DD/MM/YYYY');
      return { ...activity._doc, formattedDate, formattedDeadline };
    });
    console.log(formattedActivity);
    res.status(200).json({
      title: title,
      status: status,
      activities: formattedActivity,
    });
  } catch (err) {
    console.error(err);
    throw err;
  }
}

exports.getAllActivities = catchAsync(async (req, res, next) => {
  try {
    let filterData = { task_id: req.params.id };
    if (req.query.key) {
      const regex = new RegExp(req.query.key, 'i');
      filterData = { project_id: req.params.id, name: { $regex: regex } };
    }
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 10;
    const skip = (page - 1) * limit;
    const activities = await Activity.find(filterData).sort('-createdAt').skip(skip).limit(limit);
    const comments = await Comment.find({ task_id: req.params.id }).sort('-createdAt');
    const task = await Task.findOne({ _id: req.params.id }).populate('project_id');

    const formattedActivity = activities.map((activity) => {
      const formattedDate = moment(activity.createdAt).format('DD/MM/YYYY');
      const formattedDeadline = moment(activity.deadline).format('DD/MM/YYYY');
      return { ...activity._doc, formattedDate, formattedDeadline };
    });

    const count = await Activity.countDocuments();
    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      title: 'Task detail',
      activities: formattedActivity,
      task,
      comments,
    });
  } catch (err) {
    res.status(200).json({
      message: err.message,
    });
  }
});

exports.updateStatus = catchAsync(async (req, res, next) => {
  try {
    const activityId = req.body.activityId;
    const checked = req.body.checked;
    const activity = await Activity.findOne({ _id: activityId });

    if (!activity) {
      return res.status(404).json({
        message: 'Activity not found',
      });
    }

    activity.status = checked ? 'Done' : 'In progress';
    try {
      await activity.save();
    } catch (error) {
      console.error('Error:', error);
    }

    let message;
    activity.status = checked ? (message = 'Done') : (message = 'In progress');

    res.status(200).json({
      status: message,
    });
  } catch (err) {
    res.status(200).json({
      message: err.message,
    });
  }
});

exports.createActivity = catchAsync(async (req, res, next) => {
  try {
    req.body._id = new mongoose.Types.ObjectId();
    req.body.owner = res.locals.user._id;
    await Activity.create(req.body);

    await getActivityData(res, req.body.task_id, 'Activity created', 'success');
  } catch (err) {
    await getActivityData(res, req.body.task_id, 'Activity error', 'error');
  }
});

exports.deleteActivity = catchAsync(async (req, res, next) => {
  console.log(req.body.id);
  const doc = await Activity.findByIdAndDelete(req.body.id);
  await getActivityData(res, req.body.task_id, 'Activity deleted', 'success');
  if (!doc) {
    await getActivityData(res, req.body.task_id, 'Activity error', 'error');
  }
});

exports.updateActivity = catchAsync(async (req, res, next) => {
  try {
    const activityId = req.body.id;
    const name = req.body.name;

    console.log(activityId);
    console.log(name);

    const activity = await Activity.findOne({ _id: activityId });

    if (!activity) {
      return res.status(404).json({
        message: 'Activity not found',
      });
    }

    activity.name = name;
    try {
      await activity.save();
    } catch (error) {
      console.error('Error:', error);
    }

    await getActivityData(res, activity.task_id, 'Activity created', 'success');
  } catch (err) {
    await getActivityData(res, activity.task_id, 'Activity error', 'error');
  }
});

/*
exports.getTask = factory.getOne(Task);

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
*/
