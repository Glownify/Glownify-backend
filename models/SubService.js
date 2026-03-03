// models/SubService.js (Child of ServiceItem)

import mongoose from "mongoose";

const subServiceSchema = new mongoose.Schema({
    serviceItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ServiceItem",
        required: true,
        index: true,
    },

    name: { type: String, required: true },
    price: { type: Number, required: true },
    durationMins: { type: Number, required: true },
    imageURL: String,
    description: String,

    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active",
    },

}, { timestamps: true });

subServiceSchema.index({ serviceItem: 1, status: 1 });

export default mongoose.model("SubService", subServiceSchema);