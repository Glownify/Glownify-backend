import express from "express";
import { addSpecialist, specialistLogin, resetSpecialistPassword, getAllSpecialists, getSpecialistById } from "../controllers/specialistController.js";
import { authenticate, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();


/* Specialist Login */

router.post(
    "/login",
    specialistLogin
);

/* Salon owner adds specialist (Salon Owner Protected)*/
router.post(
    "/",
    authenticate,
    authorizeRoles("salon_owner"),
    addSpecialist
);


// Salon owner resets specialist password (Salon Owner Protected)
router.patch(
    "/:id/reset-password",
    authenticate,
    authorizeRoles("salon_owner"),
    resetSpecialistPassword
);


// router to get all specialist
router.get(
    "/",
    authenticate,
    authorizeRoles("salon_owner"),
    getAllSpecialists
);

router.get(
    "/:id",
    authenticate,
    authorizeRoles("salon_owner"),
    getSpecialistById
);




export default router;