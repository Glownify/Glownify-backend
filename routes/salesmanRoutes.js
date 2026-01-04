import { Router } from "express";
import { registerSalesman, getAllSalesman, getDashboardStats, getMySalons } from "../controllers/salesmanController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/register-salesman", authenticate, registerSalesman);
router.get("/get-all-salesman", authenticate, getAllSalesman);

router.get("/dashboard-stats", authenticate, getDashboardStats);

router.get("/get-my-salons", authenticate, getMySalons);

export default router;