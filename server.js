const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './.env' });

process.on('uncaughtException', err => {
  console.error('Uncaught Exception:', err.message);

  console.log('Shutting down server due to uncaught exception...');
  console.log('Server closed. Exiting process...');
  process.exit(1); // Exit with failure code
});

const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(() => console.log('DB connection successful!'));

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

// HANDLING UNHANDLED REJECTIONS
process.on('unhandledRejection', reason => {
  if (reason instanceof Error) {
    console.error('Unhandled Rejection:', reason.message); // Short error message
  } else {
    console.error('Unhandled Rejection:', reason); // Handle non-error reasons
  }
  console.log('Closing server gracefully...');
  server.close(() => {
    console.log('Server closed. Exiting process.');
    process.exit(1); // Exit with failure
  });
});
