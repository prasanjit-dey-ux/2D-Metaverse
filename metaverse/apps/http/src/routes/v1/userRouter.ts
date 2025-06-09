import { Router } from "express";
import { updateMetadata } from "../../controllers/userController";

export const userRouter = Router();

userRouter.post("/metadata", updateMetadata);

// userRouter.get("/metadata/bulk")