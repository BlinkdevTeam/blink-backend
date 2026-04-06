"use strict";

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const OtUtRecord = sequelize.define(
  "OtUtRecord",
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

    type: {
      type: DataTypes.STRING,
      allowNull: false,
      // OT = Overtime
      // UT = Undertime
    },

    hours: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },

    reason: {
      type: DataTypes.STRING,
    },

    status: {
      type: DataTypes.STRING,
      defaultValue: "pending",
    },
  },
  {
    tableName: "ot_ut_records",
    timestamps: true,
  },
);

module.exports = OtUtRecord;
