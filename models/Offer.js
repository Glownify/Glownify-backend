import mongoose from "mongoose";

const offerSchema = new mongoose.Schema({
  title: { type: String, required: true }, // e.g., "50% Off on First Booking"
  description: { type: String, required: true }, // e.g., "Get flat 50% discount on your first salon booking"
  discountType: {
    type: String,
    enum: ["percentage", "flat"],
    required: true, // To differentiate 50% vs ₹200
  },
  discountValue: { type: Number, required: true }, // 50 or 200
  minBookingAmount: { type: Number, required: true }, // e.g., 500
  code: { type: String, required: true, unique: true }, // e.g., "FIRST50"
  validUntil: { type: Date, required: true }, // e.g., 2025-10-31
  category: { type: String }, // e.g., "Bridal package", "Weekend Special"
}, { timestamps: true });

export default mongoose.model("Offer", offerSchema);
