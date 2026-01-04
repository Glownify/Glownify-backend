import IndependentProfessional from "../models/IndependentProfessional.js";
import mongoose from "mongoose";
import {geoNearStage} from "../utils/geoPipeline.js";

export const getHomeIndependentPros = async (req, res) => {
  try {
    const { category, lat, lng, radius = 50000 } = req.query;

    // Map frontend category → DB gender
    const genderMap = {
      men: "male",
      women: "female",
      unisex: null,
    };

    const mappedGender = genderMap[category];

    // Match stage
    const matchStage = {};
    if (mappedGender) {
      matchStage.gender = mappedGender;
    }

    const pipeline = [
      // GEO NEAR (must be first)
      ...geoNearStage({ lat, lng, radius }),

      // FILTER BY GENDER
      { $match: matchStage },

      // LIMIT
      { $limit: 5 },

      // LOOKUP USER
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },

      // LOOKUP SPECIALIZATIONS
      {
        $lookup: {
          from: "categories",
          localField: "specializations",
          foreignField: "_id",
          as: "specializations",
        },
      },

      // SELECT FIELDS
      {
        $project: {
          profilePhoto: 1,
          gender: 1,
          experienceYears: 1,
          location: 1,
          distanceInMeters: 1,
          "user._id": 1,
          "user.name": 1,
          "specializations._id": 1,
          "specializations.name": 1,
          "specializations.gender": 1,
        },
      },
    ];

    const pros = await IndependentProfessional.aggregate(pipeline);

    return res.status(200).json({
      success: true,
      message: "Nearby independent professionals fetched successfully",
      data: pros,
    });

  } catch (error) {
    console.error("Error fetching independent professionals:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch independent professionals",
      error: error.message,
    });
  }
};


// import IndependentProfessional from "../models/IndependentProfessional.js";
// import Category from "../models/Category.js";

// export const getHomeIndependentPros = async (req, res) => {
//   try {
//     let { category } = req.query;
    
//     // Map frontend category → DB gender
//     const genderMap = {
//       men: "male",
//       women: "female",
//       unisex: null, // means fetch all
//     };

//     // Convert frontend gender to schema gender
//     const mappedGender = genderMap[category];

//     // Build query
//     const query = {};
//     if (mappedGender) query.gender = mappedGender;

//     const pros = await IndependentProfessional.find(query)
//       .select("profilePhoto gender experienceYears location.address specializations user")
//       .limit(5)
//       .lean()
//       .populate({
//         path: "user",
//         select: "_id name",
//       })
//       .populate({
//         path: "specializations",
//         select: "_id name gender",
//       });

//     return res.status(200).json({
//       success: true,
//       message: "Independent professionals fetched successfully",
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