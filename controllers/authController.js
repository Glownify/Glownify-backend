// routes/auth.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User.js";
import Salon from "../models/Salon.js";
import IndependentProfessional from "../models/IndependentProfessional.js";
import SalesExecutive from "../models/SalesExecutive.js";
import Salesman from "../models/Salesman.js";
import Category from "../models/Category.js";
import { generateOTP } from "../utils/otp.js";
import { sendEmail } from "../utils/email.js";
import { hashString } from "../utils/hash.js";

const router = express.Router();

const generateToken = (user, roleDetails) => {
  return jwt.sign(
    {
      id: user._id,           // userId
      role: user.role,        // user role (salesExecutive / salesman etc.)
      roleId: roleDetails?._id || null, // salesExecutiveId / salesmanId etc.
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};


export const signup = async (req, res) => {
  console.log("Signup request body:", req.body);

  try {
    const { name, email, phone, password, role, salonData, independentData } = req.body;

    // -----------------------
    // Basic validations
    // -----------------------
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: "Name, email, phone, and password are required" });
    }

    if (await User.findOne({ email })) {
      return res.status(400).json({ message: "Email already registered" });
    }
    if (await User.findOne({ phone })) {
      return res.status(400).json({ message: "Phone already registered" });
    }

    // =========================
    // ROLE VALIDATION BEFORE USER CREATE
    // =========================

    if (role === "salon_owner") {
      if (!salonData) {
        return res.status(400).json({ message: "Salon data is required for salon owner" });
      }

      const requiredFields = ["shopType", "shopName", "salonCategory", "location", "city"];
      for (const field of requiredFields) {
        if (!salonData[field]) {
          return res.status(400).json({ message: `Salon field '${field}' is required` });
        }
      }

      if (salonData.shopType === "partnership") {
        if (!Array.isArray(salonData.partners) || salonData.partners.length === 0) {
          return res.status(400).json({
            message: "At least one partner is required for partnership salon"
          });
        }
      }

      const govId = salonData.governmentId;
      if (!govId?.idType || !govId?.idNumber || !govId?.idImageUrl) {
        return res.status(400).json({
          message: "Government ID (idType, idNumber, idImageUrl) is required for salon owner"
        });
      }
    }

    if (role === "independent_pro") {
      if (!independentData) {
        return res.status(400).json({
          message: "Independent profile data required"
        });
      }

      const {
        gender,
        experienceYears,
        specializations,
        serviceTypes,
        availability,
        governmentId,
        location
      } = independentData;

      if (!gender || experienceYears === undefined) {
        return res.status(400).json({
          message: "Gender and experienceYears are required"
        });
      }

      if (!Array.isArray(specializations) || specializations.length === 0) {
        return res.status(400).json({
          message: "At least one specialization is required"
        });
      }

      if (!Array.isArray(serviceTypes) || serviceTypes.length === 0) {
        return res.status(400).json({
          message: "At least one service type is required"
        });
      }

      if (!Array.isArray(availability) || availability.length === 0) {
        return res.status(400).json({
          message: "Availability is required"
        });
      }

      if (!governmentId?.idType || !governmentId?.idNumber || !governmentId?.idImageUrl) {
        return res.status(400).json({
          message: "Government ID is required"
        });
      }

      if (
        !location?.coordinates ||
        !Array.isArray(location.coordinates) ||
        location.coordinates.length !== 2
      ) {
        return res.status(400).json({
          message: "Valid location coordinates required"
        });
      }
    }



    // ============================
    // NOW CREATE USER (SAFE)
    // ============================
    const user = await User.create({
      name,
      email,
      phone,
      password,
      role,
    });

    let roleDetails = null;

    // ============================
    // CREATE ROLE DOCUMENT
    // ============================

    if (role === "salon_owner") {
      roleDetails = await Salon.create({ ...salonData, owner: user._id });
      user.salonId = roleDetails._id;
      await user.save();
    }

    if (role === "independent_pro") {
      roleDetails = await IndependentProfessional.create({ ...independentData, user: user._id });
    }

    // JWT
    const token = generateToken(user, roleDetails);

    return res.status(201).json({
      message: "Registration successful",
      user: {
        ...user.toObject(),
        ...(role === "salon_owner" && { salon: roleDetails }),
        ...(role === "independent_pro" && { independentProfile: roleDetails }),
      },
      token,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Registration failed", error: err.message });
  }
};






// Separate route for salon owner registration with detailed salon data
export const signupSalonOwner = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      name,
      email,
      phone,
      password,
      whatsappNumber,
      role,
      salonData,
    } = req.body;

    if (!name || !email || !phone || !password || role !== "salon_owner") {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Required fields missing" });
    }

    const {
      shopType,
      shopName,
      salonCategory,
      location,
      city,
      governmentId,
      galleryImages,
      partners,
      openingHours,
      offersHomeService
    } = salonData;

    if (
      !shopType ||
      !shopName ||
      !salonCategory ||
      !location?.coordinates ||
      !location?.address ||
      !city ||
      !governmentId?.idType ||
      !governmentId?.idNumber ||
      !governmentId?.idImageUrl
    ) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Salon required fields missing" });
    }

    // Duplicate check
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Email already exists" });
    }

    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Phone already exists" });
    }

    // ===============================
    // CREATE USER (INSIDE SESSION)
    // ===============================
    const user = await User.create(
      [
        {
          name,
          email,
          phone,
          password,
          whatsappNumber,
          role,
        },
      ],
      { session }
    );

    // ===============================
    // CREATE SALON (INSIDE SESSION)
    // ===============================
    const salon = await Salon.create(
      [
        {
          owner: user[0]._id,
          shopType,
          partners: shopType === "partnership" ? partners : [],
          shopName,
          salonCategory,
          contactNumber: phone,
          whatsappNumber: whatsappNumber || "",
          openingHours: openingHours || [],
          offersHomeService: offersHomeService || false,
          city,
          location: {
            type: "Point",
            coordinates: location.coordinates,
            address: location.address,
            city: location.city,
            state: location.state,
            pincode: location.pincode,
          },
          galleryImages: galleryImages || [],
          governmentId,
        },
      ],
      { session }
    );

    // ===============================
    // COMMIT TRANSACTION
    // ===============================
    await session.commitTransaction();
    session.endSession();

    const token = generateToken(user[0]);

    res.status(201).json({
      message: "Salon Owner registered successfully",
      user: user[0],
      salon: salon[0],
      token,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error(error);
    res.status(500).json({
      message: "Registration failed",
      error: error.message,
    });
  }
};



// Separate route for independent professional registration with detailed profile data
export const signupIndependentPro = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { name, email, phone, password, role, independentData } = req.body;

    // ===============================
    // BASIC VALIDATION
    // ===============================
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    if (role !== "independent_pro") {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (!independentData) {
      return res.status(400).json({ message: "Independent data required" });
    }

    // ===============================
    // DUPLICATE CHECK
    // ===============================
    const [existingEmail, existingPhone] = await Promise.all([
      User.findOne({ email }),
      User.findOne({ phone }),
    ]);

    if (existingEmail)
      return res.status(400).json({ message: "Email already exists" });

    if (existingPhone)
      return res.status(400).json({ message: "Phone already exists" });

    const {
      gender,
      experienceYears,
      specializations,
      serviceTypes,
      availability,
      governmentId,
      location,
      profilePhoto,
      workPhotos,
    } = independentData;

    // ===============================
    // REQUIRED FIELD VALIDATION
    // ===============================
    if (!gender || experienceYears === undefined) {
      return res.status(400).json({
        message: "Gender and experienceYears required",
      });
    }

    if (!Array.isArray(specializations) || specializations.length === 0) {
      return res.status(400).json({
        message: "At least one specialization required",
      });
    }

    if (!Array.isArray(serviceTypes) || serviceTypes.length === 0) {
      return res.status(400).json({
        message: "At least one service type required",
      });
    }

    if (!Array.isArray(availability) || availability.length === 0) {
      return res.status(400).json({
        message: "Availability required",
      });
    }

    if (
      !governmentId?.idType ||
      !governmentId?.idNumber ||
      !governmentId?.idImageUrl
    ) {
      return res.status(400).json({
        message: "Government ID required",
      });
    }

    if (
      !location?.coordinates ||
      !Array.isArray(location.coordinates) ||
      location.coordinates.length !== 2
    ) {
      return res.status(400).json({
        message: "Valid location coordinates required",
      });
    }

    // ===============================
    // CATEGORY OBJECT ID VALIDATION
    // ===============================
    const validObjectIds = specializations.every((id) =>
      mongoose.Types.ObjectId.isValid(id)
    );

    if (!validObjectIds) {
      return res.status(400).json({
        message: "Invalid category ID format",
      });
    }

    const categories = await Category.find({
      _id: { $in: specializations },
    });

    if (categories.length !== specializations.length) {
      return res.status(400).json({
        message: "One or more categories not found",
      });
    }

    
    // ===============================
    // CREATE USER
    // ===============================
    const [user] = await User.create(
      [
        {
          name,
          email,
          phone,
          password,
          role,
        },
      ],
      { session }
    );

    // ===============================
    // CREATE INDEPENDENT PROFILE
    // ===============================
    const [independentProfile] = await IndependentProfessional.create(
      [
        {
          user: user._id,
          gender,
          experienceYears,
          specializations,
          serviceTypes,
          profilePhoto,
          workPhotos: workPhotos || [],
          availability,
          governmentId,
          location: {
            type: "Point",
            coordinates: location.coordinates,
            address: location.address,
            city: location.city,
            state: location.state,
            pincode: location.pincode,
            radiusInKm: location.radiusInKm || 10,
          },
        },
      ],
      { session }
    );

    await session.commitTransaction();

    const token = generateToken(user, independentProfile);

    return res.status(201).json({
      message: "Independent Professional registered successfully",
      user,
      independentProfile,
      token,
    });
  } catch (error) {
    await session.abortTransaction();

    return res.status(500).json({
      message: "Registration failed",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};








export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    let roleDetails = null;

    if (user.role === "salon_owner") {
      roleDetails = await Salon.findOne({ owner: user._id }).lean();
    } else if (user.role === "independent_pro") {
      roleDetails = await IndependentProfessional.findOne({ user: user._id }).lean();
    } else if (user.role === "sales_executive") {
      roleDetails = await SalesExecutive.findOne({ user: user._id }).lean();
    } else if (user.role === "salesman") {
      roleDetails = await Salesman.findOne({ user: user._id }).lean();
    }
    else if (user.role === "specialist") {
      roleDetails = await Specialist.findOne({ user: user._id }).lean();
    }
    
    const token = generateToken(user, roleDetails);

    const userData = user.toObject();
    delete userData.password;

    res.status(200).json({
      message: "Login successful",
      user: {
        ...userData,
        roleDetails,
      },
      token,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed", error: err.message });
  }
};


export const toggleOffersHomeService = async (req, res) => {

  console.log("Toggling home service for user:", req.userId);
  try {
    const userId = req.userId;
    const salon = await Salon.findOne({ owner: userId });
    if (!salon) {
      return res.status(404).json({ message: "Salon not found" });
    }

    salon.offersHomeService = !salon.offersHomeService;
    await salon.save();

    res.status(200).json({
      message: "Home service status updated successfully",
      offersHomeService: salon.offersHomeService,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update home service status", error: err.message });
  }
};

// ===== FORGOT PASSWORD (SEND OTP) =====
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = generateOTP(4);
    user.resetPasswordOTP = hashString(otp);
    user.resetPasswordExpire = Date.now() + 5 * 60 * 1000; // 5 min
    await user.save();

    await sendEmail({
      to: email,
      subject: "Password Reset OTP",
      html: `<p>Hello ${user.name || ""},</p>
             <p>Your OTP for password reset is <b>${otp}</b>.</p>
             <p>This OTP will expire in 5 minutes.</p>`,
    });

    res.json({ message: "OTP sent to your email" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ===== VERIFY OTP =====
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user || !user.resetPasswordOTP || hashString(otp) !== user.resetPasswordOTP) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    if(user.resetPasswordExpire < Date.now()){
        return res.status(400).json({ message: "OTP Expired" });
    }

    res.json({ message: "OTP verified successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ===== RESET PASSWORD =====
export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const user = await User.findOne({ email });

    if (!user || user.resetPasswordExpire < Date.now()) {
      return res.status(400).json({ message: "OTP Expired" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: "Password reset successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// In-memory OTP store
// Format: { "otpValue": { mobile: "9876543210", expiresAt: timestamp } }
const otpStore = {};

// Generate OTP

// ----------------- SEND OTP -----------------
export const sendOtp = async (req, res) => {
  try {
    const { mobile } = req.body;
    if (!mobile) return res.status(400).json({ message: "Mobile is required" });

    const otp = generateOTP(6);
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes expiry

    // Store OTP internally
    otpStore[otp] = { mobile, expiresAt };

    // TODO: Send OTP via SMS gateway
    console.log(`OTP sent to ${mobile}: ${otp}`);

    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ----------------- VERIFY OTP -----------------
export const verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) return res.status(400).json({ message: "OTP is required" });

    const record = otpStore[otp];
    if (!record) return res.status(400).json({ message: "Invalid OTP" });

    if (Date.now() > record.expiresAt) {
      delete otpStore[otp];
      return res.status(400).json({ message: "OTP expired" });
    }

    const mobile = record.mobile;

    // OTP verified → delete OTP
    delete otpStore[otp];

    // Check if user exists
    const user = await User.findOne({ mobile });

    if (user) {
      // Existing user → generate JWT token for login
      const token = jwt.sign({ userId: user._id, mobile }, JWT_SECRET, { expiresIn: "7d" });
      return res.json({ message: "Login successful", existing: true, token });
    } else {
      // New user → generate short-lived token for registration
      const regToken = jwt.sign({ mobile }, JWT_SECRET, { expiresIn: "10m" });
      return res.json({ message: "OTP verified. Complete registration", existing: false, token: regToken });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ----------------- COMPLETE NEW USER -----------------
export const completeNewUser = async (req, res) => {
  try {
    const { token, name, email, password, role } = req.body;
    if (!token) return res.status(400).json({ message: "Token is required" });

    // Verify registration token
    const decoded = jwt.verify(token, JWT_SECRET);
    const mobile = decoded.mobile;

    // Optional: check if user already exists
    const existingUser = await User.findOne({ mobile });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const user = await User.create({ name, email, password, role, mobile });

    // Generate login token for the new user
    const loginToken = jwt.sign({ userId: user._id, mobile }, JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({ message: "User created successfully", user, token: loginToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


// ===== SUPERADMIN RESET PASSWORD =====
export const superAdminResetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({
        message: "Email and newPassword are required",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Hash new password
    user.password = newPassword;

    // Clear any existing reset data
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({
      message: "Password reset successfully by SuperAdmin",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to reset password",
      error: err.message,
    });
  }
};




export default router;
