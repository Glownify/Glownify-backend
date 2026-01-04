import mongoose from "mongoose";
import User from "../models/User.js";
import Salon from "../models/Salon.js";
import Salesman from "../models/Salesman.js";
import SalesExecutive from "../models/SalesExecutive.js";
import IndependentProfessional from "../models/IndependentProfessional.js";


export const getSuperAdminDashboardStats = async (req, res) => {
    console.log("Fetching Super Admin Dashboard Stats");
  try {
    // ============================
    // 1️⃣ PLATFORM TOTAL COUNTS
    // ============================
    const [
      totalSalons,
      totalUsers,
      totalIndependent,
      totalSalesman,
      totalSalesExecutive,
      totalSubscriptionsSold
    ] = await Promise.all([
      Salon.countDocuments(),
      User.countDocuments(),
      IndependentProfessional.countDocuments(),
      Salesman.countDocuments(),
      SalesExecutive.countDocuments(),
      Salon.countDocuments({ "subscription.paymentStatus": "paid" })
    ]);

    // ============================
    // 2️⃣ SALES EXECUTIVE MANAGEMENT (LAST 5)
    // ============================
    const salesExecutives = await SalesExecutive.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("user", "name")
      .lean();

    const executiveIds = salesExecutives.map(se => se._id);

    // Count salesmen under each executive
    const salesmanCounts = await Salesman.aggregate([
      { $match: { salesExecutive: { $in: executiveIds } } },
      {
        $group: {
          _id: "$salesExecutive",
          count: { $sum: 1 }
        }
      }
    ]);

    const salesmanCountMap = {};
    salesmanCounts.forEach(item => {
      salesmanCountMap[item._id.toString()] = item.count;
    });

    const salesExecutiveData = salesExecutives.map(exec => ({
      name: exec.user?.name || "N/A",
      referralId: exec.referralId,
      salesmanUnderHim: salesmanCountMap[exec._id.toString()] || 0,
      commissionRate: exec.commissionRate,
      totalEarnings: exec.totalEarnings
    }));

    // ============================
    // 3️⃣ FINAL RESPONSE
    // ============================
    res.status(200).json({
      summary: {
        totalSalons,
        totalUsers,
        totalIndependentProfessionals: totalIndependent,
        totalSalesman,
        totalSalesExecutive,
        totalSubscriptionsSold
      },
      salesExecutiveManagement: salesExecutiveData
    });

  } catch (error) {
    console.error("Super Admin Dashboard Error:", error);
    res.status(500).json({
      message: "Failed to fetch super admin dashboard stats",
      error: error.message
    });
  }
};