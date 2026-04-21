const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../config/database");

const BookingPackageInclusion = sequelize.define(
  "booking_package_inclusions",
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },

    package_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    text: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    timestamps: false,
  },
);

module.exports = BookingPackageInclusion;
