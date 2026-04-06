"use strict";

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const PasswordResetToken = sequelize.define(
  "PasswordResetToken",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    employee_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "employees",
        key: "id",
      },
    },
    token_hash: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
    },
    // invite = new employee setting password for first time
    // reset  = existing employee who forgot their password
    type: {
      type: DataTypes.STRING(10),
      allowNull: false,
      validate: {
        isIn: [["invite", "reset"]],
      },
    },
    // invite tokens expire in 72 hours
    // reset tokens expire in 1 hour
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    // set when consumed — one time use only
    used_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "password_reset_tokens",
    timestamps: false,
    underscored: true,
  }
);

module.exports = PasswordResetToken;