import mongoose from "mongoose";

const citySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },                    // e.g. "Mumbai"
    state: { type: mongoose.Schema.Types.ObjectId, 
             ref: "State", 
             required: true },                                 // Reference to State
    country: { type: String, default: "India" },                 // Can duplicate from state for faster queries
    pincode: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("City", citySchema);
