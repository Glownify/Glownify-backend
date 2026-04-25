import Salon from "../models/Salon.js";
import Booking from "../models/Booking.js";
import ServiceItem from "../models/ServiceItem.js";
import Review from "../models/Review.js";
import {geoNearStage} from "../utils/geoPipeline.js";
import mongoose from "mongoose";
import { uploadToCloudinary } from "../utils/cloudinary.js";


// get nearby salons final code with all features and optimizations. 
// export const getNearbySalons = async (req, res) => {
//   try {
//     const {
//       lat,
//       lng,
//       radius = 10,
//       category,
//       page = 1,
//       limit = 5,
//     } = req.query;

//     if (!lat || !lng || !category) {
//       return res.status(400).json({
//         success: false,
//         message: "Latitude, longitude and category are required",
//       });
//     }

//     const pageNumber = parseInt(page);
//     const pageSize = parseInt(limit);
//     const skip = (pageNumber - 1) * pageSize;

//     // ✅ Category logic
//     let categoryFilter = [];
//     if (category === "men") categoryFilter = ["men", "unisex"];
//     else if (category === "women") categoryFilter = ["women", "unisex"];
//     else if (category === "unisex") categoryFilter = ["unisex"];
//     else {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid category",
//       });
//     }

//     const pipeline = [
//       // ✅ GEO STAGE (nearest first automatically)
//       ...geoNearStage({ lat, lng, radius }),

//       // ✅ Category Filter
//       {
//         $match: {
//           targetGender: { $in: categoryFilter },
//         },
//       },

//       // ✅ Top 3 Popular Services
//       {
//         $lookup: {
//           from: "serviceitems",
//           let: { salonId: "$_id" },
//           pipeline: [
//             {
//               $match: {
//                 $expr: {
//                   $and: [
//                     { $eq: ["$providerId", "$$salonId"] },
//                     { $eq: ["$providerType", "Salon"] },
//                     { $eq: ["$status", "active"] }
//                   ]
//                 }
//               }
//             },
//             { $sort: { bookingsCount: -1 } },
//             { $limit: 3 },
//             {
//               $project: {
//                 _id: 0,
//                 name: 1,
//                 price: 1
//               }
//             }
//           ],
//           as: "popularServices"
//         }
//       },

//       // ✅ Reviews Lookup (UPDATED FOR targetType + targetId)
//       {
//         $lookup: {
//           from: "reviews",
//           let: { salonId: "$_id" },
//           pipeline: [
//             {
//               $match: {
//                 $expr: {
//                   $and: [
//                     { $eq: ["$targetId", "$$salonId"] },
//                     { $eq: ["$targetType", "Salon"] }
//                   ]
//                 }
//               }
//             },
//             {
//               $group: {
//                 _id: null,
//                 avgRating: { $avg: "$rating" },
//                 totalRatings: { $sum: 1 }
//               }
//             }
//           ],
//           as: "ratingData"
//         }
//       },

//       // ✅ Add Rating Fields
//       {
//         $addFields: {
//           avgRating: {
//             $ifNull: [{ $arrayElemAt: ["$ratingData.avgRating", 0] }, 0]
//           },
//           totalRatings: {
//             $ifNull: [{ $arrayElemAt: ["$ratingData.totalRatings", 0] }, 0]
//           }
//         }
//       },

//       // ✅ Sort by Nearest Only
//       { $sort: { distanceInMeters: 1 } },

//       // ✅ Pagination
//       { $skip: skip },
//       { $limit: pageSize },

//       // ✅ Final Projection (Offer Removed)
//       {
//         $project: {
//           _id: 1,
//           shopName: 1,
//           targetGender: 1,
//           image: { $arrayElemAt: ["$galleryImages", 0] },
//           distanceInMeters: 1,
//           avgRating: { $round: ["$avgRating", 1] },
//           totalRatings: 1,
//           popularServices: 1,
//           offersHomeService: 1
//         }
//       }
//     ];

//     const salons = await Salon.aggregate(pipeline);

//     return res.status(200).json({
//       success: true,
//       message: "Nearby salons fetched successfully",
//       page: pageNumber,
//       limit: pageSize,
//       count: salons.length,
//       data: salons,
//     });

//   } catch (error) {
//     console.error("Error fetching nearby salons:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch nearby salons",
//     });
//   }
// };

export const getNearbySalons = async (req, res) => {
  try {
    const {
      lat,
      lng,
      radius = 10,
      category,
      page = 1,
      limit = 10,
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

    // 🔥 COMMON PIPELINE (without skip/limit)
    const basePipeline = [
      ...geoNearStage({ lat, lng, radius }), // ✅ already sorts by distance

      {
        $match: {
          targetGender: { $in: categoryFilter },
        },
      },

      // ✅ Popular Services
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
                    { $eq: ["$status", "active"] },
                  ],
                },
              },
            },
            { $sort: { bookingsCount: -1 } },
            { $limit: 3 },
            {
              $project: { _id: 0, name: 1, price: 1 },
            },
          ],
          as: "popularServices",
        },
      },

      // ✅ Reviews
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
                    { $eq: ["$targetType", "Salon"] },
                  ],
                },
              },
            },
            {
              $group: {
                _id: null,
                avgRating: { $avg: "$rating" },
                totalRatings: { $sum: 1 },
              },
            },
          ],
          as: "ratingData",
        },
      },

      {
        $addFields: {
          avgRating: {
            $ifNull: [{ $arrayElemAt: ["$ratingData.avgRating", 0] }, 0],
          },
          totalRatings: {
            $ifNull: [{ $arrayElemAt: ["$ratingData.totalRatings", 0] }, 0],
          },
        },
      },

      // ❗ IMPORTANT: ensure nearest first
      { $sort: { distanceInMeters: 1 } },
    ];

    // ✅ DATA PIPELINE (with pagination)
    const dataPipeline = [
      ...basePipeline,
      { $skip: skip },
      { $limit: pageSize },
      {
        $project: {
          _id: 1,
          shopName: 1,
          targetGender: 1,
          image: { $arrayElemAt: ["$galleryImages", 0] },
          distanceInMeters: 1,
          avgRating: { $round: ["$avgRating", 1] },
          totalRatings: 1,
          popularServices: 1,
          offersHomeService: 1,
        },
      },
    ];

    // ✅ COUNT PIPELINE (NO SKIP/LIMIT)
    const countPipeline = [
      ...basePipeline,
      { $count: "total" },
    ];

    const [salons, countResult] = await Promise.all([
      Salon.aggregate(dataPipeline),
      Salon.aggregate(countPipeline),
    ]);

    const total = countResult[0]?.total || 0;
    const totalPages = Math.ceil(total / pageSize);

    return res.status(200).json({
      success: true,
      message: "Nearby salons fetched successfully",
      page: pageNumber,
      limit: pageSize,
      total,
      totalPages,
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




// Final Code for get salon by ID for salon details page. It includes distance calculation, isOpenNow logic and optimized aggregation pipeline.
// export const getSalonByID = async (req, res) => {
//   try {
//     const { salonId } = req.params;
//     const { lat, lng } = req.query;

//     if (!salonId) {
//       return res.status(400).json({
//         success: false,
//         message: "Salon ID is required",
//       });
//     }

//     const salonObjectId = new mongoose.Types.ObjectId(salonId);

//     let pipeline = [];

//     // If location provided → use geoNear
//     if (lat && lng) {
//       pipeline.push({
//         $geoNear: {
//           near: {
//             type: "Point",
//             coordinates: [parseFloat(lng), parseFloat(lat)],
//           },
//           distanceField: "distance",
//           spherical: true,
//           query: { _id: salonObjectId },
//         },
//       });
//     } else {
//       pipeline.push({
//         $match: { _id: salonObjectId },
//       });
//     }

//     pipeline.push({
//       $project: {
//         shopName: 1,
//         about: 1,
//         targetGender: 1,
//         contactNumber: 1,
//         offersHomeService: 1,
//         verifiedByAdmin: 1,
//         openingHours: 1,
//         logoUrl: 1,
//         coverImageUrl: 1,
//         galleryImages: 1,
//         "location.address": 1,
//         "location.city": 1,
//         "location.state": 1,
//         distance: {
//           $cond: {
//             if: { $ifNull: ["$distance", false] },
//             then: { $divide: ["$distance", 1000] }, // meters → km
//             else: null,
//           },
//         },
//       },
//     });

//     const result = await Salon.aggregate(pipeline);

//     if (!result.length) {
//       return res.status(404).json({
//         success: false,
//         message: "Salon not found",
//       });
//     }

//     const salon = result[0];

//     // 🔥 Calculate isOpenNow
//     const today = new Date().toLocaleString("en-IN", { weekday: "short" });
//     const currentTime = new Date().toTimeString().slice(0, 5); // HH:mm

//     const todaySchedule = salon.openingHours?.find(
//       (day) => day.day === today
//     );

//     let isOpenNow = false;

//     if (todaySchedule) {
//       isOpenNow =
//         currentTime >= todaySchedule.start &&
//         currentTime <= todaySchedule.end;
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Salon details fetched successfully",
//       salon: {
//         ...salon,
//         isOpenNow,
//       },
//     });
//   } catch (error) {
//     console.error("Error fetching salon details:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch salon details",
//     });
//   }
// };
export const getSalonByID = async (req, res) => {
  try {
    const { salonId } = req.params;
    const { lat, lng } = req.query;

    if (!salonId) {
      return res.status(400).json({
        success: false,
        message: "Salon ID is required",
      });
    }

    const salonObjectId = new mongoose.Types.ObjectId(salonId);

    let pipeline = [];

    // ✅ use geoNear utils
    if (lat && lng) {
      pipeline.push(...geoNearStage({ lat, lng}));
      pipeline.push({
        $match: { _id: salonObjectId }
      });
    } else {
      pipeline.push({
        $match: { _id: salonObjectId }
      });
    }

    pipeline.push({
      $project: {
        shopName: 1,
        about: 1,
        targetGender: 1,
        contactNumber: 1,
        offersHomeService: 1,
        verifiedByAdmin: 1,
        openingHours: 1,
        logoUrl: 1,
        coverImageUrl: 1,
        galleryImages: 1,
        "location.address": 1,
        "location.city": 1,
        "location.state": 1,

        // ✅ SAME as getNearbySalons
        distanceInMeters: 1
      }
    });

    const result = await Salon.aggregate(pipeline);

    if (!result.length) {
      return res.status(404).json({
        success: false,
        message: "Salon not found"
      });
    }

    const salon = result[0];

    // 🔥 isOpenNow logic
    const today = new Date().toLocaleString("en-IN", { weekday: "short" });
    const currentTime = new Date().toTimeString().slice(0, 5);

    const todaySchedule = salon.openingHours?.find(
      (day) => day.day === today
    );

    let isOpenNow = false;

    if (todaySchedule) {
      isOpenNow =
        currentTime >= todaySchedule.start &&
        currentTime <= todaySchedule.end;
    }

    return res.status(200).json({
      success: true,
      message: "Salon details fetched successfully",
      salon: {
        ...salon,
        isOpenNow
      }
    });

  } catch (error) {
    console.error("Error fetching salon details:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch salon details"
    });
  }
};





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
                targetGender: category, // men / women / unisex
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
          targetGender: 1,
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
          targetGender: category,
        },
      },

      {
        $project: {
          shopName: 1,
          targetGender: 1,
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
              providerType: "Salon",
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





// Code for get salon services by salon ID.
export const getSalonServices = async (req, res) => {
  try {
    const { salonId } = req.params;

    if (!salonId) {
      return res.status(400).json({
        success: false,
        message: "Salon ID is required",
      });
    }

    const salonObjectId = new mongoose.Types.ObjectId(salonId);

    const services = await ServiceItem.aggregate([
      {
        $match: {
          providerId: salonObjectId,
          providerType: "Salon",
        },
      },
      {
        $lookup: {
          from: "servicecategories",
          localField: "category",
          foreignField: "_id",
          as: "categoryData",
        },
      },
      {
        $unwind: "$categoryData",
      },
      {
        $group: {
          _id: "$categoryData._id",
          categoryName: { $first: "$categoryData.name" },
          services: {
            $push: {
              _id: "$_id",
              name: "$name",
              price: "$price",
              duration: "$duration",
              description: "$description",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          categoryId: "$_id",
          categoryName: 1,
          services: 1,
        },
      },
      {
        $sort: { categoryName: 1 },
      },
    ]);

    return res.status(200).json({
      success: true,
      count: services.length,
      categories: services,
    });
  } catch (error) {
    console.error("Error fetching salon services:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch salon services",
    });
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






// Code For get Salon Profile + Dashboard data (salon view)
import Specialist from "../models/Specialist.js";
// 🔥 Helper: check salon open or not
const isSalonOpenNow = (openingHours) => {
  const now = new Date();

  const daysMap = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const today = daysMap[now.getDay()];

  const todaySchedule = openingHours.find(d => d.day === today);

  if (!todaySchedule) return false;

  const currentTime = now.toTimeString().slice(0,5); // "HH:MM"

  return currentTime >= todaySchedule.start && currentTime <= todaySchedule.end;
};

export const getSalonProfileDashboard = async (req, res) => {
  try {

    // ✅ Step 1: get salon
    const salon = await Salon.findOne({ owner: req.userId });

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: "Salon not found"
      });
    }

    const providerId = salon._id;

    // ✅ Step 2: Parallel queries (🔥 optimized)
    const [
      totalBookings,
      uniqueCustomers,
      services,
      specialists,
      reviews,
      ratingData
    ] = await Promise.all([

      // total bookings
      Booking.countDocuments({ providerId }),

      // unique customers
      Booking.distinct("customer", { providerId }),

      // top 5 services
      ServiceItem.find({ providerId })
        .sort({ bookingsCount: -1 })
        .limit(5)
        .select("name price durationMins"),

      // top 5 specialists
      Specialist.find({ salon: providerId })
        .limit(5)
        .select("name"),

      // latest 5 reviews
      Review.find({ targetType: "Salon", targetId: providerId })
        .populate("user", "name")
        .sort({ createdAt: -1 })
        .limit(5),

      // rating aggregation
      Review.aggregate([
        {
          $match: {
            targetType: "Salon",
            targetId: providerId
          }
        },
        {
          $group: {
            _id: null,
            avgRating: { $avg: "$rating" },
            totalReviews: { $sum: 1 }
          }
        }
      ])
    ]);

    // ✅ Step 3: format rating
    const rating = {
      average: ratingData[0]?.avgRating?.toFixed(1) || 0,
      count: ratingData[0]?.totalReviews || 0
    };

    // ✅ Step 4: open status
    const isOpenNow = isSalonOpenNow(salon.openingHours);

    // ✅ Step 5: response
    res.status(200).json({
      success: true,
      data: {

        // 🏪 Salon Info
        salonInfo: {
          name: salon.shopName,
          about: salon.about,
          location: salon.location,
          contact: {
            phone: salon.contactNumber,
            whatsapp: salon.whatsappNumber
          },
          logo: salon.logoUrl,
          coverImage: salon.coverImageUrl
        },

        // ⭐ Rating
        rating,

        // 🟢 Status
        isOpenNow,

        // 🏠 Home service
        offersHomeService: salon.offersHomeService,

        // 📊 Analytics
        analytics: {
          totalBookings,
          totalCustomers: uniqueCustomers.length
        },

        // 🕒 Opening hours
        openingHours: salon.openingHours,

        // 💇 Services
        topServices: services,

        // 👨‍🔬 Specialists
        topSpecialists: specialists,

        // 💬 Reviews
        reviews: reviews.map(r => ({
          userName: r.user?.name,
          rating: r.rating,
          comment: r.comment,
          date: r.createdAt
        }))
      }
    });

  } catch (error) {
    console.error("Salon Dashboard Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};



// New code for get my salon (for salon owner) with optimized query and without unnecessary population.
export const getMySalon = async (req, res) => {
  try {
    const salon = await Salon.findOne({ owner: req.user._id }).select(
      "-onboardedBy -referredBy"
    );

    if (!salon) {
      return res.status(404).json({ success: false, message: "Salon not found" });
    }

    res.status(200).json({ success: true, salon });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};


// New code for update my salon (for salon owner) with optimized query, validation and image upload handling.
export const updateMySalon = async (req, res) => {
  try {
    const salon = await Salon.findOne({ owner: req.user._id });
    if (!salon) {
      return res.status(404).json({ success: false, message: "Salon not found" });
    }

    const {
      shopName, about, contactNumber, whatsappNumber,
      targetGender, offersHomeService,
      openingDate, openingHours, partners,
      location, deleteGalleryImages,
    } = req.body;

    const updateData = {};
    if (shopName) updateData.shopName = shopName;
    if (about !== undefined) updateData.about = about;
    if (contactNumber) updateData.contactNumber = contactNumber;
    if (whatsappNumber) updateData.whatsappNumber = whatsappNumber;
    if (targetGender && ["men", "women", "unisex"].includes(targetGender)) updateData.targetGender = targetGender;
    if (offersHomeService !== undefined) updateData.offersHomeService = offersHomeService;
    if (openingDate) updateData.openingDate = openingDate;
    if (openingHours) updateData.openingHours = openingHours;
    if (partners && salon.shopType === "partnership") updateData.partners = partners;
    if (location) updateData.location = { ...salon.location.toObject(), ...location };

    // Handle logo upload
    if (req.files?.logoImage?.length > 0) {
      const uploaded = await uploadToCloudinary(req.files.logoImage, "glownify/salon_logo");
      updateData.logoUrl = uploaded[0].secure_url;
    }

    // Handle cover upload
    if (req.files?.coverImage?.length > 0) {
      const uploaded = await uploadToCloudinary(req.files.coverImage, "glownify/salon_cover");
      updateData.coverImageUrl = uploaded[0].secure_url;
    }

    // Handle gallery - selective delete + selective add
    let currentGallery = [...salon.galleryImages];

    // Selective delete - frontend se URLs bhejo jo delete karni hain
    if (deleteGalleryImages) {
      const toDelete = Array.isArray(deleteGalleryImages) ? deleteGalleryImages : [deleteGalleryImages];
      currentGallery = currentGallery.filter(url => !toDelete.includes(url));
    }

    // Selective add - naye images upload karo
    if (req.files?.galleryImages?.length > 0) {
      const uploaded = await uploadToCloudinary(req.files.galleryImages, "glownify/salon_gallery");
      currentGallery = [...currentGallery, ...uploaded.map(img => img.secure_url)];
    }

    // Only update gallery if something changed
    if (deleteGalleryImages || req.files?.galleryImages?.length > 0) {
      updateData.galleryImages = currentGallery;
    }

    const updatedSalon = await Salon.findByIdAndUpdate(salon._id, updateData, { new: true }).select(
      "-onboardedBy -referredBy"
    );

    res.status(200).json({ success: true, message: "Salon updated successfully", salon: updatedSalon });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
