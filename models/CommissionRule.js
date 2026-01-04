import mongoose from "mongoose";

const CommissionRuleSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["sales_member", "team_lead", "sales_executive"],
      required: true,
    },

    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    city_id: { type: mongoose.Schema.Types.ObjectId, ref: "City", default: null },

    registration_commission: { type: Number, default: 0 },
    monthly_sales_commission: { type: Number, default: 0 },
    subscription_commission: { type: Number, default: 0 },

    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("CommissionRule", CommissionRuleSchema);
