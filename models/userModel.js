const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
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
    minlength: 8
  },
  passwordConfirm: {
    type: String,
    required: [true, ' confirm password '],
    validate: {
      validator: function(el) {
        return el === this.password;
      },
      message: 'Passwords are not the same'
    }
  }
});
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});
const User = mongoose.model('User', userSchema);
module.exports = User;
