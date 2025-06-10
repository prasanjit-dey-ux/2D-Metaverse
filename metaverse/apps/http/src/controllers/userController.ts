import { Request, Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware"
import { userMetadataSchema } from "../types/userSchema";
import { updateUserMetadata } from "../service/userService";

export const updateMetadata = async ( req: Request, res: Response):Promise<void> => {
    const authReq = req as AuthRequest;
    const parsed = userMetadataSchema.safeParse(req.body);

    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.errors });
        return;
    }

    try {
        const user = await updateUserMetadata(authReq.userId, parsed.data);

        res.json({ success: true, user });
        return;
    } catch (err: any) {
        if(err.message === "Username or tag already taken") {
            res.status(409).json({ error: err.message });
            return;
        }
        console.error(err);
        res.status(500).json({ error: "Failed to update profile" });
        return ;
    }
};

export const getCurrentUser = (req: Request, res: Response) => {
    const { user } = req as AuthRequest;
    // user comes fromt requireAuth middleware
    res.json({ user });
}