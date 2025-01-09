const mongoose = require('mongoose');
const validator = require('validator');
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'please tell enter the name!'],
    unique: true
  },
  email: {
    type: String,
    required: [true, 'Enter the email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'please enter a valid email']
  },
  photo: String,
  password: {
    type: String,
    required: [true, ' enter your password '],
    unique: true,
    minlength: 8
  },
  passwordConfirm: {
    type: String,
    required: [true, ' confirm password '],
    unique: true
  }
});
const User = mongoose.model('User', userSchema);
module.exports = User;
