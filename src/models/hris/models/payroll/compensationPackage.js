"use strict";

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const CompensationPackage = sequelize.define(
  "CompensationPackage",
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

    basic_salary: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },

    allowance: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },

    bonus: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },

    description: {
      type: DataTypes.TEXT,
    },
  },
  {
    tableName: "compensation_packages",
    timestamps: true,
  },
);

module.exports = CompensationPackage;
