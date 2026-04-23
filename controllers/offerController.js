import Offer from "../models/Offer.js";
import Salon from "../models/Salon.js";
import IndependentProfessional from "../models/IndependentProfessional.js";

// Helper to get providerId and providerType from logged in user
const getProviderInfo = async (user) => {
  if (user.role === "salon_owner") {
    const salon = await Salon.findOne({ owner: user._id });
    if (!salon) return null;
    return { providerId: salon._id, providerType: "Salon" };
  }

  if (user.role === "independent_professional") {
    const independent = await IndependentProfessional.findOne({ user: user._id });
    if (!independent) return null;
    return { providerId: independent._id, providerType: "IndependentProfessional" };
  }

  return null;
};

export const createOffer = async (req, res) => {
  try {
    const provider = await getProviderInfo(req.user);
    if (!provider) {
      return res.status(404).json({ success: false, message: "Provider not found" });
    }

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

    if (!title || !description || !discountType || !discountValue || !minBookingAmount || !code || !validUntil || !category) {
      return res.status(400).json({ success: false, message: "All required fields must be provided." });
    }

    const existingOffer = await Offer.findOne({ code: { $regex: new RegExp(`^${code}$`, "i") } });
    if (existingOffer) {
      return res.status(400).json({ success: false, message: "Offer code already exists. Use a unique code." });
    }

    const newOffer = await Offer.create({
      title,
      description,
      discountType,
      discountValue,
      minBookingAmount,
      code,
      validUntil,
      category,
      providerId: provider.providerId,
      providerType: provider.providerType,
    });

    res.status(201).json({ success: true, message: "Offer created successfully!", offer: newOffer });
  } catch (error) {
    console.error("Error creating offer:", error);
    res.status(500).json({ success: false, message: "Server error while creating offer." });
  }
};

export const getAllOffers = async (req, res) => {
  try {
    const provider = await getProviderInfo(req.user);
    if (!provider) {
      return res.status(404).json({ success: false, message: "Provider not found" });
    }

    const offers = await Offer.find({ providerId: provider.providerId }).lean();
    res.status(200).json({ success: true, message: "Offers fetched successfully", offers });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error while fetching offers", error: error.message });
  }
};

export const deleteOffer = async (req, res) => {
  try {
    const provider = await getProviderInfo(req.user);
    if (!provider) {
      return res.status(404).json({ success: false, message: "Provider not found" });
    }

    const { offerId } = req.params;
    const offer = await Offer.findOne({ _id: offerId, providerId: provider.providerId });

    if (!offer) {
      return res.status(404).json({ success: false, message: "Offer not found" });
    }

    await offer.deleteOne();
    res.status(200).json({ success: true, message: "Offer deleted successfully", offer });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error while deleting offer", error: error.message });
  }
};

export const updateOffer = async (req, res) => {
  try {
    const provider = await getProviderInfo(req.user);
    if (!provider) {
      return res.status(404).json({ success: false, message: "Provider not found" });
    }

    const { offerId } = req.params;
    const offer = await Offer.findOne({ _id: offerId, providerId: provider.providerId });

    if (!offer) {
      return res.status(404).json({ success: false, message: "Offer not found." });
    }

    const { title, description, discountType, discountValue, minBookingAmount, code, validUntil, category } = req.body;

    offer.title = title || offer.title;
    offer.description = description || offer.description;
    offer.discountType = discountType || offer.discountType;
    offer.discountValue = discountValue || offer.discountValue;
    offer.minBookingAmount = minBookingAmount || offer.minBookingAmount;
    offer.code = code || offer.code;
    offer.validUntil = validUntil || offer.validUntil;
    offer.category = category || offer.category;

    await offer.save();

    res.status(200).json({ success: true, message: "Offer updated successfully!", offer });
  } catch (error) {
    console.error("Error updating offer:", error);
    res.status(500).json({ success: false, message: "Server error while updating offer." });
  }
};
