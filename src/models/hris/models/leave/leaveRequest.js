"use strict";

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const LeaveRequest = sequelize.define(
  "LeaveRequest",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    employee_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    leave_type_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    total_days: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },

    reason: {
      type: DataTypes.TEXT,
    },

    status: {
      type: DataTypes.STRING,
      defaultValue: "pending",
    },
  },
  {
    tableName: "leave_requests",
    timestamps: true,
  },
);

module.exports = LeaveRequest;
