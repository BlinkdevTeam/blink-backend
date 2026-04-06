"use strict";

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const OnboardingTask = sequelize.define(
  "OnboardingTask",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    checklist_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    template_id: DataTypes.UUID,

    label: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    category: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },

    due_date: DataTypes.DATEONLY,

    is_done: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    done_at: DataTypes.DATE,

    done_by: DataTypes.UUID,
  },
  {
    tableName: "onboarding_tasks",
    underscored: true,
    timestamps: false,
  },
);

module.exports = OnboardingTask;
