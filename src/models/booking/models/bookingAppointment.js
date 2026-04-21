const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../config/database");

const BookingAppointment = sequelize.define(
  "booking_appointment",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    full_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    booking_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    booking_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },

    service_id: {
      type: DataTypes.STRING, // or UUID if your package id is UUID
      allowNull: false,
    },

    addons: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },

    total_price: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },

    payment_proof: {
      type: DataTypes.TEXT,
    },

    payment_proof_type: {
      type: DataTypes.STRING,
    },

    status: {
      type: DataTypes.STRING,
      defaultValue: "Pending",
    },
  },
  {
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  },
);

module.exports = BookingAppointment;
