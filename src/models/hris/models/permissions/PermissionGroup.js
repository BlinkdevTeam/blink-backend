"use strict";

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../../config/database");

const PermissionGroup = sequelize.define(
  "PermissionGroup",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },

    description: {
      type: DataTypes.TEXT,
    },
  },
  {
    tableName: "permission_groups",
    underscored: true,
    timestamps: true,
  },
);

module.exports = PermissionGroup;
