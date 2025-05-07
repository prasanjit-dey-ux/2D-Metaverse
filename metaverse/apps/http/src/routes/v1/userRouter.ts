import { Router } from "express";

export const userRouter = Router();

userRouter.post("/metadata");

userRouter.get("/metadata/bulk")