const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Insert name of activity'],
    },
    status: {
      type: String,
      enum: ['Done', 'In progress'],
      default: 'In progress',
    },
    priority: {
      type: String,
      enum: ['High', 'Medium', 'Low', 'Urgent'],
      default: 'Medium',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    lastUpdate: {
      type: Date,
      default: null,
    },
    deadline: {
      type: Date,
      default: null,
    },
    project_id: {
      type: mongoose.Schema.ObjectId,
      ref: 'Project',
      required: [true, 'Activity must belong to a project'],
    },
    task_id: {
      type: mongoose.Schema.ObjectId,
      ref: 'Task',
      required: [true, 'Activity must belong to a task'],
    },
    owner: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Task must belong to a user'],
    },
    lastUpdateUser: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

activitySchema.index({ owner: 1 });
activitySchema.index({ task_id: 1 });

activitySchema.pre('find', function (next) {
  this.populate('owner', 'name surname email role photo');
  next();
});

activitySchema.pre('findOne', function (next) {
  this.populate('owner', 'name surname email role photo');
  next();
});

activitySchema.pre('find', function (next) {
  this.populate('lastUpdateUser', 'name surname email role photo');
  next();
});

activitySchema.pre('findOne', function (next) {
  this.populate('lastUpdateUser', 'name surname email role');
  next();
});

activitySchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.model.findOne();
  next();
});

const Activity = mongoose.model('Activity', activitySchema);

module.exports = Activity;
