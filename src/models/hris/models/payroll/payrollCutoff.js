"use strict";

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const PayrollCutoff = sequelize.define(
  "PayrollCutoff",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    name: {
      type: DataTypes.STRING,
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

    pay_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    status: {
      type: DataTypes.STRING,
      defaultValue: "pending",
    },
  },
  {
    tableName: "payroll_cutoffs",
    timestamps: true,
  },
);

module.exports = PayrollCutoff;
