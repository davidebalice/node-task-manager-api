const Project = require('../models/projectModel');
const Task = require('../models/taskModel');
const Client = require('../models/clientModel');
const User = require('../models/userModel');
const Activity = require('../models/activityModel');
const catchAsync = require('../middlewares/catchAsync');

exports.dashboard = catchAsync(async (req, res, next) => {
  //const activities = await Project.find(filterData).sort('-createdAt').skip(skip).limit(limit);
  const projectsCount = await Project.countDocuments();
  const taskCount = await Task.countDocuments();
  const userCount = await User.countDocuments();
  const clientCount = await Client.countDocuments();

  res.status(200).json({
    projects: projectsCount,
    clients: clientCount,
    users: userCount,
    tasks: taskCount,
  });
});
