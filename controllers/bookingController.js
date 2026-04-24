// controllers/booking.controller.js
import Booking from "../models/Booking.js";
import ServiceItem from "../models/ServiceItem.js";
import Salon from "../models/Salon.js";
import IndependentProfessional from "../models/IndependentProfessional.js";
import AddOn from "../models/AddOn.js";
import User from "../models/User.js";



// New booking flow for both salon and independent professional with service code generation, status management, and optional booking type filter.
export const createBooking = async (req, res) => {
  try {
    const userId = req.user._id;

    const {
      providerType,
      providerId,
      serviceItems,
      bookingDate,
      timeSlot,
      bookingType,
      serviceLocation,
    } = req.body;

    // ✅ Basic validation
    if (!serviceItems || serviceItems.length === 0) {
      return res.status(400).json({ message: "No services selected" });
    }

    if (!bookingDate || !timeSlot?.start || !timeSlot?.end) {
      return res.status(400).json({ message: "Invalid booking date/time" });
    }

    // 🔒 SLOT AVAILABILITY CHECK
    const existingBooking = await Booking.findOne({
      providerId,
      bookingDate: new Date(bookingDate),
      status: { $nin: ["cancelled"] },
      $expr: {
        $and: [
          { $lt: [timeSlot.start, "$timeSlot.end"] },
          { $gt: [timeSlot.end, "$timeSlot.start"] },
        ],
      },
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: "Slot already booked, please choose another time",
      });
    }

    let totalAmount = 0;
    const finalServiceItems = [];

    // 🔁 Process services
    for (const item of serviceItems) {
      const service = await ServiceItem.findById(item.serviceId);

      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      if (
        service.providerId.toString() !== providerId ||
        service.providerType !== providerType
      ) {
        return res.status(400).json({ message: "Invalid service provider" });
      }

      if (service.status !== "active") {
        return res
          .status(400)
          .json({ message: `${service.name} is not available` });
      }

      // 💰 Price snapshot
      const servicePrice =
        service.price - (service.price * service.discountPercent) / 100;

      const quantity = item.quantity || 1;
      let serviceTotal = servicePrice * quantity;

      let addonTotal = 0;
      let finalAddons = [];

      // 🔁 Addons
      if (item.addons && item.addons.length > 0) {
        for (const ad of item.addons) {
          const addon = await AddOn.findById(ad.addonId);

          if (!addon) {
            return res.status(404).json({ message: "Addon not found" });
          }

          if (addon.serviceItemId.toString() !== item.serviceId) {
            return res
              .status(400)
              .json({ message: "Invalid addon for selected service" });
          }

          const addonQty = ad.quantity || 1;
          const addonPrice = addon.price;

          const addonCost = addonPrice * addonQty;
          addonTotal += addonCost;

          finalAddons.push({
            addon: addon._id,
            quantity: addonQty,
            price: addonPrice,
          });
        }
      }

      totalAmount += serviceTotal + addonTotal;

      finalServiceItems.push({
        service: service._id,
        quantity,
        price: servicePrice,
        addons: finalAddons,
      });
    }

    // 🧾 Create booking
    const booking = await Booking.create({
      customer: userId,
      providerType,
      providerId,
      serviceItems: finalServiceItems,
      bookingDate,
      timeSlot,
      bookingType,
      serviceLocation: bookingType === "home_service" ? serviceLocation : null,
      totalAmount,
    });

    return res.status(201).json({
      success: true,
      message: "Booking created successfully",
      booking,
    });
  } catch (error) {
    console.error("Booking Error:", error.message);

    return res.status(400).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};





export const getBookingByUserId = async (req, res) => {
  const userId = req.userId;

  try {
    const bookings = await Booking.find({ customer: userId })
      .populate({
        path: "providerId",
        select: "shopName location.address salonCategory",
      })
      .populate({
        path: "serviceItems.service",
        select: "name price durationMins image",
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({ bookings });
  } catch (error) {
    console.error("Get Booking Error:", error);
    return res.status(500).json({
      message: "Failed to retrieve bookings",
      error: error.message,
    });
  }
};

export const getBookingBySalonId = async (req, res) => {
  try {
    const userId = req.userId; // authenticated salon/provider ID

    const salon = await Salon.findOne({ owner: userId });
    if (!salon) {
      return res.status(404).json({ message: "Salon not found for this user" });
    }

    const bookings = await Booking.find({ providerId: salon._id })
      .populate({
        path: "customer",
        select: "name email phone",
      })
      .populate({
        path: "serviceItems.service",
        select: "name price durationMins image",
      })
      .sort({ createdAt: -1 });

      console.log("Bookings for Salon:", bookings);

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("Get Booking Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve bookings",
      error: error.message,
    });
  }
};









// --- Below Codes are new code.
// For both salon and independent provider to fetch their bookings with optional status filter
export const getBookingsByProvider = async (req, res) => {
  try {

    const { status, bookingType, page = 1, limit = 10 } = req.query;
    const userId = req.userId;

    let providerId;

    // check salon owner
    const salon = await Salon.findOne({ owner: userId });

    if (salon) {
      providerId = salon._id;
    } else {
      // check independent professional
      const independent = await IndependentProfessional.findOne({ user: userId });

      if (!independent) {
        return res.status(404).json({
          success: false,
          message: "Provider not found"
        });
      }

      providerId = independent._id;
    }

    let filter = { providerId };

    // status filter
    if (status) {
      filter.status = status;
    }

    // NEW bookingType filter
    if (bookingType) {
      filter.bookingType = bookingType;
    }

    const skip = (page - 1) * limit;

    const bookings = await Booking.find(filter)
      .populate("customer", "name phone")
      .populate("specialist", "name")
      .populate("serviceItems.service", "name price")
      .populate({
        path: "serviceItems.addons.addon",
        select: "name price duration imageURL isRecommended"
      })
      .sort({ bookingDate: -1 })
      .skip(skip)
      .limit(Number(limit));

    const totalBookings = await Booking.countDocuments(filter);

    const pendingCount = await Booking.countDocuments({ providerId, status: "pending" });

    res.status(200).json({
      success: true,
      totalBookings,
      pendingCount,
      currentPage: Number(page),
      totalPages: Math.ceil(totalBookings / limit),
      bookings
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};



// For provider(salon + independent professional) to accept a pending booking and generate service code
export const acceptBookingByProvider = async (req, res) => {
  try {

    const { bookingId } = req.params;
    const userId = req.userId;
    const role = req.user.role;

    let providerId;
    let providerType;

    /* ---------- DETECT PROVIDER ---------- */

    if (role === "salon_owner") {

      const salon = await Salon.findOne({ owner: userId });

      if (!salon) {
        return res.status(404).json({
          success: false,
          message: "Salon not found"
        });
      }

      providerId = salon._id;
      providerType = "Salon";

    } 
    else if (role === "independent_professional") {

      const independent = await IndependentProfessional.findOne({ user: userId });

      if (!independent) {
        return res.status(404).json({
          success: false,
          message: "Independent professional profile not found"
        });
      }

      providerId = independent._id;
      providerType = "IndependentProfessional";
    }

    /* ---------- FIND BOOKING ---------- */

    const booking = await Booking.findOne({
      _id: bookingId,
      providerId,
      providerType
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "This Booking is not found."
      });
    }

    /* ---------- CHECK STATUS ---------- */

    if (booking.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Booking already ${booking.status}`
      });
    }

    /* ---------- GENERATE SERVICE CODE ---------- */

    const serviceCode = "SRV" + Math.floor(100000 + Math.random() * 900000);

    booking.status = "confirmed";
    booking.serviceCode = serviceCode;

    await booking.save();

    res.status(200).json({
      success: true,
      message: "Booking accepted successfully",
      booking
    });

  } catch (error) {

    console.error("Accept Booking Error:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};




// For provider(salon + independent professional) to reject a pending booking with cancellation reason
export const rejectBookingByProvider = async (req, res) => {
  try {

    const { bookingId } = req.params;
    const { cancellationReason } = req.body;

    const userId = req.userId;
    const role = req.user.role;

    let providerId;
    let providerType;

    /* ---------- DETECT PROVIDER ---------- */

    if (role === "salon_owner") {

      const salon = await Salon.findOne({ owner: userId });

      if (!salon) {
        return res.status(404).json({
          success: false,
          message: "Salon not found"
        });
      }

      providerId = salon._id;
      providerType = "Salon";

    } 
    else if (role === "independent_professional") {

      const independent = await IndependentProfessional.findOne({ user: userId });

      if (!independent) {
        return res.status(404).json({
          success: false,
          message: "Independent professional profile not found"
        });
      }

      providerId = independent._id;
      providerType = "IndependentProfessional";
    }

    /* ---------- FIND BOOKING ---------- */

    const booking = await Booking.findOne({
      _id: bookingId,
      providerId,
      providerType
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found for this provider"
      });
    }

    /* ---------- STATUS CHECK ---------- */

    if (booking.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Booking already ${booking.status}`
      });
    }

    /* ---------- UPDATE BOOKING ---------- */

    booking.status = "cancelled";
    booking.cancellationReason = cancellationReason || "Rejected by provider";

    await booking.save();

    res.status(200).json({
      success: true,
      message: "Booking rejected successfully",
      booking
    });

  } catch (error) {

    console.error("Reject Booking Error:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};