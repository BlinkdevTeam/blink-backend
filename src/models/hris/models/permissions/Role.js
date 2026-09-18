"use strict";

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../../config/database");

const Role = sequelize.define(
  "Role",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },

    // ── Added: was missing, caused 500 on create/lookup ──
    code: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },

    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    is_system: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    tableName: "roles",
    timestamps: true,
    underscored: true,
  },
);

module.exports = Role;
