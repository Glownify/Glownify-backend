
import ServiceCategory from "../models/ServiceCategory.js";
import ServiceItem from "../models/ServiceItem.js";

// dont accept duplicate category names check with lowercase also
export const createCategory = async (req, res) => {
  try {
    const { name, gender, icon } = req.body;

    if (!name || !gender) {
      return res.status(400).json({ message: "Name and gender required" });
    }

    const serviceCategory = await ServiceCategory.create({
      name: name.toLowerCase().trim(),
      gender,
      icon,
    });

    return res.status(201).json({
      message: "Service Category created successfully",
      serviceCategory,
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




export const updateCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name, gender, icon } = req.body;

    const category = await ServiceCategory.findById(categoryId);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    if (name) category.name = name.toLowerCase().trim();
    if (gender) category.gender = gender;
    if (icon) category.icon = icon;

    await category.save();

    res.status(200).json({
      message: "Service Category updated successfully",
      category,
    });

  } catch (error) {

    if (error.code === 11000) {
      return res.status(400).json({
        message: "Service Category already exists for this gender",
      });
    }

    res.status(500).json({
      message: "Server error while updating category",
      error: error.message,
    });
  }
};



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
    const total = await ServiceCategory.countDocuments(filter);

    const categories = await ServiceCategory.find(filter)
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
