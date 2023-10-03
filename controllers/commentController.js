const mongoose = require('mongoose');
const moment = require('moment');
const sharp = require('sharp');
const Task = require('../models/taskModel');
const Comment = require('../models/commentModel');
const Project = require('../models/projectModel');
const factory = require('./handlerFactory');
const AppError = require('../middlewares/error');
const catchAsync = require('../middlewares/catchAsync');
const ApiQuery = require('../middlewares/apiquery');
const fs = require('fs');
const path = require('path');
const { ObjectId } = require('mongodb');

exports.getComments = catchAsync(async (req, res, next) => {
  try {
    let filterData = { task_id: req.params.id };
    if (req.query.key) {
      const regex = new RegExp(req.query.key, 'i');
      filterData = { project_id: req.params.id, name: { $regex: regex } };
    }

    const comments = await Comment.find(filterData).sort('-createdAt');
    const task = await Task.findOne({ _id: req.params.id }).populate('project_id');

    const formattedComment = comments.map((comment) => {
      const formattedDate = moment(comment.createdAt).format('DD/MM/YYYY');
      const formattedDeadline = moment(comment.deadline).format('DD/MM/YYYY');
      return { ...comment._doc, formattedDate, formattedDeadline };
    });

    formattedComment.sort((a, b) => b.createdAt - a.createdAt);

    const count = await Comment.countDocuments();

    res.status(200).json({
      title: 'Comments',
      countComments: count,
      comments: formattedComment,
      task,
    });
  } catch (err) {
    res.status(200).json({
      message: err.message,
    });
  }
});

async function getCommentsData(res, taskId, title, status) {
  try {
    let filterData = { task_id: taskId };
    const comments = await Comment.find(filterData).sort('-createdAt');
    res.status(200).json({
      title: title,
      status: status,
      comments,
    });
  } catch (err) {
    console.error(err);
    throw err;
  }
}

exports.createComment = catchAsync(async (req, res, next) => {
  try {
    req.body._id = new mongoose.Types.ObjectId();
    req.body.owner = res.locals.user._id;
    await Comment.create(req.body);

    await getCommentsData(res, req.body.task_id, 'Comment created', 'success');
  } catch (err) {
    await getCommentsData(res, req.body.task_id, 'Comment error', 'error');
  }
});

exports.deleteComment = catchAsync(async (req, res, next) => {
  console.log(req.body.id);
  const doc = await Comment.findByIdAndDelete(req.body.id);
  await getCommentsData(res, req.body.task_id, 'Comment deleted', 'success');
  if (!doc) {
    await getCommentsData(res, req.body.task_id, 'Comment error', 'error');
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


*/
