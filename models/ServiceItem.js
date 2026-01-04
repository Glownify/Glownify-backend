// models/ServiceItem.js
import mongoose from "mongoose";

const serviceItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true, index: true },
  price: { type: Number, required: true },
  durationMins: { type: Number, default: 30 },
  discountPercent: { type: Number, default: 0 },
  description: { type: String },
  imageURL: String,
  status: { type: String, enum: ["active", "inactive"], default: "active" },
   // 👇 NEW FIELD
  serviceMode: {
    type: String,
    enum: ["salon", "home", "both"],
    required: true,
    index: true,
  },
  providerType: {
    type: String,
    enum: ["Salon", "IndependentProfessional"],
    required: true
  },
  providerId: { type: mongoose.Schema.Types.ObjectId, refPath: "providerType", required: true },
  addOns: [{ type: mongoose.Schema.Types.ObjectId, ref: "AddOn" }],
}, { timestamps: true });

// virtual populate for addOns
serviceItemSchema.virtual("addOnDetails", {
  ref: "AddOn",
  localField: "_id",
  foreignField: "serviceId",
});

serviceItemSchema.set("toObject", { virtuals: true });
serviceItemSchema.set("toJSON", { virtuals: true });

export default mongoose.model("ServiceItem", serviceItemSchema);
