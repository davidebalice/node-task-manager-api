const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Insert title of file'],
    },
    file: {
      type: String,
      required: [true, 'Insert file'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    project_id: {
      type: mongoose.Schema.ObjectId,
      ref: 'Project',
      required: [true, 'File must belong to a project'],
    },
    task_id: {
      type: mongoose.Schema.ObjectId,
      ref: 'Task',
      required: [true, 'File must belong to a task'],
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

fileSchema.index({ owner: 1 });
fileSchema.index({ task_id: 1 });

fileSchema.pre('find', function (next) {
  this.populate('owner', 'name surname photo email role');
  next();
});

fileSchema.pre('findOne', function (next) {
  this.populate('owner', 'name surname photo email role');
  next();
});

fileSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.model.findOne();
  next();
});

const File = mongoose.model('File', fileSchema);

module.exports = File;
