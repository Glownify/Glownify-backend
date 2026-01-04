// controllers/booking.controller.js
import Booking from "../models/Booking.js";
import ServiceItem from "../models/ServiceItem.js";
import Salon from "../models/Salon.js";

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


