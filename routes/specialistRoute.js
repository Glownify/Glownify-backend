import express from "express";
import { addSpecialist, specialistLogin, resetSpecialistPassword } from "../controllers/specialistController.js";
import { authenticate, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();


/* Specialist Login */

router.post(
    "/login",
    specialistLogin
);

/* Salon owner adds specialist (Salon Owner Protected)*/
router.post(
    "/add-specialist",
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


// router to get all and specific specialist with  ?id 
router.get(
    "/specialists",
    authenticate,
    authorizeRoles("salon_owner"),
    getSpecialists
);

export default router;