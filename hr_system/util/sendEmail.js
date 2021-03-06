const nodemailer = require("nodemailer");
const nodemailerSendgrid = require("nodemailer-sendgrid");
require("dotenv").config();

const sendEmail = async (workemail,personalEmail, subject, text) => {
  try {
    const transport = nodemailer.createTransport(
      nodemailerSendgrid({
        apiKey: process.env.SENDGRID_API_KEY,
      })
    );
    await transport.sendMail({
      from: "aditya007547@gmail.com",
      to: workemail, personalEmail,
      subject: subject,
      text: text,
    });
  } catch (err) {
    console.error(err.response.body);
  }
};
module.exports = sendEmail;
