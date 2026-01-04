// models/SalesExecutive.js
import mongoose from "mongoose";
import crypto from "crypto";

const salesExecutiveSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      required: true,
    },

    city: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "City",
      required: true,
    },

    referralId: { type: String, unique: true, required: true },
    commissionRate: { type: Number, default: 0 }, 
    totalEarnings: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ["active", "blocked"],
      default: "active",
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// ⭐ Virtual populate for Salesmen under this Executive
salesExecutiveSchema.virtual("team", {
  ref: "Salesman",
  localField: "_id",
  foreignField: "salesExecutive",
});

// Generate unique referral ID
salesExecutiveSchema.statics.generateUniqueReferralId = async function () {
  let referralId;
  let exists = true;

  while (exists) {
    const year = new Date().getFullYear();
    const randomPart = crypto.randomBytes(3).toString("hex").toUpperCase();
    referralId = `SE-${year}-${randomPart}`;
    exists = await this.findOne({ referralId });
  }
  return referralId;
};

// ✅ Pre-save hook as a safety net
salesExecutiveSchema.pre("save", async function (next) {
  if (!this.referralId) {
    this.referralId = await this.constructor.generateUniqueReferralId();
  }
  next();
});

export default mongoose.model("SalesExecutive", salesExecutiveSchema);
