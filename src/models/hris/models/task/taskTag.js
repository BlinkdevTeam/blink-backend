"use strict";

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const TaskTag = sequelize.define(
  "TaskTag",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    label: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    color: {
      type: DataTypes.STRING(10),
    },
  },
  {
    tableName: "task_tags",
    underscored: true,
    timestamps: true,
  },
);

module.exports = TaskTag;
