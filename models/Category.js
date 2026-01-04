import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    gender: {
      type: String,
      enum: ["men", "women", "unisex"],
      required: true,
    },
    icon: { type: String },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// 🔥 This makes (name + gender) unique
categorySchema.index({ name: 1, gender: 1 }, { unique: true });

export default mongoose.model("Category", categorySchema);
