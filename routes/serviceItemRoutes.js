import express from "express";
import { getSalonServiceItems } from "../controllers/serviceItemController.js";

const router = express.Router();

// GET salon services by category & mode
router.get("/salon/:salonId", getSalonServiceItems);


// router.get(
//     "/salon/:salonId/category/:categoryId",
//     getServiceItemsByCategory
// );

export default router;