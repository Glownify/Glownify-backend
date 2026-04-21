// import Salon from "../models/Salon.js";
// import ServiceItem from "../models/ServiceItem.js";
// import mongoose from "mongoose";

// export const createServiceItem = async (req, res) => {
//   try {
//     const userId = req.userId;
//     const salon = await Salon.findOne({ owner: userId });
//     if (!salon) {
//       return res.status(404).json({ success: false, message: "Salon not found" });
//     }
//     const { name, category, price, durationMins, discountPercent, description, serviceMode, image, providerType, addOns } = req.body;
    
//     if(!name || !category || !price || !durationMins || !providerType || !serviceMode){
//       return  res.status(400).json({ success: false, message: "Missing required fields" });
//     }

//     const newService = {
//       name,
//       category,
//       price,
//       durationMins,
//       discountPercent,
//       description,
//       serviceMode,
//       image,
//       providerType,
//       providerId: salon._id,
//       addOns: addOns || []
//     };
//     await ServiceItem.create(newService);
//     res.status(201).json({ success: true, message: "Service created successfully", service: newService });
//   } catch (error) {
//     console.error("Error creating service:", error);
//     res.status(500).json({ success: false, message: "Server error while creating service", error: error.message });
//   }
// };

// export const updateServiceItem = async (req, res) => {
//   try {
//     const userId = req.userId;
//     const salon = await Salon.findOne({ owner: userId });
//     if (!salon) {
//       return res.status(404).json({ success: false, message: "Salon not found" });
//     }
//     const { serviceId } = req.params;
//     const updateData = req.body;

//     const service = await ServiceItem.findOneAndUpdate(
//       { _id: serviceId, providerId: salon._id },
//       { $set: updateData },
//       { new: true }
//     );

//     if (!service) {
//       return res.status(404).json({ success: false, message: "Service not found" });
//     }

//     res.status(200).json({ success: true, message: "Service updated successfully", service });
//   } catch (error) {
//     console.error("Error updating service:", error);
//     res.status(500).json({ success: false, message: "Server error while updating service", error: error.message });
//   }
// };

// export const deleteServiceItem = async (req, res) => {
//   try {
//     const userId = req.userId;
//     const salon = await Salon.findOne({ owner: userId });
//     if (!salon) {
//       return res.status(404).json({ success: false, message: "Salon not found" });
//     }
//     const { serviceId } = req.params;

//     const service = await ServiceItem.findOneAndDelete({ _id: serviceId, providerId: salon._id });
//     if (!service) {
//       return res.status(404).json({ success: false, message: "Service not found" });
//     }

//     res.status(200).json({ success: true, message: "Service deleted successfully", service });
//   } catch (error) {
//     console.error("Error deleting service:", error);
//     res.status(500).json({ success: false, message: "Server error while deleting service", error: error.message });
//   }
// };


// export const getServiceItemsBySalon = async (req, res) => {
//   try {
//     const userId = req.userId;
//     const salon = await Salon.findOne({ owner: userId });
//     if (!salon) {
//       return res.status(404).json({ success: false, message: "Salon not found" });
//     }
//     const services = await ServiceItem.find({ providerId: salon._id }).populate("category").lean();
//     res.status(200).json({ success: true, services });
//   } catch (error) {
//     console.error("Error fetching services:", error);
//     res.status(500).json({ success: false, message: "Server error while fetching services", error: error.message });
//   }
// };


// export const getServiceItemsByCategory = async (req, res) => {
//   console.log("Fetching services for user:", req.params);
//   try {
//     const { salonId, categoryId } = req.params;
//     const salon = await Salon.findById(salonId);
//     if (!salon) {
//       return res.status(404).json({ success: false, message: "Salon not found" });
//     }
//     const services = await ServiceItem.find({ providerId: salon._id, category: categoryId }).lean();
//     res.status(200).json({ success: true, services });
//     console.log("Services fetched successfully for user:", services);
//   } catch (error) {
//     console.error("Error fetching services:", error);
//     res.status(500).json({ success: false, message: "Server error while fetching services", error: error.message });
//   }
// };



// // API to get all service items of a salon grouped by category
// import SubService from "../models/SubService.js";
// export const getSalonServiceItems = async (req, res) => {
//   try {
//     const { salonId } = req.params;
//     const { serviceCategoryId, serviceMode } = req.query;

//     // 🔎 Validation
//     if (!salonId || !serviceCategoryId || !serviceMode) {
//       return res.status(400).json({
//         success: false,
//         message: "salonId, serviceCategoryId and serviceMode are required",
//       });
//     }

//     if (!mongoose.Types.ObjectId.isValid(salonId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid salon ID",
//       });
//     }

//     // 🔥 Step 1: Fetch Service Items
//     const serviceItems = await ServiceItem.find({
//       providerId: salonId,
//       providerType: "Salon", // fixed
//       serviceCategory: serviceCategoryId,
//       status: "active",
//       serviceMode: { $in: [serviceMode, "both"] },
//     })
//       .populate("serviceCategory", "name")
//       .lean();

//     const serviceIds = serviceItems.map(item => item._id);

//     // 🔥 Step 2: Fetch SubServices
//     const subServices = await SubService.find({
//       serviceItem: { $in: serviceIds },
//       status: "active",
//     }).lean();

//     // 🔥 Step 3: Map SubServices
//     const subServiceMap = {};
//     subServices.forEach(sub => {
//       if (!subServiceMap[sub.serviceItem]) {
//         subServiceMap[sub.serviceItem] = [];
//       }

//       subServiceMap[sub.serviceItem].push({
//         _id: sub._id,
//         name: sub.name,
//         price: sub.price,
//         durationMins: sub.durationMins,
//         imageURL: sub.imageURL,
//         description: sub.description,
//       });
//     });

//     // 🔥 Step 4: Final Response Structure
//     const formattedServices = serviceItems.map(item => ({
//       _id: item._id,
//       name: item.name,
//       description: item.description,
//       price: item.price,
//       durationMins: item.durationMins,
//       imageURL: item.imageURL,
//       status: item.status,
//       serviceMode: item.serviceMode,
//       subServices: subServiceMap[item._id] || [],
//     }));

//     return res.status(200).json({
//       success: true,
//       serviceData: {
//         category: serviceItems[0]?.serviceCategory?.name || null,
//         services: formattedServices,
//       },
//     });

//   } catch (error) {
//     console.error("Error fetching salon services:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// };




// new code according to new requirements and frontend needs
import Salon from "../models/Salon.js";
import ServiceItem from "../models/ServiceItem.js";
import IndependentProfessional from "../models/IndependentProfessional.js";
import mongoose from "mongoose";
import AddOn from "../models/AddOn.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";


// API for Add Service Item (Salon Owner and Independent Professional)
export const addServiceItem = async (req, res) => {
  try {
    const ownerId = req.user._id;

    // find salon of logged in owner
    const salon = await Salon.findOne({ owner: ownerId });

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: "Salon not found for this owner"
      });
    }

    const {
      name,
      serviceCategory,
      price,
      durationMins,
      discountPercent,
      description,
      serviceMode,
      addOns
    } = req.body;

    // basic validation
    if (!name || !serviceCategory || !price || !serviceMode || !durationMins) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing"
      });
    }

    // duplicate service check
    const existingService = await ServiceItem.findOne({
      name,
      providerId: salon._id,
      providerType: "Salon"
    });

    if (existingService) {
      return res.status(409).json({
        success: false,
        message: "Service already exists in this salon"
      });
    }

    // Handle image upload to Cloudinary
    let imageURL = null;
    if (req.file) {
      try {
        const uploadResults = await uploadToCloudinary([req.file], "glownify/services");
        if (uploadResults && uploadResults.length > 0) {
          imageURL = uploadResults[0].secure_url;
        }
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        return res.status(500).json({
          success: false,
          message: "Failed to upload image to Cloudinary"
        });
      }
    }

    const service = await ServiceItem.create({
      name,
      serviceCategory,
      price,
      durationMins,
      discountPercent,
      description,
      imageURL,
      serviceMode,
      addOns,

      providerType: "Salon",
      providerId: salon._id
    });

    return res.status(201).json({
      success: true,
      message: "Service added successfully",
      data: service
    });

  } catch (error) {
    console.error("Add Service Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};



// API for Get Service Items (Salon Owner and Independent Professional)
// export const getProviderServiceItems = async (req, res) => {
//   try {

//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;

//     const skip = (page - 1) * limit;

//     let providerId;

//     // ✅ If Salon Owner
//     if (req.user.role === "salon_owner") {

//       const salon = await Salon.findOne({ owner: req.userId });

//       if (!salon) {
//         return res.status(404).json({
//           success: false,
//           message: "Salon not found for this owner"
//         });
//       }

//       providerId = salon._id;
//     }

//     // ✅ If Independent Professional
//     if (req.user.role === "independent_pro") {
//       providerId = req.userId;
//     }

//     // Step 2: get service items
//     const serviceItems = await ServiceItem.find({ providerId })
//       .skip(skip)
//       .limit(limit)
//       .sort({ createdAt: -1 });

//     const total = await ServiceItem.countDocuments({ providerId });

//     res.status(200).json({
//       success: true,
//       page,
//       limit,
//       total,
//       totalPages: Math.ceil(total / limit),
//       data: serviceItems
//     });

//   } catch (error) {
//     console.error("Get Service Items Error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server Error"
//     });
//   }
// };

// API for Get Service Items by Provider (Salon Owner and Independent Professional) with gender based filtering for independent professionals
export const getProviderServiceItems = async (req, res) => {
  try {

    const { gender } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    let providerId;

    // ✅ Salon Owner
    if (req.user.role === "salon_owner") {
      const salon = await Salon.findOne({ owner: req.userId });

      if (!salon) {
        return res.status(404).json({
          success: false,
          message: "Salon not found for this owner"
        });
      }

      providerId = salon._id;
    }

    // ✅ Independent Professional
    if (req.user.role === "independent_professional") {
      const independent = await IndependentProfessional.findOne({ user: req.userId });

      if (!independent) {
        return res.status(404).json({
          success: false,
          message: "Independent professional not found"
        });
      }

      providerId = independent._id;
    }

    // ✅ Base match
    const matchStage = {
      providerId: providerId
    };

    // ✅ Aggregation pipeline
    const pipeline = [
      { $match: matchStage },

      {
        $lookup: {
          from: "servicecategories", // collection name (lowercase + plural)
          localField: "serviceCategory",
          foreignField: "_id",
          as: "category"
        }
      },

      { $unwind: "$category" },

      // 🔥 Optional gender filter
      ...(gender ? [{ $match: { "category.gender": gender } }] : []),

      { $sort: { createdAt: -1 } },

      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: limit }
          ],
          totalCount: [
            { $count: "count" }
          ]
        }
      }
    ];

    const result = await ServiceItem.aggregate(pipeline);

    const serviceItems = result[0].data;
    const total = result[0].totalCount[0]?.count || 0;

    res.status(200).json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: serviceItems
    });

  } catch (error) {
    console.error("Get Service Items Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};




// API for Get Service Item By Id 
export const getServiceItemById = async (req, res) => {
  try {

    const { id } = req.params;

    const serviceItem = await ServiceItem.findOne({
      _id: id,
      status: "active"
    });

    if (!serviceItem) {
      return res.status(404).json({
        success: false,
        message: "Service item not found"
      });
    }

    res.status(200).json({
      success: true,
      data: serviceItem
    });

  } catch (error) {

    console.error("Get Service Item Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};




// API for Update Service Item (Salon Owner and Independent Professional)
export const updateServiceItem = async (req, res) => {
  try {

    const { id } = req.params;

    const serviceItem = await ServiceItem.findById(id);

    if (!serviceItem) {
      return res.status(404).json({
        success: false,
        message: "Service item not found"
      });
    }

    let providerId;

    // salon owner
    if (req.user.role === "salon_owner") {

      const salon = await Salon.findOne({ owner: req.userId });

      if (!salon) {
        return res.status(404).json({
          success: false,
          message: "Salon not found"
        });
      }

      providerId = salon._id;
    }

    // independent professional
    if (req.user.role === "independent_pro") {
      
      const independentPro = await IndependentProfessional.findOne({ user: req.userId });

      if (!independentPro) {
        return res.status(404).json({
          success: false,
          message: "Independent professional not found"
        });
      }

      providerId = independentPro._id;
    }

    // 🔐 ownership check
    if (serviceItem.providerId.toString() !== providerId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update this service item"
      });
    }

    // update allowed fields
    const { name, description, price, durationMins, status, imageURL, serviceMode, discountPercent } = req.body;

    if (name !== undefined) serviceItem.name = name;
    if (description !== undefined) serviceItem.description = description;
    if (price !== undefined) serviceItem.price = price;
    if (durationMins !== undefined) serviceItem.durationMins = durationMins;
    if (status !== undefined) serviceItem.status = status;
    if (imageURL !== undefined) serviceItem.imageURL = imageURL;
    if (serviceMode !== undefined) serviceItem.serviceMode = serviceMode;
    if (discountPercent !== undefined) serviceItem.discountPercent = discountPercent;

    await serviceItem.save();

    res.status(200).json({
      success: true,
      message: "Service item updated successfully",
      data: serviceItem
    });

  } catch (error) {

    console.error("Update Service Item Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};




// API for Delete Service Item (Salon Owner and Independent Professional)
export const deleteServiceItem = async (req, res) => {
  try {

    const { id } = req.params;

    const serviceItem = await ServiceItem.findById(id);

    if (!serviceItem) {
      return res.status(404).json({
        success: false,
        message: "Service item not found"
      });
    }

    let providerId;

    // salon owner
    if (req.user.role === "salon_owner") {

      const salon = await Salon.findOne({ owner: req.userId });

      if (!salon) {
        return res.status(404).json({
          success: false,
          message: "Salon not found"
        });
      }

      providerId = salon._id;
    }

    // salon owner
    if (req.user.role === "independent_pro") {

      const independentPro = await IndependentProfessional.findOne({ user: req.userId });

      if (!independentPro) {
        return res.status(404).json({
          success: false,
          message: "Independent professional not found"
        });
      }

      providerId = independentPro._id;
    }

    // 🔐 ownership check
    if (serviceItem.providerId.toString() !== providerId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete this service item"
      });
    }

    // await serviceItem.deleteOne();

    // soft delete - to maintain data integrity in bookings and analytics
    /* -------- Soft Delete -------- */
    serviceItem.status = "inactive";
    await serviceItem.save();

    res.status(200).json({
      success: true,
      message: "Service item deleted successfully"
    });

  } catch (error) {

    console.error("Delete Service Item Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};




// API for Get Service Items by Salon with AddOns (For Customers) - with filtering based on service category and service mode (home/ salon/ both)
export const getSalonServiceItems = async (req, res) => {
  try {
    const { salonId } = req.params;
    const { serviceCategoryId, serviceMode } = req.query;

    //  Validation
    if (!salonId || !serviceCategoryId || !serviceMode) {
      return res.status(400).json({
        success: false,
        message: "salonId, serviceCategoryId and serviceMode are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(salonId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid salon ID",
      });
    }

    // Check salon exists
    const salon = await Salon.findById(salonId);
    if (!salon) {
      return res.status(404).json({
        success: false,
        message: "Salon not found",
      });
    }

    // Step 1: Fetch Services (FILTERED)
    const services = await ServiceItem.find({
      providerId: salonId,
      providerType: "Salon",
      serviceCategory: serviceCategoryId,
      status: "active",
      serviceMode: { $in: [serviceMode, "both"] },
    })
      .populate({
          path: "addOnDetails",
          select: "name price duration imageURL isRecommended"
        })
      .select("name price durationMins description imageURL serviceMode")
      .lean();

    const serviceIds = services.map((s) => s._id);

    // Step 2: Fetch AddOns
    const addons = await AddOn.find({
      serviceItemId: { $in: serviceIds },
    })
      .select("name price duration imageURL isRecommended serviceItemId")
      .lean();

    // Step 3: Map Addons → service wise
    const addonMap = {};

    addons.forEach((addon) => {
      const key = addon.serviceItemId.toString();

      if (!addonMap[key]) {
        addonMap[key] = [];
      }

      addonMap[key].push({
        _id: addon._id,
        name: addon.name,
        price: addon.price,
        duration: addon.duration,
        imageURL: addon.imageURL,
        isRecommended: addon.isRecommended,
      });
    });

    // Step 4: Final Response
    const formattedServices = services.map((service) => ({
      _id: service._id,
      name: service.name,
      description: service.description,
      price: service.price,
      durationMins: service.durationMins,
      imageURL: service.imageURL,
      serviceMode: service.serviceMode,
      addons: service.addOnDetails || [], // important
    }));

    return res.status(200).json({
      success: true,
      count: formattedServices.length,
      data: formattedServices,
    });

  } catch (error) {
    console.error("Get Salon Services Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};




// API for Get Service Items by Salon with AddOns (For Customers) - This is a public API, no authentication required
export const getAllServiceItemsBySalon = async (req, res) => {
  try {
    const { salonId } = req.params;

    if (!salonId) {
      return res.status(400).json({ message: "Salon ID is required" });
    }

    const serviceItems = await ServiceItem.find({
      providerId: salonId,
      status: "active",
    })
      .populate("serviceCategory", "name")
      .lean();

    const grouped = {};

    serviceItems.forEach((item) => {
      const categoryName = item.serviceCategory?.name || "Uncategorized";

      if (!grouped[categoryName]) {
        grouped[categoryName] = {
          category: categoryName,
          items: [],
        };
      }

      grouped[categoryName].items.push(item);
    });

    return res.status(200).json({
      salonId,
      categories: Object.values(grouped),
    });

  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};
