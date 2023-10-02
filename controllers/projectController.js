const multer = require('multer');
const mongoose = require('mongoose');
const sharp = require('sharp');
const Project = require('../models/projectModel');
const Task = require('../models/taskModel');
const Client = require('../models/clientModel');
const User = require('../models/userModel');
const ApiQuery = require('../middlewares/apiquery');
const AppError = require('../middlewares/error');
const catchAsync = require('../middlewares/catchAsync');
const factory = require('./handlerFactory');
const fs = require('fs');
const path = require('path');
const { ObjectId } = require('mongodb');
const multerStorage = multer.memoryStorage();
const { parseISO, format, startOfMonth, endOfMonth } = require('date-fns');

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

exports.uploadImage = upload.fields([{ name: 'imageCover', maxCount: 1 }]);
exports.uploadGallery = upload.fields([{ name: 'images', maxCount: 6 }]);

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

exports.getAllProjects = catchAsync(async (req, res, next) => {
  const userId = res.locals.user._id;
  const userRole = res.locals.user.role;

  let filterData = {};

  if (req.query.key) {
    const regex = new RegExp(req.query.key, 'i');
    filterData.name = { $regex: regex };
  }

  if (userRole === 'admin') {
    filterData.$or = [{ owner: userId }];
  } else {
    filterData.$or = [{ owner: userId }, { 'members.user': userId }];
  }

  const setLimit = 12;
  const limit = req.query.limit * 1 || setLimit;
  const page = req.query.page * 1 || 1;
  const skip = (page - 1) * limit;
  const projects = await Project.find(filterData).sort('-createdAt').skip(skip).limit(limit);
  const count = await Project.countDocuments();
  const totalPages = Math.ceil(count / limit);

  const formattedProjects = projects.map((project) => ({
    ...project._doc,
    formattedDate: format(new Date(project.createdAt), 'dd/MM/yyyy'),
  }));

  let message = '';
  if (req.query.m) {
    if (req.query.m === '1') {
      message = 'Project added';
    } else if (req.query.m === '2') {
      message = 'Project deleted';
    }
  }

  res.status(200).json({
    projects: formattedProjects,
    currentPage: page,
    page,
    limit,
    totalPages,
    message,
  });
});

exports.addProject = catchAsync(async (req, res, next) => {
  const clients = await Client.find({}).sort({ companyName: 1 });
  res.status(200).json({
    title: 'Add project',
    owner: res.locals.user._id,
    clients: clients.map((client) => ({
      _id: client._id,
      companyName: client.companyName,
    })),
  });
});

exports.createProject = catchAsync(async (req, res, next) => {
  try {
    req.body._id = new mongoose.Types.ObjectId();
    console.log(req.body);
    await Project.create(req.body);

    res.status(200).json({
      title: 'Create project',
      create: 'success',
    });
  } catch (err) {
    //const categories = await Category.find().sort({ order: 1 });

    res.status(200).json({
      title: 'Create project',
      formData: req.body,
      message: err.message,
    });
  }
});

exports.deleteProject = catchAsync(async (req, res, next) => {
  const doc = await Project.findByIdAndDelete(req.params.id);
  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }
  res.status(200).json({
    title: 'Delete project',
    create: 'success',
  });
});

exports.getProject = catchAsync(async (req, res, next) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    return next(new AppError('No document found with that ID', 404));
  }

  const tasks = await Task.find({ project_id: req.params.id }).sort({ createdAt: 1 });

  res.status(200).json({
    title: 'Project',
    project,
    tasks,
  });
});

exports.editProject = catchAsync(async (req, res, next) => {
  let query = await Project.findById(req.params.id);
  const doc = await query;

  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }
  const categories = await Category.find().sort({ order: 1 });

  let message = '';

  res.status(200).json({
    title: 'Edit project',
    formData: doc,
    message,
    categories,
  });
});

exports.updateProject = catchAsync(async (req, res, next) => {
  const doc = await Project.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }
  res.status(200).json({
    title: 'Update project',
    create: 'success',
  });
});

exports.membersProject = catchAsync(async (req, res, next) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    return next(new AppError('No document found with that ID', 404));
  }

  const allUsers = await User.find().sort({ surname: 1 });
  const memberUserIds = project.members.map((member) => member._id.toString());
  const filteredUsers = allUsers.filter((user) => !memberUserIds.includes(user._id.toString()));

  res.status(200).json({
    title: 'Project members',
    project,
    users: filteredUsers,
  });
});

exports.AddMemberProject = catchAsync(async (req, res, next) => {
  const project = await Project.findById(req.body.project_id);
  const member = await User.findById(req.body.member_id);

  if (!project || !member) {
    return next(new AppError('No document found with that ID', 404));
  }

  const memberIds = project.members.map((member) => member._id.toString());
  if (!memberIds.includes(member._id)) {
    const addMember = member._id;
    project.members.push(addMember);
    await project.save();
  }

  const allUsers = await User.find().sort({ surname: 1 });
  const memberUserIds = project.members.map((member) => member.toString());
  const filteredUsers = allUsers.filter((user) => !memberUserIds.includes(user._id.toString()));

  res.status(200).json({
    title: 'Project members',
    project,
    members: project.members,
    users: filteredUsers,
  });
});

exports.RemoveMemberProject = catchAsync(async (req, res, next) => {
  const project = await Project.findById(req.body.project_id).populate('members.user', 'name surname email role');
  const member = await User.findById(req.body.member_id);

  if (!project || !member) {
    return next(new AppError('No document found with that ID', 404));
  }

  const memberIds = project.members.map((member) => member._id.toString());

  console.log('memberIds');
  console.log(memberIds);
  console.log('member._id');
  console.log(member._id);

  if (memberIds.includes(member._id.toString())) {
    console.log('qui');
    const memberIndex = project.members.findIndex(
      (projectMember) => projectMember.toString() === member._id.toString()
    );
    console.log(memberIndex);
    project.members.splice(memberIndex, 1);
    await project.save();
  }

  const allUsers = await User.find().sort({ surname: 1 });
  const memberUserIds = project.members.map((member) => member.toString());
  const filteredUsers = allUsers.filter((user) => !memberUserIds.includes(user._id.toString()));

  res.status(200).json({
    title: 'Project members',
    project,
    members: project.members,
    users: filteredUsers,
  });
});

exports.photoProject = catchAsync(async (req, res, next) => {
  let query = await Project.findById(req.params.id);
  const doc = await query;
  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }
  let message = '';
  res.render('Projects/photo', {
    status: 200,
    title: 'Photo project',
    formData: doc,
    message: message,
  });
});

exports.updatePhoto = catchAsync(async (req, res, next) => {
  const doc = await Project.findByIdAndUpdate(req.params.id, req.body);
  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }
  //res.redirect('/project/photo/' + doc._id);
  res.status(200).json({
    title: 'Update photo',
    create: 'success',
  });
});

exports.updateGallery = catchAsync(async (req, res, next) => {
  const doc = await Project.updateOne({ _id: req.params.id }, { $push: { images: { $each: req.body.images } } });

  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }

  //res.redirect('/project/photo/' + req.params.id);
  res.status(200).json({
    title: 'Update gallery',
    create: 'success',
  });
});

exports.deleteGallery = catchAsync(async (req, res, next) => {
  let query = await Project.findById(req.body.id);
  const image = req.body.image;
  if (!image) {
    return next(new AppError('No document found with that ID', 404));
  }

  const index = query.images.indexOf(image);
  if (index > -1) {
    query.images.splice(index, 1);
  }

  const doc = await Project.updateOne({ _id: req.body.id }, { $set: { images: query.images } });

  let pathFile = path.join(__dirname, '/public/img/projects', image);
  pathFile = pathFile.replace('controllers', '');

  if (fs.existsSync(pathFile)) {
    fs.unlinkSync(pathFile);
    console.log('File deleted:', image);
  } else {
    console.log('File not exists:', image);
  }

  //res.redirect('/project/photo/' + req.body.id);
  res.status(200).json({
    title: 'Delete photo',
    create: 'success',
  });
});

exports.activeProject = catchAsync(async (req, res, next) => {
  const doc = await Project.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }
});
