import Router from "express";
import {
  createBooking,
  getBookingBySalonId,
  getBookingByUserId,
} from "../controllers/bookingController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/create-booking", authenticate, createBooking);
router.get("/get-my-bookings", authenticate, getBookingByUserId);
router.get("/get-salon-bookings", authenticate, getBookingBySalonId);

export default router;
