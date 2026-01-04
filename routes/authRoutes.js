import { Router } from "express";
import { signup, login, forgotPassword, verifyOTP, resetPassword, superAdminResetPassword } from "../controllers/authController.js";
import { authenticate, isSuperAdmin } from "../middlewares/authMiddleware.js";


const router = Router();

router.post("/signup", signup);
router.post("/login", login);

router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOTP);           
router.post("/reset-password", resetPassword);

router.post("/reset-password-superadmin", authenticate, isSuperAdmin, superAdminResetPassword);

export default router;
