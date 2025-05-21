import { Router } from "express";

export const adminRouter = Router();

adminRouter.post("/element");

adminRouter.put("/element/:elementId");

adminRouter.post("/avatar");

adminRouter.post("/map");