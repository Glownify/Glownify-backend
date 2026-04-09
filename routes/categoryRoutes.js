import { Router } from "express";
import { authenticate, isSuperAdmin } from "../middlewares/authMiddleware.js";
import {getAllCategories, createCategory, updateCategory, getSalonServiceCategories } from "../controllers/categoryController.js";

const router = Router();

// NEW ENDPOINT TO GET CATEGORY
router.get('/', getAllCategories); // public

// public API to get service categories offered by a specific salon (for customers)
router.get('/salon/:salonId', getSalonServiceCategories); 

// router.get('/:id', getSingleCategory);
// router.post('/', createCategory);
// router.put('/:id', updateCategory);
// router.delete('/:id', deleteCategory);

// PROTECTED ROUTES FOR SUPER ADMIN
router.post("/", authenticate, isSuperAdmin, createCategory);
router.get('/', getAllCategories);
router.patch("/:categoryId", authenticate, isSuperAdmin, updateCategory);


export default router;
