const mongoose = require('mongoose');
const moment = require('moment');
const Task = require('../models/taskModel');
const Comment = require('../models/commentModel');
const File = require('../models/fileModel');
const Activity = require('../models/activityModel');
const Project = require('../models/projectModel');
const AppError = require('../middlewares/error');
const catchAsync = require('../middlewares/catchAsync');

exports.setProjectUserIds = (req, res, next) => {
  if (!req.body.project) req.body.project_id = req.params.projectId;
  if (!req.body.user) req.body.user_id = req.user.id;
  next();
};

exports.getAllTasks = catchAsync(async (req, res, next) => {
  let filterData = {
    project_id: new mongoose.Types.ObjectId(req.params.id),
  };
  console.log(req.params.id);
  if (req.query.key) {
    const regex = new RegExp(req.query.key, 'i');
    filterData = { project_id: req.params.id, name: { $regex: regex } };
  }
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 10;
  const skip = (page - 1) * limit;

  const tasks = await Task.aggregate(
    [
      {
        $match: filterData,
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
      {
        $lookup: {
          from: 'activities',
          let: { task_id: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$task_id', '$$task_id'] },
              },
            },
            {
              $project: {
                _id: 1,
                name: 1,
                status: 1,
                lastUpdate: 1,
              },
            },
          ],
          as: 'activities',
        },
      },
    ],
    {
      debug: true,
    }
  );

  const formattedTasks = tasks.map((task) => {
    const formattedDate = moment(task.createdAt).format('DD/MM/YYYY');
    const formattedDeadline = moment(task.deadline).format('DD/MM/YYYY');
    return { ...task, formattedDate, formattedDeadline };
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
    const task = await Task.findOne({ _id: req.params.id })
      .populate('project_id')
      .populate('owner', 'name surname photo');

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

exports.createTask = catchAsync(async (req, res, next) => {
  try {
    req.body._id = new mongoose.Types.ObjectId();
    req.body.owner = res.locals.user._id;
    await Task.create(req.body);

    res.status(200).json({
      title: 'Create task',
      create: 'success',
    });
  } catch (err) {
    res.status(200).json({
      title: 'Create project',
      formData: req.body,
      message: err.message,
    });
  }
});

exports.editTask = catchAsync(async (req, res, next) => {
  let query = await Task.findById(req.params.id).populate({
    path: 'project_id',
    select: 'name _id',
  });

  const task = await query;

  if (!task) {
    return next(new AppError('No document found with that ID', 404));
  }

  const formattedDeadline = moment(task.deadline).format('YYYY-MM-DD');

  res.status(200).json({
    title: 'Edit task',
    task,
    deadline: formattedDeadline,
    projectId: task.project_id,
  });
});

exports.updateTask = catchAsync(async (req, res, next) => {
  const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!task) {
    return next(new AppError('No document found with that ID', 404));
  }
  res.status(200).json({
    status: 'success',
  });
});

exports.deleteTask = catchAsync(async (req, res, next) => {
  const task = await Task.findByIdAndDelete(req.params.id);
  if (!task) {
    return next(new AppError('No document found with that ID', 404));
  }
  res.status(200).json({
    status: 'success',
  });
});
