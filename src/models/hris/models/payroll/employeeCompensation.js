"use strict";

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const EmployeeCompensation = sequelize.define(
  "EmployeeCompensation",
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

    compensation_package_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    effective_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    status: {
      type: DataTypes.STRING,
      defaultValue: "active",
    },
  },
  {
    tableName: "employee_compensations",
    timestamps: true,
  },
);

module.exports = EmployeeCompensation;
