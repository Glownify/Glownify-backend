import { Router } from 'express';
import { authenticate, isSuperAdmin } from '../middlewares/authMiddleware.js';
import { verifyUser, blockUser, activateUser, getAllUsers, getMyProfile, updateMyProfile } from '../controllers/userController.js';
import uploadMiddleware from '../middlewares/uploadMiddleware.js';

const router = Router();

// USER PROFILE
router.get("/me", authenticate, getMyProfile);
router.put("/me", authenticate, uploadMiddleware.fields([{ name: "profilePhoto", maxCount: 1 }]), updateMyProfile);

// SUPER ADMIN PROTECTED
router.get("/", authenticate, isSuperAdmin, getAllUsers);
router.patch("/:userId/verify", authenticate, isSuperAdmin, verifyUser);
router.patch("/:userId/block", authenticate, isSuperAdmin, blockUser);
router.patch("/:userId/activate", authenticate, isSuperAdmin, activateUser);

export default router;