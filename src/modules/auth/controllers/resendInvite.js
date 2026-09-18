// ────────────────────────────────
// RESEND INVITE / FORCE PASSWORD RESET
// POST /api/users/:id/resend-invite
//
// Generates a fresh temp password + invite token,
// saves them on the HrisUser row, and fires the email.
// ────────────────────────────────
exports.resendInvite = async (req, res, next) => {
  try {
    const { id } = req.params; // this is employee_id (UUID)

    // ── Find the HrisUser by employee_id ──
    const user = await HrisUser.findOne({ where: { employee_id: id } });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // ── Pull the employee record so we have name + email ──
    const employee = await Employee.findByPk(id);

    if (!employee) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    }

    // ── Generate fresh credentials ──
    const temporaryPassword = crypto.randomBytes(6).toString("base64url");
    const inviteToken = crypto.randomBytes(32).toString("hex");
    const inviteLink = `${process.env.APP_BASE_URL}/accept-invite?token=${inviteToken}`;
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    // ── Persist on hris_users ──
    await user.update({
      password_hash: hashedPassword,
      invite_token: inviteToken,
      must_change_password: true, // force reset on next login
    });

    // ── Also flag the employees row so auth middleware picks it up ──
    await Employee.update({ must_change_password: true }, { where: { id } });

    // ── Fire the email ──
    const fullName = `${employee.first_name} ${employee.last_name}`;

    await sendInviteEmail({
      toEmail: employee.email,
      toName: fullName,
      temporaryPassword,
      inviteLink,
    });

    return res.json({
      success: true,
      message: `Invite resent to ${employee.email}`,
    });
  } catch (err) {
    next(err);
  }
};
