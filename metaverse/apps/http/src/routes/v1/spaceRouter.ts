import { Router } from "express";
import { requireAuth } from "../../middleware/authMiddleware";
import { createSpace, getAllSpaces, getSpaceById, deleteSpace  } from "../../controllers/spaceController";


export const spaceRouter = Router();

//All route require a valid JWT
spaceRouter.use(requireAuth);
spaceRouter.get("/all", getAllSpaces);
spaceRouter.get("/:id", getSpaceById);
spaceRouter.post("/",createSpace); 
spaceRouter.delete("/:spaceId", deleteSpace );


// spaceRouter.post("/element");

// spaceRouter.delete("/element");