import {Router} from "express";
import { getHomeIndependentPros } from "../controllers/independentProController.js";

const router = Router();

router.get("/get-home-independentpros", getHomeIndependentPros);

export default router;

