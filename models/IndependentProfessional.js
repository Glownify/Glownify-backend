
import mongoose from "mongoose";

const independentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    experienceYears: Number,
    serviceTypes: [String],
    specializations: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],

    // 
    serviceCategory: {
      type: String,
      enum: ["men", "women", "unisex"],
      required: true,
    },

    profilePhoto: String,
    workPhotos: [String],

    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], index: "2dsphere" },
      address: String,
      city: String,
      state: String,
      pincode: String,
      radiusInKm: { type: Number, default: 10 },
    },

    availability: [
      {
        _id: false,
        day: { type: String, enum: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"] },
        start: String,
        end: String
      }
    ],

    availabilityStatus: {
      type: String,
      enum: ["available", "busy", "offline"],
      default: "available"
    },

    governmentId: {
      idType: { type: String, enum: ["Aadhaar", "PAN", "DL"] },
      idNumber: String,
      idImageUrl: String,
    },

    subscription: {
      planId: { type: mongoose.Schema.Types.ObjectId, ref: "SubscriptionPlan" },
      startDate: Date,
      endDate: Date,
      paymentStatus: {
        type: String,
        enum: ["paid", "pending", "expired"],
        default: "pending",
      },
    },

    // verifiedByAdmin: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

independentSchema.virtual("serviceItemData", {
  ref: "ServiceItem",
  localField: "_id",
  foreignField: "providerId",
  options: { match: { providerType: "independent" } }
});

independentSchema.virtual("reviewData", {
  ref: "Review",
  localField: "_id",
  foreignField: "independent",
});

export default mongoose.model("IndependentProfessional", independentSchema);
