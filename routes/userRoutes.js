import { Router } from 'express';
import { giveReview } from '../controllers/userController.js';
import { getAllCategories } from '../controllers/categoryController.js';
import { getFeaturedSalons, getNearbySalons, getHomeSalonsByCategory, getSalonById, getAllSalonsByCategory } from '../controllers/salonController.js';
import { getHomeIndependentPros } from "../controllers/independentProController.js";
import { getServiceItemsByCategory } from '../controllers/serviceItemController.js';

const router = Router();

router.post('/give-review', giveReview);
router.get('/get-featured-salons', getFeaturedSalons);
router.get('/get-nearby-salons', getNearbySalons);
router.get('/get-all-categories', getAllCategories);
router.get('/get-all-salons-by-category', getAllSalonsByCategory);

router.get('/get-home-salons', getHomeSalonsByCategory);
router.get("/get-home-independentpros", getHomeIndependentPros);
router.get('/get-salon/:salonId', getSalonById);
router.get('/get-serviceItems-by-category/:salonId/:categoryId', getServiceItemsByCategory);

export default router;