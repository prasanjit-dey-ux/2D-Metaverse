import { Router } from "express";
import { requireAuth } from "../../middleware/authMiddleware";
import { getAllMaps } from "../../controllers/mapController";

export const mapRouter = Router();

mapRouter.use(requireAuth);

mapRouter.get("/all",getAllMaps);