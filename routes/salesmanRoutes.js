import { Router } from "express";
import { registerSalesman, getAllSalesman, getDashboardStats, getMySalons } from "../controllers/salesmanController.js";
import { authenticate, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = Router();

// Salesman routes

// Only super_admin and sales_executive can register a salesman and view all salesmen
router.post("/register-salesman", authenticate, authorizeRoles("sales_executive"), registerSalesman);
router.get("/get-all-salesman", authenticate, authorizeRoles("super_admin", "sales_executive"), getAllSalesman);


router.get("/dashboard-stats", authenticate, getDashboardStats);

router.get("/get-my-salons", authenticate, getMySalons);

export default router;