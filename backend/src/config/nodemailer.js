const nodemailer = require("nodemailer");

const transport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.Email_User,
    pass: process.env.Email_Password,
  },
});

module.exports = transport;
