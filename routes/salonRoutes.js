import express from "express";
import { getSalonByID } from "../controllers/salonController.js";
import { getSalonServices } from "../controllers/salonController.js";
import { authenticate, isSuperAdmin, isSalonOwner, authorizeRoles } from "../middlewares/authMiddleware.js";
import { getAllSalons, getUnverifiedSalons, verifySalonByAdmin, getFeaturedSalons } from "../controllers/salonController.js";
import { getNearbySalons } from "../controllers/salonController.js";
import { getSalonOwnerDashboard } from "../controllers/dashboardController.js";
import { getSalonProfileDashboard } from "../controllers/salonController.js";

const router = express.Router();

// router.get("/services/:salonId", getSalonServices);

// router.get("/featured", getFeaturedSalons);

// router.get("/home", getHomeSalonsByCategory);

// router.get("/category/:categoryId", getAllSalonsByCategory);

//PUBLIC ROUTES
router.get("/nearby", getNearbySalons);
// Route to get basic salon details by id
router.get("/:salonId", getSalonByID);


// SUPER ADMIN PROTECTED
router.get("/", authenticate, isSuperAdmin, getAllSalons);
router.get("/unverified", authenticate, isSuperAdmin, getUnverifiedSalons);
router.patch("/:salonId/verify", authenticate, isSuperAdmin, verifySalonByAdmin);


// SALON ADMIN PROTECTED
router.get(
    "/owner/dashboard",
    authenticate,
    authorizeRoles("salon_owner"),
    getSalonOwnerDashboard
);



router.get(
    "/profile/mysalon",
    authenticate,
    authorizeRoles("salon_owner"),
    getSalonProfileDashboard
);



export default router;


// Example of routes that connected to salonController.js.
// so we neet make specific routes file for specift controller. Review Controller <-> reviewRoutes.js, Salon Controller <-> salonRoutes.js, Independent Pro Controller <-> independentProRoutes.js, Service Item Controller <-> serviceItemRoutes.js, Category Controller <-> categoryRoutes.js, User Controller <-> userRoutes.js

// PUBLIC
// router.get("/:salonId", getSalonBasicDetails);
// router.get("/:salonId/services", getSalonServices);
// router.get("/:salonId/reviews", getSalonReviews);

// // // SALON ADMIN
// router.post("/", auth, isSalonAdmin, createSalon);
// router.put("/:salonId", auth, isSalonAdmin, updateSalon);



