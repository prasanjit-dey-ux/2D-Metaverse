import { Request, Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import * as SpaceService from "../service/spaceService"

export const createSession = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as AuthRequest).userId;
        const space = await SpaceService.createSpace(userId, req.body);
        res.json({ success: true, space});
    } catch (err: any) {
        console.error("createSession error", err);
        res.status(400).json({ error: err.message});
    }
};

export const listMySessions = async (req: Request, res: Response): Promise<void> => {
    try{
        const userId = (req as AuthRequest).userId;
        const sessions = await SpaceService.listMySpace(userId);
        res.json({ sessions }); 
    } catch(err) {
        console.error("listMySessions error", err);
        res.status(500).json({ error: "Failed to list sessions"})
    }
};

export const deleteSession = async (req: Request, res: Response): Promise<void> => {
    try{
        const userId = (req as AuthRequest).userId;
        const spaceId = req.params.id;
        await SpaceService.deleteSpace(userId, spaceId);
        res.json({ success: true });
    }catch (err: any) {
        console.error("deleteSession error", err);
        res.status(err.message === "Not authorized" ? 403 : 400).json({ error: err.message });
    }
};

export const getSession = async (req: Request, res: Response): Promise<void> => {
    try{
        const spaceId = req.params.id;
        const space = await SpaceService.getSpaceDetails(spaceId);
        res.json({ space })
    } catch(err: any) {
        console.error("getSession error:", err);
        res.status(404).json({ error: err.message });
    }
};