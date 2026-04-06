import nodemailer from "nodemailer";

export async function sendPasswordResetEmail(to, firstName, resetUrl) {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  const mailOptions = {
    from: `"HRIS System" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Reset Your HRIS Password",
    html: `
      <h2>Hello ${firstName},</h2>
      <p>You requested a password reset. Click the link below to set a new password:</p>
      <p><a href="${resetUrl}">Reset Password</a></p>
      <p>This link will expire in 1 hour.</p>
      <br/>
      <p>If you didn't request this, please ignore this email.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
}
