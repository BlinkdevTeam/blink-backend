const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../config/database");

const BookingPackageAddon = sequelize.define(
  "booking_package_addons",
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },

    package_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    label: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    price: {
      type: DataTypes.DECIMAL(10, 2),
    },
  },
  {
    timestamps: false,
  },
);

module.exports = BookingPackageAddon;
