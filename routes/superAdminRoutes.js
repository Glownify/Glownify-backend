import { Router } from "express";
import { authenticate, isSuperAdmin } from "../middlewares/authMiddleware.js";

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

// Subscription Plan Management
router.get('/subscription-plans', authenticate, isSuperAdmin, getSubscriptionPlans);
router.post('/subscription-plans', authenticate, isSuperAdmin, createSubscriptionPlan);

// Dashboard Stats
router.get("/dashboard-stats", authenticate, isSuperAdmin, getSuperAdminDashboardStats);

export default router;
