const { promisify } = require('util');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync.js');
const jwt = require('jsonwebtoken');
const appError = require('./../utils/appError');
const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt
  });
  const token = signToken(newUser._id);
  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: newUser
    }
  });
});
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password)
    return next(new appError('Please provide email and password', 400));
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new appError('Incorrect email or password', 401));
  }
  const token = signToken(user._id);
  res.status(200).json({
    status: 'success',
    token
  });
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
