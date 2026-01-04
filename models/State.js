import mongoose from "mongoose";

const stateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },         // e.g. "Maharashtra"
    country: { type: String, default: "India" },      // e.g. "India"
    code: { type: String },                         // Optional: "MH"
  },
  { timestamps: true }
);

export default mongoose.model("State", stateSchema);
