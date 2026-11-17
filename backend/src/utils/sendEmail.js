const transport = require("../config/nodemailer");

const sendEmail = async (to, subject, html) => {
  await transport.sendMail({
    from: process.env.Email_User,
    to,
    subject,
    html,
  });
};

module.exports = sendEmail;
