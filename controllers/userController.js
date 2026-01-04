import User from "../models/User.js";
import Salon from "../models/Salon.js";
import ServiceItem from "../models/ServiceItem.js";
import Category from "../models/Category.js";
import Review from "../models/Review.js"; // Use for virtual populate dont remove
import Specialist from "../models/Specialist.js";

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
      users,
      page,
      totalPages: Math.ceil(totalCount / limit),
      count: totalCount,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
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
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User verified By Admin", user });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
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
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User blocked successfully", user });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
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
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User activated successfully", user });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};


export const uploadDocument = async (req, res) => {
  try {
    const { userId } = req.user;
    const { idType, idNumber, idImageUrl } = req.body;

    // Validate input
    if (!idType || !idNumber || !idImageUrl) {
      return res.status(400).json({ message: "All fields are required" });
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
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Document uploaded successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const giveReview = async (req, res) => {
  try {
    const { userId } = req.user;
    const { salonId, rating, comment, images } = req.body;

    // Validate input
    if (!salonId || !rating || !comment) {
      return res.status(400).json({ message: "All fields are required" });
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
      message: "Review submitted successfully",
      review: newReview,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// const getLocationFromCoordinates = (req, res) => {
//   const { latitude, longitude } = req.body;

//   // This is a placeholder function. In a real application, you would use a geocoding service.
//   if (!latitude || !longitude) {
//     return res.status(400).json({ message: "Latitude and Longitude are required" });
//   }

