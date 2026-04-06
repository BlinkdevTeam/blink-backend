"use strict";

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const Project = sequelize.define(
  "Project",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    description: DataTypes.TEXT,

    start_date: DataTypes.DATEONLY,
    end_date: DataTypes.DATEONLY,

    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },

    created_by: DataTypes.UUID,
    deleted_at: DataTypes.DATE,
  },
  {
    tableName: "projects",
    underscored: true,
    timestamps: true,
  },
);

module.exports = Project;
