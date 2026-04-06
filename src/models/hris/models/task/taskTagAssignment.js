"use strict";

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const TaskTagAssignment = sequelize.define(
  "TaskTagAssignment",
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

    tag_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    tableName: "task_tag_assignments",
    underscored: true,
    timestamps: false,
  },
);

module.exports = TaskTagAssignment;
