import { Router } from "express";
import { createSession, deleteSession, getSession, listMySessions } from "../../controllers/spaceController";
import { requireAuth } from "../../middleware/authMiddleware";


export const spaceRouter = Router();

//All route require a valid JWT
spaceRouter.use(requireAuth);

spaceRouter.post("/", createSession);
spaceRouter.get("/:spaceId", getSession);
spaceRouter.delete("/:spaceId", deleteSession);
spaceRouter.get("/all", listMySessions);

// spaceRouter.post("/element");

// spaceRouter.delete("/element");