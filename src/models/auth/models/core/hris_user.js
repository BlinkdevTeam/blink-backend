"use strict";

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../../config/database");

const HrisUser = sequelize.define(
  "HrisUser",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    employee_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: "employees",
        key: "id",
      },
    },

    // ✅ FIX: THIS MUST EXIST in DB
    role_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "roles",
        key: "id",
      },
    },

    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },

    granted_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },

    granted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    revoked_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },

    revoked_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "hris_users",
    timestamps: false,
  },
);

module.exports = HrisUser;
