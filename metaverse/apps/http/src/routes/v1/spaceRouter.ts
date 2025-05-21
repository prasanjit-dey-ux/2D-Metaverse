import { Router } from "express";

export const spaceRouter = Router();

spaceRouter.post("/");

spaceRouter.get("/:spaceId");

spaceRouter.delete("/:spaceId");

spaceRouter.post("/element");

spaceRouter.delete("/element");

spaceRouter.get("/all");