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

// salon management
router.get("/salons", authenticate, isSuperAdmin, getAllSalons);
router.get('/salons/unverified', authenticate, isSuperAdmin, getUnverifiedSalons);
router.patch('/salons/:salonId/verify', authenticate, isSuperAdmin, verifySalonByAdmin);

// category management
router.post("/categories", authenticate, isSuperAdmin, createCategory);
router.get("/categories", authenticate, isSuperAdmin, getAllCategories);
router.patch(
  "/categories/:categoryId",
  authenticate,
  isSuperAdmin,
  editCategory
);

// user management
router.get('/users', authenticate, isSuperAdmin, getAllUsers);
router.patch("/users/:userId/verify", authenticate, isSuperAdmin, verifyUser);
router.patch("/users/:userId/block", authenticate, isSuperAdmin, blockUser);
router.patch(
  "/users/:userId/activate",
  authenticate,
  isSuperAdmin,
  activateUser
);

// offer management
router.post("/offers", authenticate, isSuperAdmin, createOffer);
router.delete("/offers/:offerId", authenticate, isSuperAdmin, deleteOffer);
router.put("/offers/:offerId", authenticate, isSuperAdmin, updateOffer);
router.get("/offers", authenticate, getAllOffers);



// Subscription Plan Management
router.get('/subscription-plans', authenticate, isSuperAdmin, getSubscriptionPlans);
router.post('/subscription-plans', authenticate, isSuperAdmin, createSubscriptionPlan);

// Dashboard Stats
router.get("/dashboard-stats", authenticate, isSuperAdmin, getSuperAdminDashboardStats);

export default router;
