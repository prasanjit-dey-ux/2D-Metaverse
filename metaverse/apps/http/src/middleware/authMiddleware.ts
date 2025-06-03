import { Request, Response, NextFunction} from "express";

declare global {
    namespace Express {
        
    }
}


export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: "No token provided"
        });
    }





}