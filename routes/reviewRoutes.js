import express from "express";
import { getSalonReviews } from "../controllers/reviewController.js";

const router = express.Router();

// Route to get reviews for a specific salon with pagination
router.get("/salon/:salonId", getSalonReviews);

// router.post('/give-review', authenticate, giveReview);

export default router;