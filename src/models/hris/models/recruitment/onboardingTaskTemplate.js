"use strict";

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const OnboardingTaskTemplate = sequelize.define(
  "OnboardingTaskTemplate",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    label: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    category: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },

    days_relative: {
      type: DataTypes.SMALLINT,
      allowNull: false,
    },

    sort_order: {
      type: DataTypes.SMALLINT,
      allowNull: false,
    },
  },
  {
    tableName: "onboarding_task_templates",
    underscored: true,
    timestamps: false,
  },
);

module.exports = OnboardingTaskTemplate;
