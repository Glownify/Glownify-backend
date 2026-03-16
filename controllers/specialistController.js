// this code is old code before new requirements
// import Specialist from "../models/Specialist.js";
// import Salon from "../models/Salon.js";
// import User from "../models/User.js";
// import crypto from "crypto";

// // Secure random password (8 chars)
// const generatePassword = () => crypto.randomBytes(4).toString('hex');

// export const addSpecialist = async (req, res) => {
//   try {
//     const ownerId = req.userId; 
//     const { name, phone, email, expertise, experienceYears, certifications, image, availability } = req.body;

//     // Verify salon exists
//     const salon = await Salon.findOne({ owner: ownerId });
//     if (!salon) {
//       return res.status(404).json({ success: false, message: "Salon not found" });
//     }

//     // 2️⃣ Check if user already exists (phone/email)
//     const existingUser = await User.findOne({
//       $or: [{ phone }, { email }],
//     });

//     if (existingUser) {
//       return res.status(400).json({
//         success: false,
//         message: "User with this phone or email already exists",
//       });
//     }

//     // Generate secure password
//     const password = generatePassword(); // use robust function with letters, digits, symbols

//     const user = await User.create({
//       name,
//       phone,
//       email,
//       role: "specialist",
//       password,
//     });

//     // Create specialist linked to salon
//     const specialist = await Specialist.create({
//       salon: salon._id,
//       user: user._id,
//       expertise,
//       experienceYears: Number(experienceYears) || 0,
//       certifications,
//       image: image || "",
//       availability: availability || [],
//     });

//     res.status(201).json({
//       success: true,
//       message: "Specialist added successfully",
//       specialist,
//     });
//   } catch (error) {
//     console.error("Error adding specialist:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error while adding specialist",
//       error: error.message,
//     });
//   }
// };

// export const getSpecialistsBySalon = async (req, res) => {
//   try {
//     const userId = req.userId;
//     // Verify salon exists
//     const salon = await Salon.findOne({ owner: userId }).populate('specialistsData').lean();
//     if (!salon) {
//       return res.status(404).json({ success: false, message: "Salon not found" });
//     }

//     const specialists = await Specialist.find({ salon: salon._id })
//       .populate({
//         path: "user",
//         select: "name phone email role",
//       })
//       .sort({ createdAt: -1 })
//       .lean();

//       res.status(200).json({
//       success: true,
//       count: specialists.length,
//       specialists,
//     }); 
//   } catch (error) {
//     console.error("Error fetching specialists:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error while fetching specialists",
//       error: error.message,
//     });
//   }
// };

// export const updateSpecialist = async (req, res) => {
//   try {
//     const { specialistId } = req.params;
//     const { 
//       name, phone, email, // User fields
//       expertise, experienceYears, certifications, image, availability // Specialist fields
//     } = req.body;

//     // 1. Find the specialist record first
//     const specialist = await Specialist.findById(specialistId);
//     if (!specialist) {
//       return res.status(404).json({ success: false, message: "Specialist not found" });
//     }

//     // 2. Update the associated User record
//     // We update name, phone, and email specifically
//     const updatedUser = await User.findByIdAndUpdate(
//       specialist.user,
//       { 
//         $set: { 
//           ...(name && { name }), 
//           ...(phone && { phone }), 
//           ...(email && { email }) 
//         } 
//       },
//       { new: true, runValidators: true }
//     );

//     if (!updatedUser) {
//         return res.status(404).json({ success: false, message: "Associated user not found" });
//     }

//     // 3. Update the Specialist record
//     const updatedSpecialist = await Specialist.findByIdAndUpdate(
//       specialistId,
//       {
//         $set: {
//           expertise: expertise || specialist.expertise,
//           experienceYears: experienceYears !== undefined ? Number(experienceYears) : specialist.experienceYears,
//           certifications: certifications || specialist.certifications,
//           image: image || specialist.image,
//           availability: availability || specialist.availability,
//         },
//       },
//       { new: true }
//     ).populate({
//       path: "user",
//       select: "name phone email role",
//     });

//     res.status(200).json({
//       success: true,
//       message: "Specialist updated successfully",
//       specialist: updatedSpecialist,
//     });
//   } catch (error) {
//     console.error("Error updating specialist:", error);
    
//     // Handle duplicate key errors (e.g., if user tries to update to an email already in use)
//     if (error.code === 11000) {
//         return res.status(400).json({
//             success: false,
//             message: "Phone or Email already exists in the system",
//         });
//     }

//     res.status(500).json({
//       success: false,
//       message: "Server error while updating specialist",
//       error: error.message,
//     });
//   }
// };

// export const deleteSpecialist = async (req, res) => {
//   try {
//     const { specialistId } = req.params;

//     const specialist = await Specialist.findById(specialistId);
//     if (!specialist) {
//       return res.status(404).json({ success: false, message: "Specialist not found" });
//     }

//     // Delete both the Specialist and the User record
//     await User.findByIdAndDelete(specialist.user);
//     await Specialist.findByIdAndDelete(specialistId);

//     res.status(200).json({
//       success: true,
//       message: "Specialist and associated user account deleted successfully",
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, error: error.message });
//   }
// };








// new code according to new requirements

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Specialist from "../models/Specialist.js";
import Salon from "../models/Salon.js";
import Counter from "../models/Counter.js";


// Helper Function to generate unique specialist IDs
const generateSpecialistId = async () => {

  const counter = await Counter.findOneAndUpdate(
    { name: "specialistId" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  return "SP" + counter.seq;
};

// Specialist Login 
export const specialistLogin = async (req, res) => {
  try {

    const { specialistId, password } = req.body;

    if (!specialistId || !password) {
      return res.status(400).json({
        success: false,
        message: "Specialist ID and password are required"
      });
    }

    const specialist = await Specialist.findOne({ specialistId });

    if (!specialist) {
      return res.status(401).json({
        success: false,
        message: "Invalid Specialist ID or Password"
      });
    }

    if (specialist.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Specialist account is inactive"
      });
    }

    const isMatch = await bcrypt.compare(password, specialist.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid Specialist ID or Password"
      });
    }

    const token = jwt.sign(
      {
        id: specialist._id,
        role: "specialist",
        salonId: specialist.salon
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const specialistData = specialist.toObject();
    delete specialistData.password;

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      specialist: specialistData
    });

  } catch (error) {

    console.error("Specialist Login Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error"
    });

  }
};



// add specialist, api for salon owner to add specialist to their salon,
// Salon Owner Protected Route
export const addSpecialist = async (req, res) => {
  try {

    const userId = req.userId;

    const salon = await Salon.findOne({ owner: userId });

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: "Salon not found"
      });
    }

    const {
      name,
      phoneNumber,
      email,
      expertise,
      experienceYears,
      certifications,
      availability
    } = req.body;

    if (!name || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Name and phoneNumber are required"
      });
    }

    /* ---------- Duplicate Checks ---------- */

    const existingPhone = await Specialist.findOne({ phoneNumber });

    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message: "Phone number already exists"
      });
    }

    if (email) {
      const existingEmail = await Specialist.findOne({ email });

      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: "Email already exists"
        });
      }
    }

    /* ---------- Generate Specialist ID ---------- */

    const specialistId = await generateSpecialistId();

    /* ---------- Generate Password ---------- */

    const plainPassword = Math.floor(100000 + Math.random() * 900000).toString();

    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    /* ---------- Create Specialist ---------- */

    const specialist = await Specialist.create({
      salon: salon._id,
      specialistId,
      name,
      phoneNumber,
      email,
      expertise,
      experienceYears,
      certifications,
      availability,
      password: hashedPassword
    });

    const specialistData = specialist.toObject();
    delete specialistData.password;

    res.status(201).json({
      success: true,
      message: "Specialist added successfully",
      credentials: {
        specialistId,
        password: plainPassword
      },
      specialist: specialistData
    });

  } catch (error) {

    console.error("Add Specialist Error:", error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];

      return res.status(400).json({
        success: false,
        message: `${field} already exists`
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error"
    });

  }
};




// API to reset specialist password (Salon Owner Protected Route), 
export const resetSpecialistPassword = async (req, res) => {
  try {

    const userId = req.userId;
    const { id } = req.params;

    const salon = await Salon.findOne({ owner: userId });

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: "Salon not found"
      });
    }

    const specialist = await Specialist.findOne({
      _id: id,
      salon: salon._id
    });

    if (!specialist) {
      return res.status(404).json({
        success: false,
        message: "Specialist not found"
      });
    }

    /* Generate new password */

    const plainPassword = Math.floor(100000 + Math.random() * 900000).toString();

    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    specialist.password = hashedPassword;

    await specialist.save();

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
      newPassword: plainPassword
    });

  } catch (error) {

    console.error("Reset Specialist Password Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error"
    });

  }
};



// api for get all specialists of a salon, Salon Owner Protected Route
export const getAllSpecialists = async (req, res) => {
  try {

    const userId = req.userId;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const salon = await Salon.findOne({ owner: userId });

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: "Salon not found"
      });
    }

    const total = await Specialist.countDocuments({
      salon: salon._id
    });

    const specialists = await Specialist.find({
      salon: salon._id
    })
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      specialists
    });

  } catch (error) {

    console.error("Get Specialists Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error"
    });

  }
};



// API to get specialist by ID, Salon Owner Protected Route
export const getSpecialistById = async (req, res) => {
  try {

    const userId = req.userId;
    const { id } = req.params;

    const salon = await Salon.findOne({ owner: userId });

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: "Salon not found"
      });
    }

    const specialist = await Specialist.findOne({
      salon: salon._id,
      specialistId: id
    }).select("-password");

    if (!specialist) {
      return res.status(404).json({
        success: false,
        message: "Specialist not found"
      });
    }

    res.status(200).json({
      success: true,
      specialist
    });

  } catch (error) {

    console.error("Get Specialist Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error"
    });

  }
};


