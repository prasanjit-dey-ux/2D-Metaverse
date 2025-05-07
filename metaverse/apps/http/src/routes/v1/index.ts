import { Router } from "express";
import { authRouter } from "./authRouter";
import { userRouter } from "./userRouter";
import { spaceRouter } from "./spaceRouter";
import { elementRouter } from "./elementRouter";
import { adminRouter } from "./adminRouter";

export const router = Router();

router.use("/auth", authRouter);
router.use("/user", userRouter);
router.use("/space", spaceRouter);
router.use("/element,", elementRouter);
router.use("/admin", adminRouter)