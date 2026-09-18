"use strict";

const nodemailer = require("nodemailer");
const { generateInviteEmailHtml } = require("../utils/inviteEmail");

/**
 * Sends a user invitation email via Nodemailer + Gmail.
 *
 * Requires in .env:
 *   GMAIL_USER         — your Gmail address
 *   GMAIL_APP_PASSWORD — 16-char Gmail App Password (spaces OK)
 *
 * @param {Object} options
 * @param {string} options.toEmail    - Recipient email address
 * @param {string} options.toName     - Recipient full name
 * @param {string} options.inviteLink - Set-password URL (/login?token=...)
 */
const sendInviteEmail = async ({ toEmail, toName, inviteLink }) => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn(
      "[sendInviteEmail] GMAIL_USER or GMAIL_APP_PASSWORD is not set — skipping email send.",
    );
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD.replace(/\s/g, ""),
    },
  });

  const html = generateInviteEmailHtml({ toName, inviteLink });

  await transporter.sendMail({
    from: `"BCS Workspace" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: "You've been invited to BCS Workspace",
    html,
  });

  console.log(`[sendInviteEmail] Invite sent to ${toEmail}`);
};

module.exports = { sendInviteEmail };
