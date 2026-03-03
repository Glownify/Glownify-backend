import { Router } from 'express';
import { giveReview } from '../controllers/userController.js';
import { authenticate, isSuperAdmin } from '../middlewares/authMiddleware.js';
import { getFeaturedSalons, getNearbySalons, getHomeSalonsByCategory, getAllSalonsByCategory } from '../controllers/salonController.js';
import { getHomeIndependentPros } from "../controllers/independentProController.js";
import { getServiceItemsByCategory } from '../controllers/serviceItemController.js';
import { verifyUser, blockUser, activateUser, getAllUsers } from '../controllers/userController.js';

const router = Router();

// SUPER ADMIN PROTECTED
router.get("/", authenticate, isSuperAdmin, getAllUsers);
router.patch("/:userId/verify", authenticate, isSuperAdmin, verifyUser);
router.patch("/:userId/block", authenticate, isSuperAdmin, blockUser);
router.patch("/:userId/activate", authenticate, isSuperAdmin, activateUser);

export default router;