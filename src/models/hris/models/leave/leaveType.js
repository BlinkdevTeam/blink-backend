"use strict";

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const LeaveType = sequelize.define(
  "LeaveType",
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

    description: {
      type: DataTypes.TEXT,
    },

    days_per_year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    is_paid: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "leave_types",
    timestamps: true,
  },
);

module.exports = LeaveType;
