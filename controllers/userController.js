import User from "../models/User.js";
import Salon from "../models/Salon.js";
import ServiceItem from "../models/ServiceItem.js";
import ServiceCategory from "../models/ServiceCategory.js";
import Review from "../models/Review.js"; // Use for virtual populate dont remove
import Specialist from "../models/Specialist.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";

export const getAllUsers = async (req, res) => {
  try {
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    if (page < 1) page = 1;
    if (limit < 1) limit = 10;

    const query = { role: "customer" };

    // Total count for pagination
    const totalCount = await User.countDocuments(query);

    // Fetch paginated users
    const users = await User.find(query)
      .select("-isVerified -govermentId")
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      users,
      page,
      totalPages: Math.ceil(totalCount / limit),
      count: totalCount,
    });
  } catch (error) {
    // console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching users",
      error: error.message,
    });
  }
};

export const verifyUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByIdAndUpdate(
      userId,
      { isVerified: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, message: "User verified By Admin", user });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Internal server error", error: error.message });
  }
};

export const blockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByIdAndUpdate(
      userId,
      { status: "blocked" },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({success: false, message: "User not found" });
    }
    res.status(200).json({success: true, message: "User blocked successfully", user });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Internal server error", error: error.message });
  }
};

export const activateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByIdAndUpdate(
      userId,
      { status: "active" },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({success: false, message: "User not found" });
    }
    res.status(200).json({success: true, message: "User activated successfully", user });
  } catch (error) {
    // console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Internal server error", error: error.message });
  }
};


export const uploadDocument = async (req, res) => {
  try {
    const { userId } = req.user;
    const { idType, idNumber, idImageUrl } = req.body;

    // Validate input
    if (!idType || !idNumber || !idImageUrl) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // Update user's governmentId
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        governmentId: {
          idType,
          idNumber,
          idImageUrl,
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "Document uploaded successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

export const giveReview = async (req, res) => {
  try {
    const { userId } = req.user;
    const { salonId, rating, comment, images } = req.body;

    // Validate input
    if (!salonId || !rating || !comment) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // Create a new review
    const newReview = new Review({
      salon: salonId,
      user: userId,
      rating,
      comment,
      images,
    });

    await newReview.save();

    res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      review: newReview,
    });
  } catch (err) {
    // console.error(err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

export const getMyProfile = async (req, res) => {
  try {
    const  userId  = req.user._id;

    const user = await User.findById(userId).select("-isVerified");

    if (!user) {
      return res.status(404).json({ success: false, message: "User is not found" });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

export const updateMyProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, email, whatsapp, gender } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ success: false, message: "Email already in use" });
      }
      updateData.email = email;
      updateData.isEmailVerified = false;
    }
    if (whatsapp) updateData.whatsapp = whatsapp;
    if (gender && ["male", "female", "other"].includes(gender)) updateData.gender = gender;
    
    // Handle profile photo upload
    if (req.files?.profilePhoto?.length > 0) {
      const uploaded = await uploadToCloudinary(req.files.profilePhoto, "glownify/profile_photos");
      updateData.profilePhoto = uploaded[0].secure_url;
    }

    const user = await User.findByIdAndUpdate(userId, updateData, { new: true }).select("-isVerified");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};



