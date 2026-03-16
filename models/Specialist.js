// models/Specialist.js
// import mongoose from "mongoose";

// const specialistSchema = new mongoose.Schema(
//   {
//     salon: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Salon",
//       required: true,
//     },

//     user: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       unique: true,
//       required: true,
//     },

//     expertise: [
//       {
//         type: String,
//         enum: ["Hair", "Skin", "Makeup", "Massage", "Nails", "Other"],
//         required: true,
//       },
//     ],

//     experienceYears: { type: Number, default: 0 },
//     image: { type: String },
//     certifications: [String],

//     availability: [
//       {
//         day: {
//           type: String,
//           enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
//           required: true,
//         },
//         start: { type: String, required: true },
//         end: { type: String, required: true },
//       },
//     ],
//   },
//   { timestamps: true }
// );

// export default mongoose.model("Specialist", specialistSchema);
// above code is old code 




// new code accoring to new requirements
import mongoose from "mongoose";

const specialistSchema = new mongoose.Schema(
  {
    salon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Salon",
      required: true,
      index: true
    },

    specialistId: {
      type: String,
      unique: true,
      required: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    phoneNumber: {
      type: String,
      unique: true,
      required: true,
      index: true
    },

    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      match: /^\S+@\S+\.\S+$/
    },

    photo: {
      type: String
    },

    expertise: [
      {
        type: String,
        enum: ["Hair", "Skin", "Makeup", "Massage", "Nails", "Other"]
      }
    ],

    experienceYears: {
      type: Number,
      default: 0
    },

    certifications: [String],

    availability: [
      {
        _id: false,
        day: {
          type: String,
          enum: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
        },
        start: String,
        end: String
      }
    ],

    password: {
      type: String,
      required: true
    },

    status: {
      type: String,
      enum: ["active","inactive"],
      default: "active"
    }

  },
  { timestamps: true }
);

export default mongoose.model("Specialist", specialistSchema);