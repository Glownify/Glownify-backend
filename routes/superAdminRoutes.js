import { Router } from "express";
import { authenticate, isSuperAdmin } from "../middlewares/authMiddleware.js";

import {
  createCategory,
  getAllCategories,
  editCategory,
} from "../controllers/categoryController.js";

import {
  createOffer,
  deleteOffer,
  updateOffer,
  getAllOffers,
} from "../controllers/offerController.js";

import { verifyUser, blockUser, activateUser,  getAllUsers } from "../controllers/userController.js";

import { getAllSalons, getUnverifiedSalons, verifySalonByAdmin } from "../controllers/salonController.js";

import {
  getSubscriptionPlans,
  createSubscriptionPlan
} from "../controllers/subscriptionController.js";
import { getSuperAdminDashboardStats } from "../controllers/superAdminController.js";

const router = Router();

router.get("/getAllSalons", authenticate, isSuperAdmin, getAllSalons);
router.post("/create-category", authenticate, isSuperAdmin, createCategory);
router.get("/getAllCategories", authenticate, isSuperAdmin, getAllCategories);
router.patch(
  "/update-category/:categoryId",
  authenticate,
  isSuperAdmin,
  editCategory
);
router.patch("/verify-user/:userId", authenticate, isSuperAdmin, verifyUser);
router.patch("/block-user/:userId", authenticate, isSuperAdmin, blockUser);
router.patch(
  "/activate-user/:userId",
  authenticate,
  isSuperAdmin,
  activateUser
);

router.post("/create-offer", authenticate, isSuperAdmin, createOffer);
router.delete("/delete-offer/:offerId", authenticate, isSuperAdmin, deleteOffer);
router.put("/update-offer/:offerId", authenticate, isSuperAdmin, updateOffer);
router.get("/get-all-offers", authenticate, getAllOffers);

router.get('/get-all-users', authenticate, isSuperAdmin, getAllUsers);

router.get('/get-unverified-salons', authenticate, isSuperAdmin, getUnverifiedSalons);

router.patch('/verify-salon/:salonId', authenticate, isSuperAdmin, verifySalonByAdmin);

// Subscription Plan Management
router.get('/get-subscription-plans', authenticate, isSuperAdmin, getSubscriptionPlans);
router.post('/create-subscription-plan', authenticate, isSuperAdmin, createSubscriptionPlan);

router.get("/dashboard-stats", authenticate, isSuperAdmin, getSuperAdminDashboardStats);

export default router;
