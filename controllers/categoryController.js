// import Category from "../models/Category.js";
// import ServiceItem from "../models/ServiceItem.js";

// // dont accept duplicate category names check with lowercase also
// export const createCategory = async (req, res) => {
//   try {
//     const { name, gender, icon } = req.body;

//     // Check only SAME name + SAME gender
//     const existingCategory = await Category.findOne({
//       name: { $regex: `^${name}$`, $options: "i" },
//       gender: gender,
//     });

//     if (existingCategory) {
//       return res
//         .status(400)
//         .json({ message: "Category already exists for this gender" });
//     }

//     const category = new Category({ name, gender, icon });
//     await category.save();

//     return res.status(201).json({
//       message: "Category created successfully",
//       category,
//     });
//   } catch (error) {
//     console.error("Error creating category:", error);

//     // Handle Mongo duplicate error too
//     if (error.code === 11000) {
//       return res
//         .status(400)
//         .json({ message: "Category already exists for this gender" });
//     }

//     return res.status(500).json({
//       message: "Server error while creating category",
//       error: error.message,
//     });
//   }
// };

// export const editCategory = async (req, res) => {
//   try {
//     const { categoryId } = req.params;
//     const { name, gender, icon } = req.body;

//     // 1️⃣ Check for duplicate name (case-insensitive) only in the current category
//     const existingCategory = await Category.findOne({
//       _id: { $ne: categoryId }, // exclude current category
//       name: { $regex: `^${name}$`, $options: "i" }, // case-insensitive
//       gender: gender
//     });

//     if (existingCategory) {
//       return res.status(400).json({ message: "Category name already exists" });
//     }

//     // 2️⃣ Update the category
//     const category = await Category.findByIdAndUpdate(
//       categoryId,
//       { name, icon },
//       { new: true }
//     );

//     if (!category) {
//       return res.status(404).json({ message: "Category not found" });
//     }

//     res
//       .status(200)
//       .json({ message: "Category updated successfully", category });
//   } catch (error) {
//     console.error("Error updating category:", error);
//     res.status(500).json({
//       message: "Server error while updating category",
//       error: error.message,
//     });
//   }
// };

// export const getAllCategories = async (req, res) => {
//   try {
//     const { gender } = req.query;

//     let filter = {};

//     // If gender is provided, apply filter
//     if (gender === "women" || gender === "men") {
//       filter.gender = gender;
//     }

//     const categories = await Category.find(filter).lean();

//     if (!categories || categories.length === 0) {
//       return res.status(404).json({ message: "No categories found" });
//     }

//     return res.status(200).json({
//       success: true,
//       genderApplied: gender || "none",
//       categories,
//     });

//   } catch (error) {
//     console.error("Error fetching categories:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Server error while fetching categories",
//       error: error.message,
//     });
//   }
// };


// /**
//  * Get all service items grouped by category for a specific salon
//  * @route GET /api/service-items/by-salon/:salonId
//  */
// export const getServiceItemsBySalon = async (req, res) => {
//   try {
//     const { salonId } = req.params;

//     if (!salonId) {
//       return res.status(400).json({ message: "Salon ID is required" });
//     }

//     // Fetch all active service items for the salon
//     const serviceItems = await ServiceItem.find({ providerId: salonId, status: "active" })
//       .populate("category", "name") // populate category name
//       .lean();

//     // Group service items by category
//     const groupedByCategory = serviceItems.reduce((acc, item) => {
//       const categoryName = item.category?.name || "Uncategorized";
//       if (!acc[categoryName]) {
//         acc[categoryName] = [];
//       }
//       acc[categoryName].push(item);
//       return acc;
//     }, {});

//     res.status(200).json({
//       salonId,
//       categories: groupedByCategory
//     });
//   } catch (error) {
//     console.error("Error fetching service items by salon:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// };





import Category from "../models/Category.js";
import ServiceItem from "../models/ServiceItem.js";

// dont accept duplicate category names check with lowercase also
export const createCategory = async (req, res) => {
  try {
    const { name, gender, icon } = req.body;

    if (!name || !gender) {
      return res.status(400).json({ message: "Name and gender required" });
    }

    const category = await Category.create({
      name: name.toLowerCase().trim(),
      gender,
      icon,
    });

    return res.status(201).json({
      message: "Category created successfully",
      category,
    });

  } catch (error) {

    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "Category already exists for this gender" });
    }

    return res.status(500).json({
      message: "Server error while creating category",
      error: error.message,
    });
  }
};




export const editCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name, gender, icon } = req.body;

    const category = await Category.findById(categoryId);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    if (name) category.name = name.toLowerCase().trim();
    if (gender) category.gender = gender;
    if (icon) category.icon = icon;

    await category.save();

    res.status(200).json({
      message: "Category updated successfully",
      category,
    });

  } catch (error) {

    if (error.code === 11000) {
      return res.status(400).json({
        message: "Category already exists for this gender",
      });
    }

    res.status(500).json({
      message: "Server error while updating category",
      error: error.message,
    });
  }
};


// export const getAllCategories = async (req, res) => {
//   try {
//     const { gender } = req.query;

//     let filter = {};

//     // If gender is provided, apply filter
//     if (gender === "women" || gender === "men") {
//       filter.gender = gender;
//     }

//     const categories = await Category.find(filter).lean();

//     return res.status(200).json({
//       success: true,
//       message: "Categories fetched successfully",
//       genderApplied: gender || "none",
//       count: categories.length,
//       categories,
//     });

//   } catch (error) {
//     console.error("Error fetching categories:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Server error while fetching categories",
//       error: error.message,
//     });
//   }
// };


// New Updated getAllCategories with pagination and better error handling
export const getAllCategories = async (req, res) => {
  try {
    const {
      gender,
      page = 1,
      limit = 10,
    } = req.query;

    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);
    const skip = (pageNumber - 1) * pageSize;

    let filter = { active: true };

    // ✅ Gender Filter
    const allowedGenders = ["men", "women", "unisex"];

    if (gender) {
      if (!allowedGenders.includes(gender)) {
        return res.status(400).json({
          success: false,
          message: "Invalid gender. Allowed: men | women | unisex",
        });
      }

      filter.gender = gender;
    }

    // ✅ Total count for pagination
    const total = await Category.countDocuments(filter);

    const categories = await Category.find(filter)
      .select("-createdAt -updatedAt -__v")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

    return res.status(200).json({
      success: true,
      message: "Categories fetched successfully",
      genderApplied: gender || "none",
      page: pageNumber,
      limit: pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      count: categories.length,
      categories,
    });

  } catch (error) {
    console.error("Error fetching categories:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching categories",
    });
  }
};



export const getServiceItemsBySalon = async (req, res) => {
  try {
    const { salonId } = req.params;

    if (!salonId) {
      return res.status(400).json({ message: "Salon ID is required" });
    }

    const serviceItems = await ServiceItem.find({
      providerId: salonId,
      status: "active",
    })
      .populate("category", "name")
      .lean();

    const grouped = {};

    serviceItems.forEach((item) => {
      const categoryName = item.category?.name || "Uncategorized";

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
