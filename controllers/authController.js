const crypto = require('crypto');
const { promisify } = require('util');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync.js');
const jwt = require('jsonwebtoken');
const appError = require('./../utils/appError');
const app = require('../app');
const sendMail = require('../utils/email');
const { createRequire } = require('module');
const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createToken = (user, statuscode, res) => {
  const token = signToken(user._id);
  res.status(statuscode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
    passwordResetToken: req.body.passwordResetToken,
    tokenExpiryTime: req.body.tokenExpiryTime
  });
  createToken(newUser, 201, res);
});
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password)
    return next(new appError('Please provide email and password', 400));
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new appError('Incorrect email or password', 401));
  }
  createToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1. Get token from request headers
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  console.log('Token:', token);

  if (!token) {
    console.log('No token found');
    return next(
      new appError('You are not logged in! Please log in to get access.', 401)
    );
  }

  // 2. Verify token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  //3.check if user exists
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(
      new appError(
        'This user belonging to this token does no longer exist.',
        401
      )
    );
  }
  //4. check if the user changed the password or not
  if (freshUser.changedPasswordAt(decoded.iat)) {
    return next(
      new appError('User recently changed password! Please login again', 401)
    );
  }
  req.user = freshUser;
  next(); // Pass control to the next middleware/route
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new appError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new appError('There is no such email in the system', 404));
  }
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  //send it to user's email
  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/restPassword/${resetToken}`;
    const message = `Forgot your password? Submit  a PATCH request with new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password please ignore this email!`;
    await sendMail({
      email: user.email,
      subject: 'your password reset token(valid for 10 minutes',
      message
    });
    res.status(200).json({ status: 'success', message: `Token sent to email` });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.tokenExpiryTime = undefined;
    await user.save({ validateBeforeSave: false });
    next(
      new appError(
        `There was an error sending mail.Please try again later!`,
        500
      )
    );
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  //get user based on the token
  const hashToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashToken,
    tokenExpiryTime: { $gt: Date.now() }
  });
  //if token has not expired,and there is a user,set the new password
  if (!user) {
    return next(new appError(`Token is invalid or has expired`, 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.tokenExpiryTime = undefined;
  await user.save();

  //update changedPasswordAt property for the user
  //we do this step in the pre save middleware

  //log the user in and send JWT
  createToken(user, 200, res);
});
exports.updatePassword = catchAsync(async (req, res, next) => {
  //get user from collection
  const user = await User.findById(req.user.id).select('+password');
  //check if posted current password is correct or not
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new appError('The current password is incorrect'));
  }

  // if so update the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  createToken(user, 200, res);
});
