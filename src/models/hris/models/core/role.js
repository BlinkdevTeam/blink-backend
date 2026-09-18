"use strict";

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../../config/database");

// models/role.js
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

    code: {
      // ← ADD THIS
      type: DataTypes.STRING,
      allowNull: true,
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
