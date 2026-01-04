import {Router} from "express";

import { createState, createCity, getAllStates, getAllCities, getCitiesByState } from "../controllers/stateCityController.js";

const router = Router();

router.post("/create-state", createState);
router.post("/create-city", createCity);
router.get("/get-all-states", getAllStates);
router.get("/get-all-cities", getAllCities);
router.get("/get-cities-by-state/:stateId", getCitiesByState);

export default router;
