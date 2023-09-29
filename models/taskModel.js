const mongoose = require('mongoose');
const Project = require('./projectModel');

const taskSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: [true, 'Insert description text of task'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    project_id: {
      type: mongoose.Schema.ObjectId,
      ref: 'Project',
      required: [true, 'Task must belong to a project'],
    },
    owner: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Task must belong to a user'],
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        role: {
          type: String,
          enum: ['viewer', 'editor'],
          default: 'viewer',
        },
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

taskSchema.index({ task_id: 1, owner: 1 }, { unique: true });
taskSchema.index({ owner: 1 });
taskSchema.index({ project_id: 1 });

taskSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user_id',
    select: 'name surname photo',
  });
  next();
});

taskSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.model.findOne();
  next();
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
