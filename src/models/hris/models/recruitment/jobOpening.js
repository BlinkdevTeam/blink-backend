"use strict";

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const JobOpening = sequelize.define(
  "JobOpening",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },

    department_id: {
      type: DataTypes.UUID,
    },

    employment_type: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },

    location: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    salary_min: {
      type: DataTypes.BIGINT,
    },

    salary_max: {
      type: DataTypes.BIGINT,
    },

    headcount: {
      type: DataTypes.SMALLINT,
      defaultValue: 1,
    },

    filled_count: {
      type: DataTypes.SMALLINT,
      defaultValue: 0,
    },

    priority: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },

    description: DataTypes.TEXT,

    requirements: DataTypes.TEXT,

    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },

    posted_on: {
      type: DataTypes.DATEONLY,
    },

    deadline: {
      type: DataTypes.DATEONLY,
    },

    created_by: {
      type: DataTypes.UUID,
    },

    deleted_at: DataTypes.DATE,
  },
  {
    tableName: "job_openings",
    underscored: true,
    timestamps: true,
  },
);

module.exports = JobOpening;
