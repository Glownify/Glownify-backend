import User from "../models/User.js";
import SalesExecutive from "../models/SalesExecutive.js";
import Salesman from "../models/Salesman.js";
import mongoose from "mongoose";
import Salon from "../models/Salon.js";
import crypto from "crypto";

// Secure random password (8 chars)
const generatePassword = () => crypto.randomBytes(4).toString('hex');

// Register new Sales Executive
export const registerSalesExecutive = async (req, res) => {
  try {
    const { email, mobile, name, city, commissionRate } = req.body;

    if (!mobile || !name || !email || !city) {
      return res.status(400).json({ message: "Mobile, name, email, and city are required." });
    }

    const existingUser = await User.findOne({
      $or: [{ phone: mobile }, { email: email.toLowerCase() }]
    }).lean();

    if (existingUser) {
      return res.status(400).json({ message: "User already exists." });
    }

    // Generate secure password
    const password = generatePassword(); // use robust function with letters, digits, symbols

    const newUser = await new User({
      name,
      phone: mobile,
      email: email.toLowerCase(),
      password,
      role: "sales_executive"
    }).save();

    // Generate referralId to return immediately
    const referralId = await SalesExecutive.generateUniqueReferralId();

    const newSalesExecutive = await new SalesExecutive({
      user: newUser._id,
      city,
      commissionRate: commissionRate ?? 0,
      referralId
    }).save();

    const { password: _, ...userData } = newUser._doc;

    res.status(201).json({
      user: userData,
      salesExecutive: {
        ...newSalesExecutive._doc,
        password, // only for registration
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to register sales executive.", error: error.message });
  }
};


// Get all sales executives
export const getAllSalesExecutives = async (req, res) => {
    console.log("Fetching all sales executives...");
    try {
        const salesExecutives = await SalesExecutive.find()
            .populate('user', 'name email phone')
            .sort({ createdAt: -1 });
        res.status(200).json({ salesExecutives });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch sales executives.", error: error.message });
    }
};

// Get sales executives by city
export const getSalesExecutivesByCity = async (req, res) => {
  try {
    const { cityId } = req.params;

    if (!cityId) {
      return res.status(400).json({ message: "City ID is required." });
    }

    if (!mongoose.Types.ObjectId.isValid(cityId)) {
      return res.status(400).json({ message: "Invalid City ID." });
    }

    const salesExecutives = await SalesExecutive.find({ city: cityId })
      .populate("user", "name email phone")
      .populate("city", "name") // optional but recommended
      .populate("team")         // virtual populate
      .sort({ createdAt: -1 });

    if (!salesExecutives.length) {
      return res.status(404).json({
        message: "No sales executives found for this city."
      });
    }
    res.status(200).json({ salesExecutives });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to fetch sales executives by city.",
      error: error.message
    });
  }
};

export const getSalesExecutiveDashboardStats = async (req, res) => {
  try {
    const salesExecutiveId = req.user?.roleId;

    if (!salesExecutiveId || !mongoose.Types.ObjectId.isValid(salesExecutiveId)) {
      return res.status(400).json({ message: "Invalid Sales Executive" });
    }

    // 1️⃣ Sales Executive Info
    const salesExecutive = await SalesExecutive.findById(salesExecutiveId)
      .populate("user", "name email")
      .lean();

    if (!salesExecutive) {
      return res.status(404).json({ message: "Sales Executive not found" });
    }

    // 2️⃣ Get all Salesman under this Executive
    const salesman = await Salesman.find({ salesExecutive: salesExecutiveId })
      .populate("user", "name")
      .lean();

    const salesmanIds = salesman.map(s => s._id);
    // 3️⃣ Total salons registered by all salesman
    const totalSalons = await Salon.countDocuments({
      referredBy: { $in: salesmanIds }
    });

    // 4️⃣ Salon count per salesman
    const salonCounts = await Salon.aggregate([
      { $match: { referredBy: { $in: salesmanIds } } },
      {
        $group: {
          _id: "$referredBy",
          count: { $sum: 1 }
        }
      }
    ]);

    const salonCountMap = {};
    salonCounts.forEach(item => {
      salonCountMap[item._id.toString()] = item.count;
    });

    // 5️⃣ Salesman detailed list
    const salesmanDetails = salesman.map(salesman => ({
      salesmanId: salesman._id,
      name: salesman.user?.name || "N/A",
      referralId: salesman.referralId,
      status: salesman.status,
      commissionRate: salesman.commissionRate,
      totalEarnings: salesman.totalEarnings,
      totalSalons: salonCountMap[salesman._id.toString()] || 0
    }));

    // 6️⃣ Response
    res.status(200).json({
      summary: {
        totalSalesman: salesman.length,
        totalSalons,
        commissionRate: salesExecutive.commissionRate,
        totalEarnings: salesExecutive.totalEarnings
      },
      salesman: salesmanDetails
    });

  } catch (error) {
    console.error("Sales Executive Dashboard Error:", error);
    res.status(500).json({
      message: "Failed to fetch dashboard stats",
      error: error.message
    });
  }
};
