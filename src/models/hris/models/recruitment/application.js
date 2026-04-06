"use strict";

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const Application = sequelize.define(
  "Application",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    candidate_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    job_opening_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    stage_id: {
      type: DataTypes.UUID,
    },

    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },

    rating: DataTypes.SMALLINT,

    notes: DataTypes.TEXT,

    applied_at: {
      type: DataTypes.DATE,
    },
  },
  {
    tableName: "applications",
    underscored: true,
    timestamps: false,
  },
);

module.exports = Application;
