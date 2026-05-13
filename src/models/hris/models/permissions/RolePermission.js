"use strict";

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../../config/database");

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
    },

    permission_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    tableName: "role_permissions",
    underscored: true,
    timestamps: true,
    updatedAt: false,

    indexes: [
      {
        unique: true,
        fields: ["role_id", "permission_id"],
      },
    ],
  },
);

module.exports = RolePermission;
