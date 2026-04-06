"use strict";

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const Offset = sequelize.define(
  "Offset",
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

    hours: {
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

    approved_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    tableName: "offsets",
    timestamps: true,
  },
);

module.exports = Offset;
