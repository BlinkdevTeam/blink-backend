"use strict";

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../../config/database");

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
      references: {
        model: "employees",
        key: "id",
      },
    },

    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "present",
      // present, remote, late, absent, on_leave
    },

    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    time_in: {
      type: DataTypes.TIME,
      allowNull: true,
    },

    break_out: {
      type: DataTypes.TIME,
      allowNull: true,
    },

    break_in: {
      type: DataTypes.TIME,
      allowNull: true,
    },

    break_duration_mins: {
      type: DataTypes.SMALLINT,
      allowNull: true,
      // computed: break_in - break_out, in minutes
    },

    time_out: {
      type: DataTypes.TIME,
      allowNull: true,
    },

    net_hours: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: true,
      // computed: gross hours minus break
    },
  },
  {
    tableName: "attendance_records",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["employee_id", "date"],
      },
    ],
  },
);

module.exports = AttendanceRecord;
