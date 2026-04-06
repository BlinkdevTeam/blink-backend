"use strict";

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const RefreshToken = sequelize.define(
  "RefreshToken",
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
    // hris or tasks — separate sessions per app
    // logging out of HRIS does not affect Tasks session
    app: {
      type: DataTypes.STRING(10),
      allowNull: false,
      validate: {
        isIn: [["hris", "tasks"]],
      },
    },
    // only the SHA-256 hash is stored — never the raw token
    token_hash: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    // set on logout or token rotation
    revoked_at: {
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
    tableName: "refresh_tokens",
    timestamps: false,
    underscored: true,
  }
);

module.exports = RefreshToken;