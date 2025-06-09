import { NextFunction, Request, Response } from "express";
import client from "@metaverse/db/client"
import { verifyJWT, JwtPayload } from "@metaverse/utils";

export interface AuthRequest extends Request {
    userId: string;
    user: {
        id: string;
        email: string;
        username: string;
        tag: string;
        displayName?: string;
        profileImageUrl?: string;
        bannerImageUrl?: string;
        isProfileComplete: boolean;
    };
}

export const requireAuth = async (
    req: Request,
    res: Response, 
    next: NextFunction
):Promise<void> => {
    try {
        const header = req.header("Authorization") || "";
        if (!header.startsWith("Bearer ")) {
             res.status(401).json({ error: "Missing Authorization header"});
             return;
        }

        const token = header.replace("Bearer ", "");
        let payload: JwtPayload;
        try {
            payload = verifyJWT(token);
        } catch { 
             res.status(401).json({ error: "Invalid or expired token" });
             return;
        }

        const user = await client.user.findUnique({
            where: { id: payload.userId},
            select: {
                id: true,
                email: true,
                username: true,
                tag: true,
                displayName: true,
                profileImageUrl: true,
                bannerImageUrl: true,
                isProfileComplete: true,
            }
        });

        if (!user) {
             res.status(401).json({ error: "User not found" });
             return;
        }

        const authReq = req as AuthRequest;
        authReq.userId = user.id;
        authReq.user = {
            ...user,
            displayName: user.displayName ?? undefined,
            profileImageUrl: user.profileImageUrl ?? undefined,
            bannerImageUrl: user.bannerImageUrl ?? undefined
        };

        next();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
};