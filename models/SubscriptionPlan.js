// models/SubscriptionPlan.js
import mongoose from "mongoose";

const subscriptionPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  durationInDays: {
    type: Number,
    required: true, // e.g. 30, 90, 365
  },
  features: {
    type: [String], // e.g. ["Unlimited Bookings", "5 Staff Accounts"]
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

export default mongoose.model("SubscriptionPlan", subscriptionPlanSchema);
