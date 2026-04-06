"use strict";

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const TaskTimeLog = sequelize.define(
  "TaskTimeLog",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    task_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    employee_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    start_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    end_time: DataTypes.DATE,
    duration_minutes: DataTypes.INTEGER,

    notes: DataTypes.TEXT,
  },
  {
    tableName: "task_time_logs",
    underscored: true,
    timestamps: true,
  },
);

module.exports = TaskTimeLog;
