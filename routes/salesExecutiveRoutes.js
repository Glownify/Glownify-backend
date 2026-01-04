import { Router } from "express";

import { registerSalesExecutive, getAllSalesExecutives, getSalesExecutivesByCity, getSalesExecutiveDashboardStats } from "../controllers/salesExecutiveController.js";
import { authenticate, isSuperAdmin } from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/register", authenticate, isSuperAdmin, registerSalesExecutive);
router.get("/city/:cityId", getSalesExecutivesByCity);
router.get("/all-sales-executives", authenticate, isSuperAdmin, getAllSalesExecutives);

router.get("/dashboard-stats", authenticate, getSalesExecutiveDashboardStats);

export default router;