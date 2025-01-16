const User = require('./../models/userModel.js');
const APIFeatures = require('./../utils/apiFeatures.js');
const catchAsync = require('./../utils/catchAsync.js');
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
