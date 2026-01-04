// models/Booking.js
import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    /* ---------------- PROVIDER ---------------- */
    providerType: {
      type: String,
      enum: ["Salon", "IndependentProfessional"],
      // required: true,
    },

    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "providerType",
      index: true,
    },

    // Only for salon bookings
    specialist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Specialist",
      default: null,
    },

    /* ---------------- SERVICES ---------------- */
    serviceItems: [
      {
        service: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "ServiceItem",
          required: true,
        },
        quantity: { type: Number, default: 1 },
        price: { type: Number, required: true },
      },
    ],

    addons: [
      {
        addon: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "AddOn",
        },
        quantity: { type: Number, default: 1 },
        price: { type: Number, required: true },
      },
    ],

    /* ---------------- SCHEDULE ---------------- */
    bookingDate: {
      type: Date,
      required: true,
      index: true,
    },

    timeSlot: {
      start: { type: String, required: true }, // "10:00"
      end: { type: String, required: true },   // "11:00"
    },

    bookingType: {
      type: String,
      enum: ["in_salon", "home_service"],
      required: true,
    },

    // Only required for home service
    serviceLocation: {
      address: String,
      coordinates: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: [Number],
      },
    },

    /* ---------------- PAYMENT ---------------- */
    totalAmount: {
      type: Number,
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },

    paymentMethod: {
      type: String,
      enum: ["cash", "online", "upi", "card"],
      default: "cash",
    },

    /* ---------------- BOOKING STATUS ---------------- */
    status: {
      type: String,
      enum: [
        "pending",      // created, waiting confirmation
        "confirmed",    // accepted by provider
        "in_progress",  // service started
        "completed",    // finished
        "cancelled",    // cancelled by user/provider
        "no_show",      // customer didn't arrive
      ],
      default: "pending",
      index: true,
    },

    cancellationReason: String,

    /* ---------------- FEEDBACK ---------------- */
    rating: {
      score: { type: Number, min: 1, max: 5 },
      feedback: String,
    },

    notes: String,
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Booking", bookingSchema);
