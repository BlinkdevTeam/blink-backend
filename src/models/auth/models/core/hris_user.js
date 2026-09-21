"use strict";

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../../config/database");

// NOTE — invite tokens are intentionally NOT stored on this model.
// Only a SHA-256 hash of the invite/reset token is persisted, in
// PasswordResetToken.token_hash (type = "invite"). Do not add a
// raw `invite_token` column here — see usersController.js
// createInviteToken() / invite() / resendInvite().
const HrisUser = sequelize.define(
  "HrisUser",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    employee_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: "employees",
        key: "id",
      },
    },

    role_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "roles",
        key: "id",
      },
    },

    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },

    granted_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },

    granted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    revoked_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },

    revoked_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "hris_users",
    timestamps: false,
  },
);

module.exports = HrisUser;
