// models/Specialist.js
import mongoose from "mongoose";

const specialistSchema = new mongoose.Schema(
  {
    salon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Salon",
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      required: true,
    },

    expertise: [
      {
        type: String,
        enum: ["Hair", "Skin", "Makeup", "Massage", "Nails", "Other"],
        required: true,
      },
    ],

    experienceYears: { type: Number, default: 0 },
    image: { type: String },
    certifications: [String],

    availability: [
      {
        day: {
          type: String,
          enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
          required: true,
        },
        start: { type: String, required: true },
        end: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Specialist", specialistSchema);
