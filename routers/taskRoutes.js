const express = require('express');
const taskController = require('../controllers/taskController');
const authController = require('../controllers/authController');
const demoMode = require('../middlewares/demo_mode');
const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router.route('/tasks/:id').get(authController.protect, taskController.getAllTasks);

router.route('/task/:id').get(demoMode, authController.protect, taskController.getTask);

router.route('/add/task').post(demoMode, authController.protect, taskController.createTask);

router
  .route('/edit/task/:id')
  .get(demoMode, authController.protect, taskController.editTask)
  .post(demoMode, authController.protect, taskController.updateTask);

router.route('/task/delete/:id').post(demoMode, authController.protect, taskController.deleteTask);

router.route('/task/members/:id').post(demoMode, authController.protect, taskController.members);

router.route('/add/member/task/').post(demoMode, authController.protect, taskController.AddMemberTask);

router.route('/remove/member/task/').post(demoMode, authController.protect, taskController.RemoveMemberTask);

module.exports = router;
