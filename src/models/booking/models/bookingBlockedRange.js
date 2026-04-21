const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../config/database");

const BookingBlockedRange = sequelize.define(
  "booking_blocked_ranges",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    end_date: {
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

module.exports = BookingBlockedRange;
