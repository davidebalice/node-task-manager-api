const mongoose = require('mongoose');

const screenshotSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Insert title of screenshot'],
    },
    file: {
      type: String,
      required: [true, 'Insert screenshot file'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    project_id: {
      type: mongoose.Schema.ObjectId,
      ref: 'Project',
      required: [true, 'Screenshot must belong to a project'],
    },
    task_id: {
      type: mongoose.Schema.ObjectId,
      ref: 'Task',
      required: [true, 'Screenshot must belong to a task'],
    },
    owner: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Task must belong to a user'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

screenshotSchema.index({ owner: 1 });
screenshotSchema.index({ task_id: 1 });

screenshotSchema.pre('find', function () {
  this.populate('owner', 'name surname photo email role');
});

screenshotSchema.pre('findOne', function () {
  this.populate('owner', 'name surname photo email role');
});

screenshotSchema.pre(/^findOneAnd/, async function () {
  this.r = await this.model.findOne();
});

const Screenshot = mongoose.model('Screenshot', screenshotSchema);

module.exports = Screenshot;
