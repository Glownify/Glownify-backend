import express from "express";
import { createOffer, getAllOffers, updateOffer, deleteOffer } from "../controllers/offerController.js";
import { authenticate, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", authenticate, authorizeRoles("salon_owner", "independent_professional"), createOffer);
router.get("/", authenticate, authorizeRoles("salon_owner", "independent_professional"), getAllOffers);
router.patch("/:offerId", authenticate, authorizeRoles("salon_owner", "independent_professional"), updateOffer);
router.delete("/:offerId", authenticate, authorizeRoles("salon_owner", "independent_professional"), deleteOffer);

export default router;
