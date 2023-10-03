const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    comment: {
      type: String,
      required: [true, 'Insert text of comment'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    lastUpdate: {
      type: Date,
      default: null,
    },
    project_id: {
      type: mongoose.Schema.ObjectId,
      ref: 'Project',
      required: [true, 'Comment must belong to a project'],
    },
    task_id: {
      type: mongoose.Schema.ObjectId,
      ref: 'Task',
      required: [true, 'Comment must belong to a task'],
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

commentSchema.index({ owner: 1 });
commentSchema.index({ task_id: 1 });

commentSchema.pre('find', function (next) {
  this.populate('owner', 'name surname email role');
  next();
});

commentSchema.pre('findOne', function (next) {
  this.populate('owner', 'name surname email role');
  next();
});

commentSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.model.findOne();
  next();
});

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
