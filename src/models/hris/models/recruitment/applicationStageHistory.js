"use strict";

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const ApplicationStageHistory = sequelize.define(
  "ApplicationStageHistory",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    application_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    from_stage_id: DataTypes.UUID,

    to_stage_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    moved_by: {
      type: DataTypes.UUID,
    },

    moved_at: {
      type: DataTypes.DATE,
    },

    note: DataTypes.TEXT,
  },
  {
    tableName: "application_stage_history",
    underscored: true,
    timestamps: false,
  },
);

module.exports = ApplicationStageHistory;
