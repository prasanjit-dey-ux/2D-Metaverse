import { Router } from "express";
import { authRouter } from "./authRouter";
import { userRouter } from "./userRouter";
import { adminRouter } from "./adminRouter";
import { avatarRouter } from "./avatarRouter";
import { spaceRouter } from "./spaceRouter";
import { elementRouter } from "./elementRouter";
import { requireAuth } from "../../middleware/authMiddleware";

export const router = Router();

router.use("/auth", authRouter);

router.use("/user", requireAuth, userRouter);
// router.use("/admin",adminRouter);
// router.use("/avatar", avatarRouter);
// router.use("/space", spaceRouter);
// router.use("/elements", elementRouter);

