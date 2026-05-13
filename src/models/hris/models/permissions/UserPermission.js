"use strict";

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../../config/database");

const UserPermission = sequelize.define(
  "UserPermission",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    permission_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    allowed: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "user_permissions",
    underscored: true,
    timestamps: true,
    updatedAt: false,

    indexes: [
      {
        unique: true,
        fields: ["user_id", "permission_id"],
      },
    ],
  },
);

module.exports = UserPermission;
