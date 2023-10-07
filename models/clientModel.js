const mongoose = require('mongoose');
const validator = require('validator');

const clientSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: [true, 'Enter company name'],
    trim: true,
  },
  name: {
    type: String,
    required: [true, 'Enter name'],
    trim: true,
  },
  surname: {
    type: String,
    required: [true, 'Enter surname'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Enter email'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: [validator.isEmail, 'Enter a valid email'],
  },
  photo: {
    type: String,
    trim: true,
  },
});

const Client = mongoose.model('Client', clientSchema);

module.exports = Client;
