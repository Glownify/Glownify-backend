import { Router } from 'express';
import { authenticate, isSuperAdmin } from '../middlewares/authMiddleware.js';
import { verifyUser, blockUser, activateUser, getAllUsers } from '../controllers/userController.js';

const router = Router();

// SUPER ADMIN PROTECTED
router.get("/", authenticate, isSuperAdmin, getAllUsers);
router.patch("/:userId/verify", authenticate, isSuperAdmin, verifyUser);
router.patch("/:userId/block", authenticate, isSuperAdmin, blockUser);
router.patch("/:userId/activate", authenticate, isSuperAdmin, activateUser);

export default router;