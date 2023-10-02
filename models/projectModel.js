const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project must have a name'],
      unique: true,
      trim: true,
      maxlength: ['100', 'max 100 characters'],
      minlength: ['6', 'min 6 characters'],
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'Project must have a summary'],
    },
    description: {
      type: String,
      trim: true,
      required: [true, 'Project must have a description'],
    },
    imageCover: {
      type: String,
      trim: true,
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    owner: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Project must belong to a user owner'],
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    client: {
      type: mongoose.Schema.ObjectId,
      ref: 'Client',
    },
    budget: {
      type: Number,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

projectSchema.virtual('tasks', {
  ref: 'Task',
  foreignField: 'project_id',
  localField: '_id',
});

projectSchema.pre('find', function (next) {
  this.populate('members.user');
  next();
});

projectSchema.pre('find', function (next) {
  this.populate('members', 'name surname email role');
  next();
});

projectSchema.pre('findOne', function (next) {
  this.populate('members', 'name surname email role');
  next();
});

projectSchema.post('save', (doc, next) => {
  next();
});

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
