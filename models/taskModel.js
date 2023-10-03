const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Insert description text of task'],
    },
    description: {
      type: String,
    },
    status: {
      type: String,
      enum: ['Open', 'Close'],
      default: 'Open',
    },
    priority: {
      type: String,
      enum: ['High', 'Medium', 'Low', 'Urgent'],
      default: 'Medium',
    },
    label: {
      type: String,
      enum: ['Task', 'Bug', 'Quote'],
      default: 'Task',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    deadline: {
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
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

taskSchema.index({ owner: 1 });
taskSchema.index({ project_id: 1 });

taskSchema.pre('find', function (next) {
  this.populate('members', 'name surname email role').populate('project_id');
  next();
});

taskSchema.pre('findOne', function (next) {
  this.populate('members', 'name surname email role').populate('project_id');
  next();
});

taskSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.model.findOne();
  next();
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
