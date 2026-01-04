import Category from "../models/Category.js";
import ServiceItem from "../models/ServiceItem.js";

// dont accept duplicate category names check with lowercase also
export const createCategory = async (req, res) => {
  try {
    const { name, gender, icon } = req.body;

    // Check only SAME name + SAME gender
    const existingCategory = await Category.findOne({
      name: { $regex: `^${name}$`, $options: "i" },
      gender: gender,
    });

    if (existingCategory) {
      return res
        .status(400)
        .json({ message: "Category already exists for this gender" });
    }

    const category = new Category({ name, gender, icon });
    await category.save();

    return res.status(201).json({
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    console.error("Error creating category:", error);

    // Handle Mongo duplicate error too
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

    // 1️⃣ Check for duplicate name (case-insensitive) only in the current category
    const existingCategory = await Category.findOne({
      _id: { $ne: categoryId }, // exclude current category
      name: { $regex: `^${name}$`, $options: "i" }, // case-insensitive
      gender: gender
    });

    if (existingCategory) {
      return res.status(400).json({ message: "Category name already exists" });
    }

    // 2️⃣ Update the category
    const category = await Category.findByIdAndUpdate(
      categoryId,
      { name, icon },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res
      .status(200)
      .json({ message: "Category updated successfully", category });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({
      message: "Server error while updating category",
      error: error.message,
    });
  }
};

export const getAllCategories = async (req, res) => {
  try {
    const { gender } = req.query;

    let filter = {};

    // If gender is provided, apply filter
    if (gender === "women" || gender === "men") {
      filter.gender = gender;
    }

    const categories = await Category.find(filter).lean();

    if (!categories || categories.length === 0) {
      return res.status(404).json({ message: "No categories found" });
    }

    return res.status(200).json({
      success: true,
      genderApplied: gender || "none",
      categories,
    });

  } catch (error) {
    console.error("Error fetching categories:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching categories",
      error: error.message,
    });
  }
};


/**
 * Get all service items grouped by category for a specific salon
 * @route GET /api/service-items/by-salon/:salonId
 */
export const getServiceItemsBySalon = async (req, res) => {
  try {
    const { salonId } = req.params;

    if (!salonId) {
      return res.status(400).json({ message: "Salon ID is required" });
    }

    // Fetch all active service items for the salon
    const serviceItems = await ServiceItem.find({ providerId: salonId, status: "active" })
      .populate("category", "name") // populate category name
      .lean();

    // Group service items by category
    const groupedByCategory = serviceItems.reduce((acc, item) => {
      const categoryName = item.category?.name || "Uncategorized";
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(item);
      return acc;
    }, {});

    res.status(200).json({
      salonId,
      categories: groupedByCategory
    });
  } catch (error) {
    console.error("Error fetching service items by salon:", error);
    res.status(500).json({ message: "Server error" });
  }
};

