// apps/http/src/routes/v1/index.ts
import { Router } from "express";
import { authRouter } from "./authRouter";
import { userRouter } from "./userRouter";
import { adminRouter } from "./adminRouter";
import { avatarRouter } from "./avatarRouter";
import { spaceRouter } from "./spaceRouter";
import { elementRouter } from "./elementRouter";
import { mapRouter } from "./mapRouter";

export const router = Router(); // This is the correct 'router' that 'index.ts' imports

router.use("/auth", authRouter);
router.use("/user", userRouter);
router.use("/space", spaceRouter);
router.use("/map", mapRouter);


// router.use("/admin",adminRouter);
// router.use("/avatar", avatarRouter);
// router.use("/elements", elementRouter);
