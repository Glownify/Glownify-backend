import { Router } from "express";
import { signup, login, forgotPassword, verifyOTP, resetPassword, superAdminResetPassword } from "../controllers/authController.js";
import { authenticate, isSuperAdmin } from "../middlewares/authMiddleware.js";
import { signupSalonOwner } from "../controllers/authController.js";
import { signupIndependentPro } from "../controllers/authController.js";


const router = Router();

router.post("/signup", signup);
router.post("/login", login);

router.post("/signup-salon-owner", signupSalonOwner);
router.post("/signup-independent-pro", signupIndependentPro);

router.post("/forgot-password", forgotPassword)
router.post("/verify-otp", verifyOTP);           
router.post("/reset-password", resetPassword);

router.post("/reset-password-superadmin", authenticate, isSuperAdmin, superAdminResetPassword);

export default router;
