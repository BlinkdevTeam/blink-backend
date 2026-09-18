"use strict";

/**
 * Generates the HTML body for the user invitation email.
 * No temporary password is included — the user sets their own
 * password by clicking the link.
 *
 * @param {Object} options
 * @param {string} options.toName    - Recipient's full name
 * @param {string} options.inviteLink - Set-password URL
 * @returns {string}
 */
const generateInviteEmailHtml = ({ toName, inviteLink }) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>You're Invited</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);padding:40px 48px 36px;">
              <p style="margin:0 0 16px;font-size:13px;letter-spacing:3px;text-transform:uppercase;color:#94a3b8;font-weight:600;">BCS Workspace</p>
              <h1 style="margin:0;font-size:28px;font-weight:700;color:#f8fafc;line-height:1.3;">You've been<br/>invited to join.</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 48px 32px;">
              <p style="margin:0 0 24px;font-size:16px;color:#475569;line-height:1.7;">
                Hi <strong style="color:#1e293b;">${toName}</strong>,
              </p>
              <p style="margin:0 0 32px;font-size:15px;color:#475569;line-height:1.7;">
                Your HR team has created an account for you on the BCS Workspace.
                Click the button below to set your password and get started.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${inviteLink}" target="_blank"
                      style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#3b82f6,#2563eb);color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;border-radius:8px;letter-spacing:0.3px;">
                      Set My Password →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:28px 0 0;font-size:13px;color:#94a3b8;text-align:center;line-height:1.6;">
                Or copy and paste this link into your browser:<br/>
                <a href="${inviteLink}" style="color:#3b82f6;word-break:break-all;">${inviteLink}</a>
              </p>

              <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;text-align:center;">
                This link will expire once used. If you didn't expect this email, you can safely ignore it.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 48px;">
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
                You received this email because your HR team added you to BCS Workspace.
                If you weren't expecting this, you can safely ignore this message.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

module.exports = { generateInviteEmailHtml };
