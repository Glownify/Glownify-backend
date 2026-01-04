import Offer from "../models/Offer.js";

export const createOffer = async (req, res) => {
  try {
    const {
      title,
      description,
      discountType,
      discountValue,
      minBookingAmount,
      code,
      validUntil,
      category,
    } = req.body;

    // Validate required fields
    if (
      !title ||
      !discountType ||
      !discountValue ||
      !minBookingAmount ||
      !code ||
      !validUntil ||
      !category
    ) {
      return res
        .status(400)
        .json({ message: "All required fields must be provided." });
    }

    // Check for duplicate offer code
    const existingOffer = await Offer.findOne({ code: { $regex: new RegExp(`^${code}$`, "i") } });
    if (existingOffer) {
      return res
        .status(400)
        .json({ message: "Offer code already exists. Use a unique code." });
    }

    // Create new offer
    const newOffer = new Offer({
      title,
      description,
      discountType,
      discountValue,
      minBookingAmount,
      code,
      validUntil,
      category,
    });

    await newOffer.save();

    res.status(201).json({
      message: "Offer created successfully!",
      offer: newOffer,
    });
  } catch (error) {
    console.error("Error creating offer:", error);
    res.status(500).json({ message: "Server error while creating offer." });
  }
};

export const getAllOffers = async (req, res) => {
  try {
    const offers = await Offer.find().lean();
    res.status(200).json({ success: true, offers });
  } catch (error) {
    console.error("Error fetching offers:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching offers",
      error: error.message,
    });
  }
};

export const deleteOffer = async (req, res) => {
  try {
    const { offerId } = req.params;
    const offer = await Offer.findByIdAndDelete(offerId);
    if (!offer) {
      return res.status(404).json({ message: "Offer not found" });
    }
    res.status(200).json({ message: "Offer deleted successfully", offer });
  } catch (error) {
    console.error("Error deleting offer:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting offer",
      error: error.message,
    });
  }
};


export const updateOffer = async (req, res) => {
  try {
    const { offerId } = req.params;
    const {
      title,
      description,
      discountType,
      discountValue,
      minBookingAmount,
      code,
      validUntil,
      category,
    } = req.body;

    const offer = await Offer.findById(offerId);
    if (!offer) {
      return res.status(404).json({ message: "Offer not found." });
    }

    // Update fields if provided
    offer.title = title || offer.title;
    offer.description = description || offer.description;
    offer.discountType = discountType || offer.discountType;
    offer.discountValue = discountValue || offer.discountValue;
    offer.minBookingAmount = minBookingAmount || offer.minBookingAmount;
    offer.code = code || offer.code;
    offer.validUntil = validUntil || offer.validUntil;
    offer.category = category || offer.category;

    await offer.save();

    res.json({ message: "Offer updated successfully!", offer });
  } catch (error) {
    console.error("Error updating offer:", error);
    res.status(500).json({ message: "Server error while updating offer." });
  }
};