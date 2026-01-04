import Salon from "../models/Salon.js";
import AddOn from "../models/AddOn.js";

export const createAddOn = async (req, res) => {
  try {
    const userId = req.userId;
    const salon = await Salon.findOne({ owner: userId });
    if (!salon) {
      return res.status(404).json({ success: false, message: "Salon not found" });
    }
    const { name, price, duration, imageURL, isRecommended, providerType } = req.body;
    
    if(!name || !price || !providerType){
      return  res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const newAddOn = {
      name,
      price,
      duration,
      imageURL,
      isRecommended,
      providerType,
      providerId: salon._id,
    };
    await AddOn.create(newAddOn);
    res.status(201).json({ success: true, message: "AddOn created successfully", addOn: newAddOn });
  } catch (error) {
    console.error("Error creating service:", error);
    res.status(500).json({ success: false, message: "Server error while creating service", error: error.message });
  }
};

export const getAddOns = async (req, res) => {
  try {
    const userId = req.userId;
    const salon = await Salon.findOne({ owner: userId });
    if (!salon) {
      return res.status(404).json({ success: false, message: "Salon not found" });
    }
    const addOns = await AddOn.find({ providerId: salon._id });
    res.status(200).json({ success: true, addOns });
  } catch (error) {
    console.error("Error fetching AddOns:", error);
    res.status(500).json({ success: false, message: "Server error while fetching AddOns", error: error.message });
  }
};

export const updateAddOn = async (req, res) => {
  try {
    const userId = req.userId;
    const salon = await Salon.findOne({ owner: userId });
    if (!salon) {
      return res.status(404).json({ success: false, message: "Salon not found" });
    }
    const { addOnId } = req.params;

    const addOn = await AddOn.findOne({ _id: addOnId, providerId: salon._id });
    if (!addOn) {
      return res.status(404).json({ success: false, message: "AddOn not found or not authorized" });
    }
    const updateData = req.body;

    const updatedAddOn = await AddOn.findOneAndUpdate(
      { _id: addOnId, providerId: salon._id },
      { $set: updateData },
      { new: true }
    );
    res.status(200).json({ success: true, message: "AddOn updated successfully", addOn: updatedAddOn });
  } catch (error) {
    console.error("Error updating AddOn:", error);
    res.status(500).json({ success: false, message: "Server error while updating AddOn", error: error.message });
  }
};

export const deleteAddOn = async (req, res) => {
  try {
    const userId = req.userId;
    const salon = await Salon.findOne({ owner: userId });
    if (!salon) {
      return res.status(404).json({ success: false, message: "Salon not found" });
    }
    const { addOnId } = req.params;

    const addOn = await AddOn.findOneAndDelete({ _id: addOnId, providerId: salon._id });
    if (!addOn) {
      return res.status(404).json({ success: false, message: "AddOn not found or not authorized" });
    }
    res.status(200).json({ success: true, message: "AddOn deleted successfully" });
  } catch (error) {
    console.error("Error deleting AddOn:", error);
    res.status(500).json({ success: false, message: "Server error while deleting AddOn", error: error.message });
  }
};