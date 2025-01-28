const User = require('./../models/userModel.js');
const APIFeatures = require('./../utils/apiFeatures.js');
const catchAsync = require('./../utils/catchAsync.js');
const appError = require('./../utils/appError.js');
const filteredOb = (obj, ...allowedObj) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedObj.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

exports.getAllUsers = catchAsync(async (req, res) => {
  const users = await User.find();
  res.status(200).json({
    status: 'success',
    result: users.length,
    data: {
      users
    }
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  //return and error if the user tries to update the password through this route
  if (req.body.password || req.body.passwordConfrim) {
    return next(
      new appError(
        `this route is not for updating password. Please try /updateMyPassword for this.`,
        400
      )
    );
  }

  //update anything else that is requested according to what is allowed to it
  const filteredObj = filteredOb(req.body, 'name', 'email');
  const updateUser = await User.findByIdAndUpdate(req.user.id, filteredObj, {
    new: true,
    runValidators: true
  });
  res.status(200).json({ status: 'success', user: updateUser });
});
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null
  });
});
exports.createUser = (req, res) => {
  res
    .status(500)
    .json({ status: 'err', message: 'this field is not yet defined' });
};
exports.getUser = (req, res) => {
  res
    .status(500)
    .json({ status: 'err', message: 'this field is not yet defined' });
};
exports.updateUser = (req, res) => {
  res
    .status(500)
    .json({ status: 'err', message: 'this field is not yet defined' });
};
exports.deleteUser = (req, res) => {
  res
    .status(500)
    .json({ status: 'err', message: 'this field is not yet defined' });
};
