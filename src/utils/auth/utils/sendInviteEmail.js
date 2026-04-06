"use strict";

const { Resend } = require("resend");
const { generateInviteEmailHtml } = require("../templates/inviteEmail");

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Sends a user invitation email via Resend.
 *
 * @param {Object} options
 * @param {string} options.toEmail           - Recipient email address
 * @param {string} options.toName            - Recipient full name
 * @param {string} options.temporaryPassword - Auto-generated temporary password
 * @param {string} options.inviteLink        - URL to accept the invitation
 */
const sendInviteEmail = async ({ toEmail, toName, temporaryPassword, inviteLink }) => {
  const html = generateInviteEmailHtml({ toName, temporaryPassword, inviteLink });

  const { error } = await resend.emails.send({
    from: `${process.env.RESEND_FROM_NAME} <${process.env.RESEND_FROM_EMAIL}>`,
    to: [toEmail],
    subject: "You've been invited to BCS Workspace",
    html,
  });

  if (error) {
    throw new Error(`Resend failed: ${error.message}`);
  }
};

module.exports = { sendInviteEmail };