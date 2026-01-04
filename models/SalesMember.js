import mongoose from 'mongoose';

const salesMemberSchema = new mongoose.Schema(
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

    executive: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SalesExecutive",
      required: true,
    },

    // If this member is under a team lead (optional)
    teamLead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SalesMember",
      default: null,
    },

    referralCode: { type: String, unique: true },

    // Team Lead included here
    level: {
      type: String,
      enum: ["junior", "senior", "team_lead"],
      default: "junior",
    },

    status: {
      type: String,
      enum: ["active", "blocked"],
      default: "active",
    },
  },
  { timestamps: true }
);

// Generate unique referral ID
salesmanSchema.statics.generateUniqueReferralId = async function() {
    let referralId;
    let exists = true;

    while (exists) {
        const year = new Date().getFullYear();
        const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
        referralId = `SP-${year}-${randomPart}`;
        exists = await this.findOne({ referralId });
    }

    return referralId;
};

export default mongoose.model("SalesMember", salesMemberSchema);
