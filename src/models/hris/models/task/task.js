"use strict";

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const Task = sequelize.define(
  "Task",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    project_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    description: DataTypes.TEXT,

    assigned_to: DataTypes.UUID,

    priority: {
      type: DataTypes.STRING(10),
    },

    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },

    start_date: DataTypes.DATEONLY,
    due_date: DataTypes.DATEONLY,
    completed_at: DataTypes.DATE,

    created_by: DataTypes.UUID,
    deleted_at: DataTypes.DATE,
  },
  {
    tableName: "tasks",
    underscored: true,
    timestamps: true,
  },
);

module.exports = Task;
