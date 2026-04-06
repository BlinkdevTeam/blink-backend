"use strict";

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const Candidate = sequelize.define(
  "Candidate",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    first_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    last_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    phone: DataTypes.STRING(30),

    source: DataTypes.STRING(50),
  },
  {
    tableName: "candidates",
    underscored: true,
    timestamps: true,
  },
);

module.exports = Candidate;
