import Salon from "../models/Salon.js";
import ServiceItem from "../models/ServiceItem.js";
import Specialist from "../models/Specialist.js";
import {geoNearStage} from "../utils/geoPipeline.js";
import mongoose from "mongoose";

export const getFeaturedSalons = async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;

    if (lat && isNaN(lat)) {
      return res.status(400).json({ message: "Invalid latitude" });
    }

    if (lng && isNaN(lng)) {
      return res.status(400).json({ message: "Invalid longitude" });
    }

    const pipeline = [
      ...geoNearStage({
        lat,
        lng,
        radius,
      }),

      // Only verified salons
      // {
      //   $match: { verifiedByAdmin: true },
      // },

      {
        $lookup: {
          from: "reviews",
          let: { salonId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$salon", "$$salonId"] }
              }
            },
            {
              $group: {
                _id: null,
                averageRating: { $avg: "$rating" },
                totalReviews: { $sum: 1 }
              }
            }
          ],
          as: "reviewStats"
        }
      },
      {
        $addFields: {
          averageRating: {
            $ifNull: [{ $arrayElemAt: ["$reviewStats.averageRating", 0] }, 0]
          },
          totalReviews: {
            $ifNull: [{ $arrayElemAt: ["$reviewStats.totalReviews", 0] }, 0]
          }
        }
      },
      {
        $project: { reviewStats: 0 }
      },
      { $sort: { averageRating: -1 } },
      { $limit: 10 },
    ];

    const salons = await Salon.aggregate(pipeline);

    res.json({
      success: true,
      message: "Featured salons retrieved successfully",
      salons });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// export const getFeaturedSalons = async (req, res) => {
//   try {
//     const featuredSalons = await Salon.aggregate([
//       //  Only verified salons
//       // {
//       //   $match: { verifiedByAdmin: true },
//       // },
//       // 1️⃣ Join salon with reviews
//       {
//         $lookup: {
//           from: "reviews",
//           localField: "_id",
//           foreignField: "salon",
//           as: "reviews",
//         },
//       },
//       //  Join service items
//       {
//         $lookup: {
//           from: "serviceItem",
//           localField: "_id",
//           foreignField: "salon",
//           as: "serviceItemData",
//         },
//       },
//             // Join specialists
//       {
//         $lookup: {
//           from: "specialists",
//           localField: "_id",
//           foreignField: "salon",
//           as: "specialistsData",
//         },
//       },
//       // 2️⃣ Compute average rating
//       {
//         $addFields: {
//           averageRating: { $avg: "$reviews.rating" },
//           totalReviews: { $size: "$reviews" },
//         },
//       },
//       // 3️⃣ Sort by highest rating first
//       {
//         $sort: { averageRating: -1 },
//       },
//       // 4️⃣ Optionally limit results (e.g., top 10)
//       {
//         $limit: 10,
//       },
//     ]);

//     res.status(200).json({
//       message: "Featured salons retrieved successfully",
//       salons: featuredSalons,
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// };

export const getAllSalonsByCategory = async (req, res) => {
  console.log("sdgds");
  try {
    const { category, lat, lng, radius = 50000 } = req.query;
    console.log(req.query);

    if (category && !["men","women","unisex"].includes(category)) {
      return res.status(400).json({ message: "Invalid category" })
    }

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "lat and lng are required",
      });
    }

    const pipeline = [
      // 1️⃣ GEO SEARCH (must be first)
      ...geoNearStage({ lat, lng, radius }),

      // 2️⃣ CATEGORY FILTER (optional)
      ...(category
        ? [
            {
              $match: {
                salonCategory: category, // men / women / unisex
              },
            },
          ]
        : []),

      // 3️⃣ SORT BY NEAREST
      { $sort: { distanceInMeters: 1 } },

      // 4️⃣ POPULATE OWNER
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner",
        },
      },
      {
        $unwind: {
          path: "$owner",
          preserveNullAndEmptyArrays: true,
        },
      },

      // 5️⃣ PROJECT REQUIRED FIELDS
      {
        $project: {
          shopName: 1,
          salonCategory: 1,
          location: 1,
          distanceInMeters: 1,
          owner: {
            name: 1,
            phone: 1,
            email: 1,
            whatsapp: 1,
            role: 1,
            govermentId: 1,
          },
        },
      },
    ];

    const salons = await Salon.aggregate(pipeline);

    // ✅ NO SALON FOUND
    if (salons.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        message: "No salons found for this category near you",
        salons: [],
      });
    }

    res.status(200).json({
      success: true,
      count: salons.length,
      salons,
    });
    console.log("Salons fetched:", salons);
  } catch (error) {
    console.error("Error fetching salons:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching salons",
      error: error.message,
    });
  }
};

export const getAllSalons = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;       // which page
    const limit = parseInt(req.query.limit) || 20;    // how many per page
    const skip = (page - 1) * limit;

    const salons = await Salon.find()
      .skip(skip)
      .limit(limit)
      .populate("owner", "name phone email whatsapp role govermentId")
      // .populate("specialistsData")
      // .populate("serviceItemData")
      // .populate("reviewData");

    const totalCount = await Salon.countDocuments();

    res.status(200).json({
      success: true,
      message: "Salons fetched successfully",
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      count: salons.length,
      totalCount,
      salons,
    });
  } catch (error) {
    console.error("Error fetching salons:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching salons",
      error: error.message,
    });
  }
};


// export const getNearbySalons = async (req, res) => {
//   try {
//     const { latitude, longitude, radiusInKm = 50000 } = req.query;

//     if (!latitude || !longitude) {
//       return res.status(400).json({
//         success: false,
//         message: "Latitude and longitude are required",
//       });
//     }

//     const lat = parseFloat(latitude);
//     const lng = parseFloat(longitude);
//     const radius = parseFloat(radiusInKm);

//     if (isNaN(lat) || isNaN(lng) || isNaN(radius)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid latitude, longitude, or radius",
//       });
//     }

//     const salons = await Salon.aggregate([
//       ...geoNearStage({ lat, lng, radius }),
//       {
//         $project: {
//           _id: 1,
//           shopName: 1,
//           galleryImages: 1,
//           contactNumber: 1,
//           whatsappNumber: 1,
//           location: 1,
//           distanceInMeters: 1,
//         },
//       },

//       { $sort: { distanceInMeters: 1 } }, // nearest first
//     ]);

//     res.status(200).json({
//       success: true,
//       count: salons.length,
//       salons: salons.map((salon) => ({
//         ...salon,
//         distanceInKm: Number((salon.distanceInMeters / 1000).toFixed(2)),
//       })),
//     });
//   } catch (err) {
//     console.error("Error fetching nearby salons:", err);
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: err.message,
//     });
//   }
// };


// get nearby salons final code with all features and optimizations.
export const getNearbySalons = async (req, res) => {
  try {
    const {
      lat,
      lng,
      radius = 10,
      category,
      page = 1,
      limit = 5,
    } = req.query;

    if (!lat || !lng || !category) {
      return res.status(400).json({
        success: false,
        message: "Latitude, longitude and category are required",
      });
    }

    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);
    const skip = (pageNumber - 1) * pageSize;

    // ✅ Category logic
    let categoryFilter = [];
    if (category === "men") categoryFilter = ["men", "unisex"];
    else if (category === "women") categoryFilter = ["women", "unisex"];
    else if (category === "unisex") categoryFilter = ["unisex"];
    else {
      return res.status(400).json({
        success: false,
        message: "Invalid category",
      });
    }

    const pipeline = [
      // ✅ GEO STAGE (nearest first automatically)
      ...geoNearStage({ lat, lng, radius }),

      // ✅ Category Filter
      {
        $match: {
          salonCategory: { $in: categoryFilter },
        },
      },

      // ✅ Top 3 Popular Services
      {
        $lookup: {
          from: "serviceitems",
          let: { salonId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$providerId", "$$salonId"] },
                    { $eq: ["$providerType", "Salon"] },
                    { $eq: ["$status", "active"] }
                  ]
                }
              }
            },
            { $sort: { bookingsCount: -1 } },
            { $limit: 3 },
            {
              $project: {
                _id: 0,
                name: 1,
                price: 1
              }
            }
          ],
          as: "popularServices"
        }
      },

      // ✅ Reviews Lookup (UPDATED FOR targetType + targetId)
      {
        $lookup: {
          from: "reviews",
          let: { salonId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$targetId", "$$salonId"] },
                    { $eq: ["$targetType", "Salon"] }
                  ]
                }
              }
            },
            {
              $group: {
                _id: null,
                avgRating: { $avg: "$rating" },
                totalRatings: { $sum: 1 }
              }
            }
          ],
          as: "ratingData"
        }
      },

      // ✅ Add Rating Fields
      {
        $addFields: {
          avgRating: {
            $ifNull: [{ $arrayElemAt: ["$ratingData.avgRating", 0] }, 0]
          },
          totalRatings: {
            $ifNull: [{ $arrayElemAt: ["$ratingData.totalRatings", 0] }, 0]
          }
        }
      },

      // ✅ Sort by Nearest Only
      { $sort: { distanceInMeters: 1 } },

      // ✅ Pagination
      { $skip: skip },
      { $limit: pageSize },

      // ✅ Final Projection (Offer Removed)
      {
        $project: {
          _id: 1,
          shopName: 1,
          salonCategory: 1,
          image: { $arrayElemAt: ["$galleryImages", 0] },
          distanceInMeters: 1,
          avgRating: { $round: ["$avgRating", 1] },
          totalRatings: 1,
          popularServices: 1,
          offersHomeService: 1
        }
      }
    ];

    const salons = await Salon.aggregate(pipeline);

    return res.status(200).json({
      success: true,
      message: "Nearby salons fetched successfully",
      page: pageNumber,
      limit: pageSize,
      count: salons.length,
      data: salons,
    });

  } catch (error) {
    console.error("Error fetching nearby salons:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch nearby salons",
    });
  }
};



// GET /home-salons?category=men&lat=28.61&lng=77.20&radius=10
export const getHomeSalonsByCategory = async (req, res) => {
  console.log(req.query);
  try {
    const { category, lat, lng, radius = 50000 } = req.query;

    if (!category || !lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "category, lat and lng are required",
      });
    }

    const salons = await Salon.aggregate([
      ...geoNearStage({ lat, lng, radius }),

      // filter by salon category
      {
        $match: {
          salonCategory: category,
        },
      },

      {
        $project: {
          shopName: 1,
          salonCategory: 1,
          shopType: 1,
          galleryImages: 1,
          location: 1,
          distanceInMeters: 1,
        },
      },
      { $sort: { distanceInMeters: 1 } },
      { $limit: 20 },
    ]);

    // ✅ NO SALON FOUND CASE
    if (!salons || salons.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        message: "No salon found for this category near your location",
        data: [],
      });
    }

    // attach service categories (max 3 per salon)
    const salonsWithCategories = await Promise.all(
      salons.map(async (salon) => {
        const categories = await ServiceItem.aggregate([
          {
            $match: {
              providerType: "salon",
              providerId: salon._id,
            },
          },
          {
            $lookup: {
              from: "categories",
              localField: "category",
              foreignField: "_id",
              as: "categoryData",
            },
          },
          { $unwind: "$categoryData" },
          {
            $group: {
              _id: "$categoryData._id",
              name: { $first: "$categoryData.name" },
            },
          },
          { $limit: 3 },
        ]);

        return {
          ...salon,
          distanceInKm: salon.distanceInMeters / 1000,
          categories,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: salonsWithCategories.length,
      data: salonsWithCategories,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};


export const getSalonById = async (req, res) => {
  try {
    const { salonId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(salonId)) {
      return res.status(400).json({ message: "Invalid salon ID" });
    }

    // Fetch the salon
    const salon = await Salon.findById(salonId)
      .populate("specialistsData")
      .populate("reviewData");

    if (!salon) {
      return res.status(404).json({ message: "Salon not found" });
    }

    // Aggregate service categories
    const serviceCategories = await ServiceItem.aggregate([
      { $match: { providerType: "salon", providerId: salon._id } },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "categoryData",
        },
      },
      { $unwind: "$categoryData" },
      {
        $group: {
          _id: "$categoryData._id",
          name: { $first: "$categoryData.name" },
        },
      },
    ]);

    console.log("Fetched salon with categories:", salon);

    // Send salon + service categories in response
    res.status(200).json({
      success: true,
      data: {
        ...salon.toObject(), // convert Mongoose document to plain JS object
        serviceCategories,   // include aggregated categories
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

export const getSalonDetails = async (req, res) => {
  try {
    const userId = req.userId;
    
    // Find salon by owner userId and populate specialists
    const salon = await Salon.findOne({ owner: userId }).populate({
    path: "specialistsData",
    options: { sort: { createdAt: -1 } }
  });
    if (!salon) {
      return res.status(404).json({ success: false, message: "Salo n not found" });
    }
    res.status(200).json({
        success: true,
        salon
    });
    } catch (error) {
    console.error("Error fetching salon details:", error);
    res.status(500).json({
        success: false,
        message: "Server error while fetching salon details",
        error: error.message,
    });
  }
};


export const getUnverifiedSalons = async (req, res) => {
  try {
    const salons = await Salon.find({ verifiedByAdmin: false })
      .populate("owner", "name email phone")
      .lean();
    res.status(200).json({ success: true, message: "Unverified salons fetched successfully", data: salons });
    console.log("Unverified salons fetched:", salons);
  } catch (error) {
    console.error("Error fetching unverified salons:", error);
    res.status(500).json({ success: false, message: "Server error while fetching unverified salons", error: error.message });
  }
};


export const verifySalonByAdmin = async (req, res) => {
  try {
    const { salonId } = req.params;
    const salon = await Salon.findByIdAndUpdate(
      salonId,
      { verifiedByAdmin: true },
      { new: true }
    );
    if (!salon) {
      return res.status(404).json({ message: "Salon not found" });
    }

    res.status(200).json({ success: true, message: "Salon verified successfully", salon });
  } catch (error) {
    console.error("Error verifying salon:", error);
    res.status(500).json({ message: "Server error while verifying salon", error: error.message });
  }
};