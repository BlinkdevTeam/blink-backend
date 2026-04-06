"use strict";

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const CompanyProfile = sequelize.define(
  "CompanyProfile",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    company_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    industry: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    company_size: {
      type: DataTypes.STRING, // could also be ENUM or INTEGER depending on your needs
      allowNull: false,
    },
  },
  {
    tableName: "company_profiles",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    paranoid: true,
    deletedAt: "deleted_at",
  },
);

module.exports = CompanyProfile;
