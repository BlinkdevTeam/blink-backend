const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../config/database");

const BookingPackage = sequelize.define(
  "booking_packages",
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },

    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    description: {
      type: DataTypes.TEXT,
    },

    duration: {
      type: DataTypes.INTEGER,
    },

    price: {
      type: DataTypes.DECIMAL(10, 2),
    },

    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },

    color: {
      type: DataTypes.STRING,
    },

    type: {
      type: DataTypes.STRING,
    },

    created_at: {
      type: DataTypes.DATE,
    },
  },
  {
    timestamps: false,
  },
);

module.exports = BookingPackage;
