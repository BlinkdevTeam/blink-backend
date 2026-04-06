"use strict";

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const PipelineStage = sequelize.define(
  "PipelineStage",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    job_opening_id: {
      type: DataTypes.UUID,
    },

    label: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    color: DataTypes.STRING(10),

    icon: DataTypes.STRING(10),

    sort_order: {
      type: DataTypes.SMALLINT,
      allowNull: false,
    },
  },
  {
    tableName: "pipeline_stages",
    underscored: true,
    timestamps: true,
  },
);

module.exports = PipelineStage;
