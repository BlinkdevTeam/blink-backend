const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../config/database");

const BookingBlockedDate = sequelize.define(
  "booking_blocked_dates",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    label: {
      type: DataTypes.STRING,
    },
  },
  {
    timestamps: false,
  },
);

module.exports = BookingBlockedDate;
