"use strict";

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const SalaryHistory = sequelize.define(
  "SalaryHistory",
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

    previous_salary: {
      type: DataTypes.DECIMAL(12, 2),
    },

    new_salary: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },

    effective_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    reason: {
      type: DataTypes.STRING,
    },
  },
  {
    tableName: "salary_histories",
    timestamps: true,
  },
);

module.exports = SalaryHistory;
