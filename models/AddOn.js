// models/AddOn.js
import mongoose from "mongoose";

const addOnSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "ServiceItem", required: true, index: true },
  price: { type: Number, required: true, min: 0 },
  duration: { type: Number, default: 0 },
  imageURL: { type: String },
  isRecommended: { type: Boolean, default: false },
  providerType: {
      type: String,
      enum: ["Salon", "IndependentProfessional"],
      required: true
    },
    providerId: { type: mongoose.Schema.Types.ObjectId, refPath: "providerType", required: true },
}, { timestamps: true });

export default mongoose.model("AddOn", addOnSchema);
