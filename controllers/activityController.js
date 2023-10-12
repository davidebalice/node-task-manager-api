const mongoose = require('mongoose');
const moment = require('moment');
const sharp = require('sharp');
const Task = require('../models/taskModel');
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
    activity.lastUpdate = new Date();
    activity.lastUpdateUser = res.locals.user._id;
    
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
    req.body.lastUpdateUser = res.locals.user._id;
    req.body.lastUpdate = new Date();
    await Activity.create(req.body);

    await getActivityData(res, req.body.task_id, 'Activity created', 'success');
  } catch (err) {
    await getActivityData(res, req.body.task_id, 'Activity error', 'error');
  }
});

exports.deleteActivity = catchAsync(async (req, res, next) => {
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

    const activity = await Activity.findOne({ _id: activityId });

    if (!activity) {
      return res.status(404).json({
        message: 'Activity not found',
      });
    }

    activity.name = name;
    activity.lastUpdate = new Date();
    activity.lastUpdateUser = res.locals.user._id;
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
