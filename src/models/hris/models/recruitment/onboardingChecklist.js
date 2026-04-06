"use strict";

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const OnboardingChecklist = sequelize.define(
  "OnboardingChecklist",
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

    employee_id: DataTypes.UUID,

    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    completed_at: DataTypes.DATE,
  },
  {
    tableName: "onboarding_checklists",
    underscored: true,
    timestamps: true,
  },
);

module.exports = OnboardingChecklist;
