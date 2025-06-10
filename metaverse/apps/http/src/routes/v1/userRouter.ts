import { Router } from "express";
import { getCurrentUser, updateMetadata } from "../../controllers/userController";

export const userRouter = Router();

userRouter.post("/metadata", updateMetadata);

// userRouter.get("/metadata/bulk");

userRouter.get("/me", getCurrentUser);