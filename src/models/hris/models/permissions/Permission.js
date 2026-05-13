"use strict";

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../../config/database");

const Permission = sequelize.define(
  "Permission",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    group_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    code: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
    },

    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    description: {
      type: DataTypes.TEXT,
    },

    module: {
      type: DataTypes.STRING(100),
    },

    action: {
      type: DataTypes.STRING(100),
    },

    scope: {
      type: DataTypes.STRING(100),
    },
  },
  {
    tableName: "permissions",
    underscored: true,
    timestamps: true,
  },
);

module.exports = Permission;
