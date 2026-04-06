"use strict";

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const RolePermission = sequelize.define(
  "RolePermission",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    role_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "roles",
        key: "id",
      },
    },

    module: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    permission: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "role_permissions",
    timestamps: true,
    underscored: true,
  },
);

module.exports = RolePermission;
