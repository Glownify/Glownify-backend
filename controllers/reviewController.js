import User from "../models/User.js";
import Review from "../models/Review.js";
import mongoose from "mongoose";

// API to get reviews for a specific salon with pagination
export const getSalonReviews = async (req, res) => {
    try {
        const { salonId } = req.params;
        const { page = 1, limit = 5 } = req.query;

        const pageNumber = parseInt(page);
        const pageSize = parseInt(limit);
        const skip = (pageNumber - 1) * pageSize;

        if (!salonId) {
        return res.status(400).json({
            success: false,
            message: "Salon ID is required",
        });
        }

        const filter = {
        targetType: "Salon",
        targetId: new mongoose.Types.ObjectId(salonId),
        };

        const result = await Review.aggregate([
        { $match: filter },

        {
            $facet: {
            // ⭐ Summary Section
            summary: [
                {
                $group: {
                    _id: null,
                    avgRating: { $avg: "$rating" },
                    totalReviews: { $sum: 1 },
                },
                },
            ],

            // 📄 Paginated Reviews
            reviews: [
                { $sort: { createdAt: -1 } },
                { $skip: skip },
                { $limit: pageSize },

                // populate user
                {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "user",
                },
                },
                { $unwind: "$user" },

                {
                $project: {
                    rating: 1,
                    comment: 1,
                    images: 1,
                    createdAt: 1,
                    "user._id": 1,
                    "user.name": 1,
                    "user.profileImage": 1,
                },
                },
            ],
            },
        },
        ]);

        const summaryData = result[0].summary[0] || {
        avgRating: 0,
        totalReviews: 0,
        };

        const avgRating = summaryData.avgRating
        ? Number(summaryData.avgRating.toFixed(1))
        : 0;

        const totalReviews = summaryData.totalReviews || 0;

        return res.status(200).json({
        success: true,

        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(totalReviews / pageSize),
        count: result[0].reviews.length,
        
        summary: {
            avgRating,
            totalReviews,
        },

        reviews: result[0].reviews,
        });

    } catch (error) {
        console.error("Error fetching salon reviews:", error);
        return res.status(500).json({
        success: false,
        message: "Failed to fetch salon reviews",
        });
    }
};