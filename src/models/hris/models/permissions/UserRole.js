"use strict";

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../../config/database");

const UserRole = sequelize.define(
  "UserRole",
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

    role_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    tableName: "user_roles",
    underscored: true,
    timestamps: true,
    updatedAt: false,

    indexes: [
      {
        unique: true,
        fields: ["user_id", "role_id"],
      },
    ],
  },
);

module.exports = UserRole;
