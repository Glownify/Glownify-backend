import Router from "express";
import {
  createBooking,
  getBookingBySalonId,
  getBookingByUserId,
  getBookingsByProvider,
  acceptBookingByProvider,
  rejectBookingByProvider,
} from "../controllers/bookingController.js";
import { authenticate, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/create-booking", authenticate, createBooking);
router.get("/get-my-bookings", authenticate, getBookingByUserId);
router.get("/get-salon-bookings", authenticate, getBookingBySalonId);

/*
  Salon Owner + Independent Professional
  → Get their bookings
*/
router.get(
  "/provider",
  authenticate,
  authorizeRoles("salon_owner", "independent_pro"),
  getBookingsByProvider
);

// Salon Owner + Independent Professional → Accept a pending booking and generate service code
router.patch(
  "/provider/accept-booking/:bookingId",
  authenticate,
  authorizeRoles("salon_owner", "independent_professional"),
  acceptBookingByProvider
);


// Salon Owner + Independent Professional → Reject a pending booking with cancellation reason
router.patch(
  "/provider/reject-booking/:bookingId",
  authenticate,
  authorizeRoles("salon_owner", "independent_professional"),
  rejectBookingByProvider
);

export default router;
