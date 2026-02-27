// models/Review.js
import mongoose from "mongoose";

// const reviewSchema = new mongoose.Schema({
//   salon: { type: mongoose.Schema.Types.ObjectId, ref: "Salon", required: true },
//   user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//   rating: { type: Number, min: 1, max: 5, required: true },
//   comment: { type: String },
//   images: [String],
// }, { timestamps: true });

// export default mongoose.model("Review", reviewSchema);


const reviewSchema = new mongoose.Schema(
  {
    targetType: {
      type: String,
      enum: ["Salon", "IndependentProfessional"],
      required: true,
      index: true,
    },

    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "targetType",
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },

    comment: String,
    images: [String],
  },
  { timestamps: true }
);

reviewSchema.index({ targetId: 1, targetType: 1 });

export default mongoose.model("Review", reviewSchema);