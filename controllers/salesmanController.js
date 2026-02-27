import User from "../models/User.js";
import Salesman from "../models/Salesman.js";
import Salon from "../models/Salon.js";
import IndependentProfessional from "../models/IndependentProfessional.js";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// Secure random password (8 chars)
const generatePassword = () => crypto.randomBytes(4).toString('hex');

// Register new Salesman (only SalesExecutive can do this)
export const registerSalesman = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const executiveId = req.user.roleId;
    if (!executiveId) {
      return res.status(400).json({ message: "Invalid Sales Executive." });
    }

    const { email, mobile, name, city, commissionRate } = req.body;

    if (!mobile || !name || !email || !city || !commissionRate) {
      return res.status(400).json({ message: "Mobile, name, email, city, and commission rate are required." });
    }

    // Check existing user
    const existingUser = await User.findOne({
      $or: [
        { phone: mobile },
        { email: email.toLowerCase() },
      ],
    }).session(session);

    if (existingUser) {
      return res.status(400).json({ message: "User already exists." });
    }

    const password = generatePassword();

    // Create User
    const [newUser] = await User.create(
      [
        {
          name,
          phone: mobile,
          email: email.toLowerCase(),
          password,
          role: "salesman",
        },
      ],
      { session }
    );

    const referralId = await Salesman.generateUniqueReferralId();

    // Create Salesman
    const [newSalesman] = await Salesman.create(
      [
        {
          user: newUser._id,
          commissionRate,
          referralId,
          city,
          salesExecutive: executiveId,
        },
      ],
      { session }
    );

    await session.commitTransaction();

    const { password: _, ...userData } = newUser._doc;

    return res.status(201).json({
      user: userData,
      salesman: {
        ...newSalesman._doc,
        password,
      },
    });

  } catch (error) {
    await session.abortTransaction();

    return res.status(400).json({
      message: error.message || "Failed to register salesman.",
    });

  } finally {
    session.endSession(); // ✅ always runs
  }
};



// Get all salesmen (only for super_admin and sales_executive)
export const getAllSalesman = async (req, res) => {
    console.log("Fetching all salesmen...");
    try {
        const salesman = await Salesman.find()
            .populate('user', 'name email phone')
            .sort({ createdAt: -1 });
        res.status(200).json({ salesman });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch salesmen.", error: error.message });
    }
};


export const getDashboardStats = async (req, res) => {
  try {
    const salesmanId = req.user?.roleId;

    if (!salesmanId || !mongoose.Types.ObjectId.isValid(salesmanId)) {
      return res.status(400).json({ message: "Invalid salesman" });
    }

    // 1️⃣ Salesman info
    const salesman = await Salesman.findById(salesmanId).lean();
    if (!salesman) {
      return res.status(404).json({ message: "Salesman not found" });
    }

    // 2️⃣ Counts
    const [totalSalons, totalIndependentProfessionals] = await Promise.all([
      Salon.countDocuments({ referredBy: salesmanId }),
      IndependentProfessional.countDocuments({ referredBy: salesmanId }),
    ]);

    // 3️⃣ Recent salons
    const recentSalons = await Salon.find({ referredBy: salesmanId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("subscription.planId", "name")
      .select("shopName createdAt subscription")
      .lean();

    const recentSalonData = recentSalons.map((salon) => ({
      salonName: salon.shopName,
      date: salon.createdAt,
      planName: salon.subscription?.planId?.name || "Free",
      status: salon.subscription?.paymentStatus || "pending",
    }));

    // 4️⃣ Monthly sales growth
    const monthlyGrowth = await Salon.aggregate([
      { $match: { referredBy: new mongoose.Types.ObjectId(salesmanId) } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const formattedGrowth = monthlyGrowth.map((item) => {
      const monthName = new Date(
        item._id.year,
        item._id.month - 1
      ).toLocaleString("en", { month: "short" });

      return {
        month: `${monthName} ${item._id.year}`,
        value: item.count,
      };
    });

    // 5️⃣ Response
    res.status(200).json({
      summary: {
        totalSalons,
        totalIndependentProfessionals,
        commissionRate: salesman.commissionRate,
        totalEarnings: salesman.totalEarnings,
      },
      recentSalons: recentSalonData,
      monthlySalesGrowth: formattedGrowth,
    });
    console.log("Dashboard stats sent for salesman:", totalSalons, totalIndependentProfessionals);
  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({
      message: "Failed to fetch dashboard stats",
      error: error.message,
    });
  }
};


export const getMySalons = async (req, res) => {
  try {
    const userId = req.userId;

    // 1️⃣ Find salesman by user
    const salesman = await Salesman.findOne({ user: userId });
    if (!salesman) {
      return res.status(403).json({ message: "Not a salesman" });
    }

    // 2️⃣ Find all salons referred by this salesman
    const salons = await Salon.find({ referredBy: salesman._id })
      .populate("owner", "name email")
      .populate("city", "name")
      .select("shopName salonCategory subscription createdAt");

    res.status(200).json({
      success: true,
      count: salons.length,
      salons,
    });

  } catch (error) {
    console.error("Get salesman salons error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

