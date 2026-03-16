// controllers/booking.controller.js
import Booking from "../models/Booking.js";
import ServiceItem from "../models/ServiceItem.js";
import Salon from "../models/Salon.js";
import IndependentProfessional from "../models/IndependentProfessional.js";
import AddOn from "../models/AddOn.js";
import User from "../models/User.js";

export const createBooking = async (req, res) => {
  try {
    const userId = req.userId;
    const { bookings } = req.body;
    console.log("Create Booking Payload:", req.body);

    if (!userId || !bookings?.length) {
      return res.status(400).json({ message: "Invalid booking payload" });
    }

    const createdBookings = [];

    for (const salonBooking of bookings) {
      const { providerId, services, bookingDate, timeSlot, bookingType, serviceLocation } = salonBooking;
      /* ---------- VALIDATE PROVIDER ---------- */

      /* ---------------- FETCH SERVICES ---------------- */
      const serviceDocs = await ServiceItem.find({
        _id: { $in: services },
        providerId: providerId,
      });


      if (serviceDocs.length !== services.length) {
        return res.status(400).json({
          message: "Invalid service selection",
        });
      }

      /* ---------------- PRICE CALCULATION ---------------- */
      let totalAmount = 0;
      const serviceItems = serviceDocs.map((service) => {
        totalAmount += service.price;
        return {
          service: service._id,
          quantity: 1,
          price: service.price,
        };
      });

      console.log("Total Amount:", totalAmount);

      /* ---------------- CREATE BOOKING ---------------- */
      const booking = await Booking.create({
        customer: userId,
        // providerType,
        providerId,
        serviceItems,
        bookingDate,
        timeSlot,
        bookingType,
        serviceLocation: bookingType === "home_service" ? serviceLocation : null,
        totalAmount,
        paymentStatus: "pending",
        status: "pending",
      });

      createdBookings.push(booking);
    }
    console.log("Created Bookings:", createdBookings);
    return res.status(201).json({
      message: "Booking created successfully",
      bookings: createdBookings,
    });
  } catch (error) {
    console.error("Create Booking Error:", error);
    return res.status(500).json({
      message: "Failed to create booking",
      error: error.message,
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

    const { status, page = 1, limit = 10 } = req.query;
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

    if (status) {
      filter.status = status;
    }

    const skip = (page - 1) * limit;

    const bookings = await Booking.find(filter)
      .populate("customer", "name phone")
      .populate("specialist", "name")
      .populate("serviceItems.service", "name price")
      .populate("addons.addon", "name price")
      .sort({ bookingDate: -1 })
      .skip(skip)
      .limit(Number(limit));

    const totalBookings = await Booking.countDocuments(filter);

    res.status(200).json({
      success: true,
      totalBookings,
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