"use strict";

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const AttendanceRecord = sequelize.define(
  "AttendanceRecord",
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

    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    time_in: {
      type: DataTypes.TIME,
      allowNull: true,
    },

    time_out: {
      type: DataTypes.TIME,
      allowNull: true,
    },

    status: {
      type: DataTypes.STRING,
      defaultValue: "present",
    },

    remarks: {
      type: DataTypes.STRING,
    },
  },
  {
    tableName: "attendance_records",
    timestamps: true,
  },
);

module.exports = AttendanceRecord;
