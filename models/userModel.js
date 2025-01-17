const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please enter the name!'],
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Enter the email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please enter a valid email']
  },
  photo: String,

  role: {
    type: String,
    enum: ['admin', 'user', 'lead-guide', 'guide'],
    default: 'user'
  },

  password: {
    type: String,
    required: [true, 'Enter your password'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      // This validator only runs on CREATE and SAVE!!!
      validator: function(el) {
        return el === this.password;
      },
      message: 'Passwords are not the same!'
    },
    select: false
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  tokenExpiryTime: Date
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only run if password is actually modified
  if (!this.isModified('password')) return next();

  // Hash password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Set passwordConfirm to undefined so it won't be stored in DB
  this.passwordConfirm = undefined;

  next();
});

// Instance method to check if provided password is correct
userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAt = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(this.passwordChangedAt.getTime() / 1000);
    return changedTimeStamp > JWTTimestamp;
  }
  //this means there were not change in password
  return false;
};
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.tokenExpiryTime = Date.now() + 10 * 60 * 1000;
  console.log({ resetToken }, this.passwordResetToken, this.tokenExpiryTime);
  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
