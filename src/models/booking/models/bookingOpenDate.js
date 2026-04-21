const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../config/database");

const BookingOpenDate = sequelize.define(
  "booking_open_dates",
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
  },
  {
    timestamps: false,
  },
);

module.exports = BookingOpenDate;
