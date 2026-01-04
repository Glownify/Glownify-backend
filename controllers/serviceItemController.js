import Salon from "../models/Salon.js";
import ServiceItem from "../models/ServiceItem.js";

export const createServiceItem = async (req, res) => {
  try {
    const userId = req.userId;
    const salon = await Salon.findOne({ owner: userId });
    if (!salon) {
      return res.status(404).json({ success: false, message: "Salon not found" });
    }
    const { name, category, price, durationMins, discountPercent, description, serviceMode, image, providerType, addOns } = req.body;
    
    if(!name || !category || !price || !durationMins || !providerType || !serviceMode){
      return  res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const newService = {
      name,
      category,
      price,
      durationMins,
      discountPercent,
      description,
      serviceMode,
      image,
      providerType,
      providerId: salon._id,
      addOns: addOns || []
    };
    await ServiceItem.create(newService);
    res.status(201).json({ success: true, message: "Service created successfully", service: newService });
  } catch (error) {
    console.error("Error creating service:", error);
    res.status(500).json({ success: false, message: "Server error while creating service", error: error.message });
  }
};

export const updateServiceItem = async (req, res) => {
  try {
    const userId = req.userId;
    const salon = await Salon.findOne({ owner: userId });
    if (!salon) {
      return res.status(404).json({ success: false, message: "Salon not found" });
    }
    const { serviceId } = req.params;
    const updateData = req.body;

    const service = await ServiceItem.findOneAndUpdate(
      { _id: serviceId, providerId: salon._id },
      { $set: updateData },
      { new: true }
    );

    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found" });
    }

    res.status(200).json({ success: true, message: "Service updated successfully", service });
  } catch (error) {
    console.error("Error updating service:", error);
    res.status(500).json({ success: false, message: "Server error while updating service", error: error.message });
  }
};

export const deleteServiceItem = async (req, res) => {
  try {
    const userId = req.userId;
    const salon = await Salon.findOne({ owner: userId });
    if (!salon) {
      return res.status(404).json({ success: false, message: "Salon not found" });
    }
    const { serviceId } = req.params;

    const service = await ServiceItem.findOneAndDelete({ _id: serviceId, providerId: salon._id });
    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found" });
    }

    res.status(200).json({ success: true, message: "Service deleted successfully", service });
  } catch (error) {
    console.error("Error deleting service:", error);
    res.status(500).json({ success: false, message: "Server error while deleting service", error: error.message });
  }
};


export const getServiceItemsBySalon = async (req, res) => {
  try {
    const userId = req.userId;
    const salon = await Salon.findOne({ owner: userId });
    if (!salon) {
      return res.status(404).json({ success: false, message: "Salon not found" });
    }
    const services = await ServiceItem.find({ providerId: salon._id }).populate("category").lean();
    res.status(200).json({ success: true, services });
  } catch (error) {
    console.error("Error fetching services:", error);
    res.status(500).json({ success: false, message: "Server error while fetching services", error: error.message });
  }
};


export const getServiceItemsByCategory = async (req, res) => {
  console.log("Fetching services for user:", req.params);
  try {
    const { salonId, categoryId } = req.params;
    const salon = await Salon.findById(salonId);
    if (!salon) {
      return res.status(404).json({ success: false, message: "Salon not found" });
    }
    const services = await ServiceItem.find({ providerId: salon._id, category: categoryId }).lean();
    res.status(200).json({ success: true, services });
    console.log("Services fetched successfully for user:", services);
  } catch (error) {
    console.error("Error fetching services:", error);
    res.status(500).json({ success: false, message: "Server error while fetching services", error: error.message });
  }
};
