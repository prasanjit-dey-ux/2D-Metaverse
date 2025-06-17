// apps/http/src/middleware/authMiddleware.ts

import { Request, Response, NextFunction } from "express";
import client from "@metaverse/db/client"; 
import { verifyJWT, JwtPayload } from "@metaverse/utils"; 

export interface AuthRequest extends Request {
    userId: string; 
    user: { 
        id: string;
        email: string;
        username: string;
        tag: string;
        displayName?: string | null;   
        profileImageUrl?: string | null; 
        bannerImageUrl?: string | null; 
        bio?: string | null;           
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
        } catch (jwtError) { 
            console.error("JWT verification failed:", jwtError); 
            res.status(401).json({ error: "Invalid or expired token" });
            return;
        }

        // Fetch the user from the database
        let user = await client.user.findUnique({ // Use 'let' to allow re-assignment
            where: { id: payload.userId},
            select: {
                id: true,
                email: true,
                username: true,
                tag: true,
                displayName: true,
                profileImageUrl: true,
                bannerImageUrl: true, 
                bio: true,            
                isProfileComplete: true,
            }
        });

        if (!user) {
            res.status(401).json({ error: "User not found" }); 
            return;
        }

        // NEW: Update lastLoginAt on every authenticated request
        user = await client.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() }
        });

        const authReq = req as AuthRequest;
        authReq.userId = user.id; 
        authReq.user = {
            ...user,
            displayName: user.displayName === null ? undefined : user.displayName,
            profileImageUrl: user.profileImageUrl === null ? undefined : user.profileImageUrl,
            bannerImageUrl: user.bannerImageUrl === null ? undefined : user.bannerImageUrl,
            bio: user.bio === null ? undefined : user.bio,
        };

        next();
    } catch (err) {
        console.error("Error in requireAuth middleware:", err); 
        res.status(500).json({ error: "Internal server error during authentication" }); 
    }
};
