import express from "express";
// import { getSalonServiceItems } from "../controllers/serviceItemController.js";
import { addServiceItem, getProviderServiceItems, getServiceItemById, updateServiceItem, deleteServiceItem } from "../controllers/serviceItemController.js";
import { authenticate, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();


// API to get service item details by ID (public)
router.get(
    "/:id",
    getServiceItemById
);

// ✅ ADD SERVICE ITEM (Salon Owner)
router.post(
    "/",
    authenticate,
    authorizeRoles("salon_owner", "independent_professional"),
    addServiceItem
);


// ✅ GET SERVICES ITEMS BY PROVIDER (Salon Owner & Independent Professional)
router.get(
    "/provider",
    authenticate,
    authorizeRoles("salon_owner", "independent_professional"),
    getProviderServiceItems
);

// ✅ UPDATE SERVICE ITEM and INDEPENDENT PROFESSIONAL (Salon Owner)
router.patch(
    "/:id",
    authenticate,
    authorizeRoles("salon_owner", "independent_professional"),
    updateServiceItem
);


router.delete(
    "/:id",
    authenticate,
    authorizeRoles("salon_owner", "independent_professional"),
    deleteServiceItem
);

export default router;