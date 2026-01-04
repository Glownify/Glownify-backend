// models/User.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      match: /^\S+@\S+\.\S+$/,
    },

    phone: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },

    whatsapp: String,

    password: {
      type: String,
      required: true,
      select: false,
    },

    /* ---------------- ROLE ---------------- */
    role: {
      type: String,
      enum: [
        "customer",
        "salon_owner",
        "independent_pro",
        "specialist",
        "sales_executive",
        "team_lead",
        "salesman",
        "super_admin",
      ],
      default: "customer",
      index: true,
    },

    /* ---------------- ACCOUNT STATUS ---------------- */
    status: {
      type: String,
      enum: ["active", "blocked", "deleted"],
      default: "active",
      index: true,
    },

    isPhoneVerified: {
      type: Boolean,
      default: false,
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    lastLoginAt: Date,

    /* ---------------- PASSWORD RESET ---------------- */
    resetPasswordOTP: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true }
);

/* ---------------- PASSWORD HASH ---------------- */
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

/* ---------------- LOGIN PASSWORD CHECK ---------------- */
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

/* ---------------- SAFE JSON RESPONSE ---------------- */
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.resetPasswordOTP;
  delete obj.resetPasswordExpire;
  return obj;
};

export default mongoose.model("User", userSchema);


// // models/User.js
// import mongoose from "mongoose";
// import bcrypt from "bcryptjs";

// const userSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   email: { type: String, unique: true, sparse: true, lowercase: true, match: /^\S+@\S+\.\S+$/,
//  },
//   phone: { type: String, unique: true, required: true },
//   whatsapp: { type: String },
//   password: { type: String, required: true, select: false },
//   role: {
//     type: String,
//     enum: ["customer", "salon_owner", "independent_pro", "super_admin", "salesman", "team_lead", "sales_executive", "specialist"],
//     default: "customer"
//   },
//   status: { type: String, enum: ["active", "blocked"], default: "active" },
//   resetPasswordOTP: { type: String },
//   resetPasswordExpire: { type: Date },
// }, { timestamps: true });

// //
// // 🔐 PRE-SAVE HOOK — HASH PASSWORD AUTOMATICALLY
// //
// userSchema.pre("save", async function (next) {
//   // Only hash if password is new or changed
//   if (!this.isModified("password")) return next();

//   this.password = await bcrypt.hash(this.password, 10);
//   next();
// });

// //
// // 🔐 COMPARE PASSWORD METHOD (Login Use)
// //
// userSchema.methods.comparePassword = async function (enteredPassword) {
//   return await bcrypt.compare(enteredPassword, this.password);
// };

// //
// // 🚫 Remove password from returned JSON (Extra layer of safety)
// //
// userSchema.methods.toJSON = function () {
//   const obj = this.toObject();
//   delete obj.password;
//   return obj;
// };

// export default mongoose.model("User", userSchema);
