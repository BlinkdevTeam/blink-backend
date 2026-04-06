"use strict";

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const ProjectMember = sequelize.define(
  "ProjectMember",
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

    employee_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    role: DataTypes.STRING(50),
  },
  {
    tableName: "project_members",
    underscored: true,
    timestamps: true,
  },
);

module.exports = ProjectMember;
