import {Router} from "express";
import { getHomeIndependentPros } from "../controllers/independentProController.js";

const router = Router();

// Route to get home independent pros with pagination
router.get("/home", getHomeIndependentPros);


export default router;

