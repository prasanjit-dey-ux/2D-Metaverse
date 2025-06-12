import { Router } from "express";
import { getCurrentUser, updateMetadata } from "../../controllers/userController";
import { requireAuth } from "../../middleware/authMiddleware";

export const userRouter = Router();

userRouter.use(requireAuth);

userRouter.post("/metadata", updateMetadata);

// userRouter.get("/metadata/bulk");

userRouter.get("/me", getCurrentUser);