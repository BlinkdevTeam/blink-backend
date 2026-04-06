"use strict";

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const Interview = sequelize.define(
  "Interview",
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

    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },

    scheduled_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    interviewer_id: DataTypes.UUID,

    interviewer_name: DataTypes.STRING(150),

    meeting_link: DataTypes.TEXT,

    notes: DataTypes.TEXT,

    feedback: DataTypes.TEXT,

    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
  },
  {
    tableName: "interviews",
    underscored: true,
    timestamps: true,
  },
);

module.exports = Interview;
