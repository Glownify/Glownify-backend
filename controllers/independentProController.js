import IndependentProfessional from "../models/IndependentProfessional.js";
import mongoose from "mongoose";
import {geoNearStage} from "../utils/geoPipeline.js";

// export const getHomeIndependentPros = async (req, res) => {
//   try {
//     const { category, lat, lng, radius = 50000 } = req.query;

//     // Map frontend category → DB gender
//     const genderMap = {
//       men: "male",
//       women: "female",
//       unisex: null,
//     };

//     const mappedGender = genderMap[category];

//     // Match stage
//     const matchStage = {};
//     if (mappedGender) {
//       matchStage.gender = mappedGender;
//     }

//     const pipeline = [
//       // GEO NEAR (must be first)
//       ...geoNearStage({ lat, lng, radius }),

//       // FILTER BY GENDER
//       { $match: matchStage },

//       // LIMIT
//       { $limit: 5 },

//       // LOOKUP USER
//       {
//         $lookup: {
//           from: "users",
//           localField: "user",
//           foreignField: "_id",
//           as: "user",
//         },
//       },
//       { $unwind: "$user" },

//       // LOOKUP SPECIALIZATIONS
//       {
//         $lookup: {
//           from: "categories",
//           localField: "specializations",
//           foreignField: "_id",
//           as: "specializations",
//         },
//       },

//       // SELECT FIELDS
//       {
//         $project: {
//           profilePhoto: 1,
//           gender: 1,
//           experienceYears: 1,
//           location: 1,
//           distanceInMeters: 1,
//           "user._id": 1,
//           "user.name": 1,
//           "specializations._id": 1,
//           "specializations.name": 1,
//           "specializations.gender": 1,
//         },
//       },
//     ];

//     const pros = await IndependentProfessional.aggregate(pipeline);

//     return res.status(200).json({
//       success: true,
//       message: "Nearby independent professionals fetched successfully",
//       data: pros,
//     });

//   } catch (error) {
//     console.error("Error fetching independent professionals:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch independent professionals",
//       error: error.message,
//     });
//   }
// };


// final working code as required by frontend
export const getHomeIndependentPros = async (req, res) => {
  try {
    const {
      category,
      lat,
      lng,
      radius = 50,      // km
      page = 1,
      limit = 5,
    } = req.query;

    if (!lat || !lng || !category) {
      return res.status(400).json({
        success: false,
        message: "Category, latitude and longitude are required",
      });
    }

    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);
    const skip = (pageNumber - 1) * pageSize;

    // Category filter
    let categoryFilter = [];
    if (category === "men") categoryFilter = ["men", "unisex"];
    else if (category === "women") categoryFilter = ["women", "unisex"];
    else if (category === "unisex") categoryFilter = ["unisex", "men", "women"];
    else {
      return res.status(400).json({
        success: false,
        message: "Invalid category",
      });
    }

    const pipeline = [
      // ✅ Reusing geo utility
      ...geoNearStage({ lat, lng, radius }),

      {
        $match: {
          serviceCategory: { $in: categoryFilter },
        },
      },

      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          pipeline: [{ $project: { name: 1, gender: 1 } }],
          as: "user",
        },
      },
      { $unwind: "$user" },

      {
        $lookup: {
          from: "categories",
          localField: "specializations",
          foreignField: "_id",
          as: "specializations",
        },
      },

      {
        $addFields: {
          specializations: { $slice: ["$specializations", 3] },
        },
      },

      {
        $lookup: {
          from: "reviews",
          let: { proId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$independent", "$$proId"] } } },
            { $group: { _id: null, avgRating: { $avg: "$rating" } } },
          ],
          as: "ratingData",
        },
      },

      {
        $addFields: {
          avgRating: {
            $ifNull: [{ $arrayElemAt: ["$ratingData.avgRating", 0] }, 0],
          },
        },
      },

      {
        $sort: { distanceInMeters: 1 },
      },

      // ✅ Pagination
      { $skip: skip },
      { $limit: pageSize },

      {
        $project: {
          profilePhoto: 1,
          experienceYears: 1,
          serviceCategory: 1,
          availabilityStatus: 1,
          distanceInMeters: 1,
          avgRating: { $round: ["$avgRating", 1] },

          "user._id": 1,
          "user.name": 1,
          "user.gender": 1,

          "specializations._id": 1,
          "specializations.name": 1,
        },
      },
    ];

    const pros = await IndependentProfessional.aggregate(pipeline);

    return res.status(200).json({
      success: true,
      message: "Nearby independent professionals fetched successfully",
      page: pageNumber,
      limit: pageSize,
      data: pros,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch independent professionals",
    });
  }
};


export const getIndependentProById = async (req, res) => {
  try {
    const { independentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(independentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid independent professional ID",
      });
    }

    const pro = await IndependentProfessional.findById(independentId)
      .populate("user")
      .populate("specializations")
      .lean();

    if (!pro) {
      return res.status(404).json({
        success: false,
        message: "Independent professional not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Independent professional fetched successfully",
      data: pro,
    });
  }
  catch (error) {
    console.error("Error fetching independent professional by ID:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch independent professional",
      error: error.message,
    });
  }
};