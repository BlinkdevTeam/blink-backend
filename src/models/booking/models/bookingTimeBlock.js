const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../config/database");

const BookingTimeBlock = sequelize.define(
  "booking_time_blocks",
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

    start_time: {
      type: DataTypes.TIME,
    },

    end_time: {
      type: DataTypes.TIME,
    },

    label: {
      type: DataTypes.STRING,
    },
  },
  {
    timestamps: false,
  },
);

module.exports = BookingTimeBlock;
