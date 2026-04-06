"use strict";

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const Offer = sequelize.define(
  "Offer",
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

    offered_salary: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    expires_on: DataTypes.DATEONLY,

    sent_at: DataTypes.DATE,

    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },

    notes: DataTypes.TEXT,

    created_by: DataTypes.UUID,
  },
  {
    tableName: "offers",
    underscored: true,
    timestamps: true,
  },
);

module.exports = Offer;
