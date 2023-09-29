const mongoose = require('mongoose');
const slugify = require('slugify');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category must have a name'],
      unique: true,
    },
    description: {
      type: String,
    },
    slug: { type: String, unique: true, trim: true },
    imageCover: {
      type: String,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    active: {
      type: Boolean,
      default: true,
    },
    order: { type: Number, required: true, default: 1 },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

categorySchema.index({ slug: 1 });

categorySchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

categorySchema.post('save', (doc, next) => {
  next();
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
