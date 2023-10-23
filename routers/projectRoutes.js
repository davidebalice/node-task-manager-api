const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const authController = require('../controllers/authController');
const demoMode = require('../middlewares/demo_mode');
const User = require('../models/userModel');

router.route('/').get(authController.protect, async function (req, res) {
  const users = await User.find().limit(6);
  res.render('Dashboard/index', { users: users });
});

router.route('/projects').get(authController.protect, projectController.getProjects);

router
  .route('/add/project')
  .get(authController.protect, projectController.addProject)
  .post(demoMode, authController.protect, projectController.createProject);

router.route('/project/:id').get(demoMode, authController.protect, projectController.getProject);

router
  .route('/edit/project/:id')
  .get(demoMode, authController.protect, projectController.editProject)
  .post(demoMode, authController.protect, projectController.updateProject);

router.route('/project/members/:id').get(demoMode, authController.protect, projectController.membersProject);

router.route('/add/member/project/').post(demoMode, authController.protect, projectController.AddMemberProject);

router.route('/remove/member/project/').post(demoMode, authController.protect, projectController.RemoveMemberProject);

router
  .route('/project/photo/:id')
  .post(
    demoMode,
    authController.protect,
    projectController.uploadImage,
    projectController.resizeImage,
    projectController.updatePhoto
  );

router
  .route('/project/gallery/:id')
  .post(
    demoMode,
    authController.protect,
    projectController.uploadGallery,
    projectController.resizeGallery,
    projectController.updateGallery
  );

router
  .route('/project/delete/:id')
  .post(demoMode, authController.protect, projectController.deleteProject);

router
  .route('/gallery/delete')
  .post(demoMode, authController.protect, projectController.deleteGallery);

router
  .route('/active/project/:id')
  .post(demoMode, authController.protect, projectController.activeProject);

router
  .route('/project/cover/:filename')
  .get(authController.protect, projectController.cover);

module.exports = router;
