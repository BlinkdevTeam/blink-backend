"use strict";

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const AttendanceCorrection = sequelize.define(
  "AttendanceCorrection",
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

    attendance_record_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    requested_time_in: {
      type: DataTypes.TIME,
    },

    requested_time_out: {
      type: DataTypes.TIME,
    },

    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    status: {
      type: DataTypes.STRING,
      defaultValue: "pending",
    },
  },
  {
    tableName: "attendance_corrections",
    timestamps: true,
  },
);

module.exports = AttendanceCorrection;
