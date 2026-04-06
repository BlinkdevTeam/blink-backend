"use strict";

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

// ✅ Helper function (reusable + safe)
const getInitials = (first, last) => {
  return `${first?.[0] || ""}${last?.[0] || ""}`.toUpperCase();
};

const Employee = sequelize.define(
  "Employee",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    employee_code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },

    first_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    last_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    middle_name: {
      type: DataTypes.STRING(100),
    },

    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },

    personal_email: DataTypes.STRING,

    phone: DataTypes.STRING(30),

    // ✅ Will be auto-generated (no need from frontend)
    avatar_initials: {
      type: DataTypes.STRING(4),
      allowNull: true,
    },

    department_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "departments",
        key: "id",
      },
    },

    role_title: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    employment_type: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },

    status: {
      type: DataTypes.STRING(30),
      defaultValue: "active",
    },

    hire_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    end_date: DataTypes.DATEONLY,

    password_hash: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    last_login_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },

    must_change_password: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },

    manager_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "employees",
        key: "id",
      },
    },
  },
  {
    tableName: "employees",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    paranoid: true,
    deletedAt: "deleted_at",

    // ✅ Centralized backend logic
    hooks: {
      beforeSave: (employee) => {
        employee.avatar_initials = getInitials(
          employee.first_name,
          employee.last_name,
        );
      },
    },
  },
);

module.exports = Employee;
