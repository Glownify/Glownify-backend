import mongoose from "mongoose";

const serviceCategorySchema = new mongoose.Schema(
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

// convert name to lowercase before saving
serviceCategorySchema.pre("save", function (next) {
  this.name = this.name.trim().toLowerCase();
  next();
});

// 🔥 This makes (name + gender) unique
serviceCategorySchema.index({ name: 1, gender: 1 }, { unique: true });

export default mongoose.model("ServiceCategory", serviceCategorySchema); 
