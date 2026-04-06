"use strict";

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const RefreshToken = sequelize.define(
  "RefreshToken",
  {
    id: {
      type:          DataTypes.UUID,
      defaultValue:  DataTypes.UUIDV4,
      primaryKey:    true,
    },
    employee_id: {
      type:      DataTypes.UUID,
      allowNull: false,
      references: { model: "employees", key: "id" },
    },
    token_hash: {
      type:      DataTypes.TEXT,
      allowNull: false,
    },
    app: {
      type:      DataTypes.ENUM("hris", "tasks"),
      allowNull: false,
    },
    expires_at: {
      type:      DataTypes.DATE,
      allowNull: false,
    },
    revoked_at: {
      type:      DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName:   "refresh_tokens",
    timestamps:  true,
    underscored: true,
  }
);

module.exports = RefreshToken;