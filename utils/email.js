const nodemailer = require('nodemailer');

const sendMail = async options => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  });
  //define the email options
  const mailOptions = {
    from: 'Sahil Khatri <admin@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message
    //html
  };

  //actually send the mail
  await transporter.sendMail(mailOptions);
};
module.exports = sendMail;
