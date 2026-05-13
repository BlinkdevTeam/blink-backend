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

    code: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },

    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },

    description: {
      type: DataTypes.TEXT,
    },

    is_system: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "roles",
    underscored: true,
    timestamps: true,
  },
);

module.exports = Role;
