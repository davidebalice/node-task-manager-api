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

exports.updateComment = catchAsync(async (req, res, next) => {
  try {
    const commentId = req.body.id;
    const name = req.body.name;

    console.log(commentId);
    console.log(name);

    const comment = await Comment.findOne({ _id: commentId });

    if (!comment) {
      return res.status(404).json({
        message: 'Comment not found',
      });
    }

    comment.comment = name;
    try {
      await comment.save();
    } catch (error) {
      console.error('Error:', error);
    }

    await getCommentsData(res, comment.task_id, 'Comment created', 'success');
  } catch (err) {
    await getCommentsData(res, comment.task_id, 'Comment error', 'error');
  }
});