import { Router } from "express";
import { getCurrentUser, updateMetadata } from "../../controllers/userController";
import { requireAuth } from "../../middleware/authMiddleware";

export const userRouter = Router();

userRouter.use(requireAuth);

//Route for updating user metadata (profile)
userRouter.put("/update-profile", updateMetadata);

// Route for getting the current user's profile data
userRouter.get("/me", getCurrentUser);