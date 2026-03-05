const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS
  }
});

async function sendOTP(email, otp) {
  await transporter.sendMail({
    from: process.env.EMAIL,
    to: email,
    subject: "Verify Your Account",
    html: `<h2>Your verification code: ${otp}</h2>`
  });
}

module.exports =  sendOTP ;